import { NextResponse } from "next/server";
import {
  buildMissingDocumentsMessage,
  findManagerSender,
} from "@/lib/document-notifications";
import { translate, isLocale, type Locale } from "@/lib/i18n";
import { COLS, TABLES } from "@/lib/db";
import { sendPushToEmployee } from "@/lib/push-server";
import { createServerClient } from "@/lib/supabase/server";
import {
  ensureWorkspace,
  getWorkspaceEmployeeIds,
} from "@/lib/workspace-server";
import type { BranchSettings, Employee, HrDocument, LegalCountry } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const employeeId =
      typeof body.employee_id === "string" ? body.employee_id : null;
    const locale: Locale =
      typeof body.locale === "string" && isLocale(body.locale)
        ? body.locale
        : "en";

    const t = (key: string, params?: Record<string, string | number>) =>
      translate(locale, key, params);

    const workspaceId = await ensureWorkspace();
    const employeeIds = await getWorkspaceEmployeeIds(workspaceId);
    const supabase = createServerClient();

    const [{ data: staff }, { data: documents }, { data: branch }] =
      await Promise.all([
        supabase
          .from(TABLES.employees)
          .select("*")
          .eq(COLS.workspaceId, workspaceId)
          .order("name"),
        employeeIds.length > 0
          ? supabase
              .from(TABLES.hrDocuments)
              .select("*")
              .in(COLS.employeeId, employeeIds)
          : Promise.resolve({ data: [] }),
        supabase
          .from(TABLES.branchSettings)
          .select("legal_country")
          .eq(COLS.workspaceId, workspaceId)
          .maybeSingle(),
      ]);

    const employees = (staff ?? []) as Employee[];
    const docs = (documents ?? []) as HrDocument[];
    const country = ((branch as BranchSettings | null)?.legal_country ??
      "sk") as LegalCountry;

    const sender = findManagerSender(employees);
    if (!sender) {
      return NextResponse.json({ error: "No employees found" }, { status: 400 });
    }

    const targets = employeeId
      ? employees.filter((e) => e.id === employeeId)
      : employees;

    const notified: Array<{
      employeeId: string;
      name: string;
      missing: number;
      pushSent: number;
    }> = [];

    for (const employee of targets) {
      const { hasMissing, content, missingCount } = buildMissingDocumentsMessage(
        employee,
        docs,
        country,
        t
      );
      if (!hasMissing) continue;

      const { data: prefs } = await supabase
        .from(TABLES.notificationPreferences)
        .select("document_reminder")
        .eq("employee_id", employee.id)
        .maybeSingle();

      if (prefs && prefs.document_reminder === false) continue;

      const { error: msgError } = await supabase.from(TABLES.messages).insert({
        sender_id: sender.id,
        recipient_id: employee.id,
        content,
        read: false,
      });

      if (msgError) {
        console.error("message insert:", msgError);
        continue;
      }

      const pushTitle = t("documents.reminderTitle");
      const pushBody = t("documents.reminderPush", {
        count: missingCount,
      });
      const pushSent = await sendPushToEmployee(
        employee.id,
        pushTitle,
        pushBody,
        "/documents"
      );

      notified.push({
        employeeId: employee.id,
        name: employee.name,
        missing: missingCount,
        pushSent,
      });
    }

    return NextResponse.json({
      success: true,
      notified,
      count: notified.length,
    });
  } catch (e) {
    console.error("notify-missing-documents:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}
