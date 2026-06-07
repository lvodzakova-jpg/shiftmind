import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import {
  buildDocumentChecklist,
  getTeamDocumentSummary,
  type HrDocumentKind,
} from "@/lib/hr-documents";
import { TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import type { Employee, HrDocument, LegalCountry } from "@/lib/types";

interface AiNote {
  kind: HrDocumentKind;
  note: string;
}

function extractJsonArray(text: string): AiNote[] {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1].trim() : text.trim();
  const parsed = JSON.parse(raw) as { notes?: AiNote[] } | AiNote[];
  if (Array.isArray(parsed)) return parsed;
  return parsed.notes ?? [];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const employeeId =
      typeof body.employee_id === "string" ? body.employee_id : null;
    const locale = typeof body.locale === "string" ? body.locale : "en";

    const supabase = createServerClient();

    const [
      { data: employees, error: empError },
      { data: documents, error: docError },
      { data: branchRow, error: branchError },
    ] = await Promise.all([
      supabase.from(TABLES.employees).select("*").order("name"),
      supabase.from(TABLES.hrDocuments).select("*"),
      supabase.from(TABLES.branchSettings).select("legal_country").limit(1).maybeSingle(),
    ]);

    if (empError || docError || branchError) {
      return NextResponse.json(
        {
          error:
            empError?.message ?? docError?.message ?? branchError?.message,
        },
        { status: 500 }
      );
    }

    const staff = (employees ?? []) as Employee[];
    const docs = (documents ?? []) as HrDocument[];
    const country = (branchRow?.legal_country ?? "sk") as LegalCountry;

    const targets = employeeId
      ? staff.filter((e) => e.id === employeeId)
      : staff;

    if (targets.length === 0) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    const checklists = targets.map((employee) => ({
      employee: {
        id: employee.id,
        name: employee.name,
        role: employee.role,
        contract_type: employee.contract_type,
      },
      items: buildDocumentChecklist(employee, docs, country),
    }));

    const apiKey = process.env.ANTHROPIC_API_KEY;
    let aiNotes: AiNote[] = [];

    if (apiKey) {
      const anthropic = new Anthropic({ apiKey });
      const summary = checklists.map((c) => ({
        name: c.employee.name,
        contract: c.employee.contract_type,
        missing: c.items
          .filter((i) => i.status === "missing")
          .map((i) => i.kind),
      }));

      const prompt = `You are an HR assistant for a café. Country: ${country}. Locale: ${locale}.
For each missing document kind below, write ONE short practical sentence (max 120 chars) for the employee explaining why they must sign/submit it. Use the locale language (sk/en/es).

Missing documents per employee:
${JSON.stringify(summary, null, 2)}

Reply ONLY with JSON array:
[{ "kind": "employment_contract", "note": "..." }]

Include only kinds that appear in the missing lists.`;

      try {
        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 2048,
          messages: [{ role: "user", content: prompt }],
        });
        const textBlock = message.content.find((b) => b.type === "text");
        if (textBlock && textBlock.type === "text") {
          aiNotes = extractJsonArray(textBlock.text);
        }
      } catch (e) {
        console.error("analyze-documents AI:", e);
      }
    }

    const noteMap = new Map(aiNotes.map((n) => [n.kind, n.note]));

    const enriched = checklists.map((c) => ({
      ...c,
      items: c.items.map((item) => ({
        ...item,
        aiNote: noteMap.get(item.kind) ?? null,
      })),
    }));

    const teamSummary = getTeamDocumentSummary(staff, docs, country);

    return NextResponse.json({
      success: true,
      country,
      checklists: enriched,
      teamSummary: teamSummary.map((s) => ({
        employeeId: s.employee.id,
        name: s.employee.name,
        missing: s.missing,
        total: s.total,
      })),
    });
  } catch (e) {
    console.error("analyze-documents:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}
