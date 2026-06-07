import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { isLocale, type Locale } from "@/lib/i18n";
import type { HrDocumentKind } from "@/lib/hr-documents";
import { COLS, TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import { ensureWorkspace } from "@/lib/workspace-server";
import type { BranchSettings, Employee, LegalCountry } from "@/lib/types";

const VALID_KINDS: HrDocumentKind[] = [
  "employment_contract",
  "gdpr_consent",
  "id_copy",
  "bank_details",
  "health_declaration",
  "hygiene_certificate",
  "work_rules",
  "overtime_consent",
  "intern_agreement",
  "social_security",
  "modelo145",
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const employeeId = body.employee_id as string | undefined;
    const kind = body.kind as HrDocumentKind | undefined;
    const locale: Locale =
      typeof body.locale === "string" && isLocale(body.locale)
        ? body.locale
        : "en";

    if (!employeeId || !kind || !VALID_KINDS.includes(kind)) {
      return NextResponse.json(
        { error: "employee_id and valid kind required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY missing" },
        { status: 500 }
      );
    }

    const workspaceId = await ensureWorkspace();
    const supabase = await createServerClient();
    const [{ data: employee, error: empError }, { data: branch }] =
      await Promise.all([
        supabase
          .from(TABLES.employees)
          .select("*")
          .eq("id", employeeId)
          .eq(COLS.workspaceId, workspaceId)
          .single(),
        supabase
          .from(TABLES.branchSettings)
          .select("*")
          .eq(COLS.workspaceId, workspaceId)
          .maybeSingle(),
      ]);

    if (empError || !employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const emp = employee as Employee;
    const settings = branch as BranchSettings | null;
    const country = (settings?.legal_country ?? "sk") as LegalCountry;

    const langName =
      locale === "sk" ? "Slovak" : locale === "es" ? "Spanish" : "English";

    const anthropic = new Anthropic({ apiKey });

    const prompt = `You are an HR legal assistant for a café. Write a ready-to-sign HR document draft in ${langName}.

Document type: ${kind}
Country labor law: ${country === "sk" ? "Slovakia" : "Spain"}
Employer / branch: ${settings?.branch_name ?? "Café"}
Employee:
- Name: ${emp.name}
- Role: ${emp.role}
- Contract: ${emp.contract_type}
- Max hours/week: ${emp.max_hours_per_week}
- Hourly rate: €${emp.hourly_rate}
- Email: ${emp.email}
- Phone: ${emp.phone || "—"}

Requirements:
1. Write formal but plain language a barista can understand.
2. Include placeholders in [BRACKETS] only where real data is still unknown (e.g. [ADDRESS], [START_DATE]).
3. Add a short section "Čo podpisujete a prečo" / "What you sign and why" (in ${langName}) with 3–4 bullet points.
4. For id_copy or bank_details types, write a cover sheet / checklist instead of fake ID data.
5. Output plain text only — no markdown fences.
6. Length: appropriate for the document type (contract ~400–800 words, consent forms shorter).`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "AI returned no text" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      kind,
      employee_id: employeeId,
      title: kind,
      text: textBlock.text.trim(),
    });
  } catch (e) {
    console.error("generate-document-text:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}
