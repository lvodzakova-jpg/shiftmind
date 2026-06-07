export const dynamic = "force-dynamic";

import { DocumentsPageView } from "@/components/views/DocumentsPageView";
import { COLS, TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import type { BranchSettings, HrDocument, LegalCountry, Staff } from "@/lib/types";
import {
  ensureWorkspace,
  getWorkspaceEmployeeIds,
} from "@/lib/workspace-server";

export default async function DocumentsPage() {
  const workspaceId = await ensureWorkspace();
  const employeeIds = await getWorkspaceEmployeeIds(workspaceId);
  const supabase = await createServerClient();
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
            .order("uploaded_at", { ascending: false })
        : Promise.resolve({ data: [] as HrDocument[] }),
      supabase
        .from(TABLES.branchSettings)
        .select("legal_country")
        .eq(COLS.workspaceId, workspaceId)
        .maybeSingle(),
    ]);

  return (
    <DocumentsPageView
      staff={(staff ?? []) as Staff[]}
      documents={(documents ?? []) as HrDocument[]}
      legalCountry={
        ((branch as BranchSettings | null)?.legal_country ?? "sk") as LegalCountry
      }
    />
  );
}
