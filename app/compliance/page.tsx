export const dynamic = "force-dynamic";

import { CompliancePageView } from "@/components/views/CompliancePageView";
import { COLS, TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import type { BranchSettings, HrDocument, Shift, Staff } from "@/lib/types";
import {
  ensureWorkspace,
  getWorkspaceEmployeeIds,
} from "@/lib/workspace-server";
import { formatDateISO, getWeekEnd, getWeekStart } from "@/lib/week";

interface PageProps {
  searchParams: Promise<{ week?: string }>;
}

export default async function CompliancePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const weekStart =
    params.week && /^\d{4}-\d{2}-\d{2}$/.test(params.week)
      ? params.week
      : formatDateISO(getWeekStart());
  const weekEnd = getWeekEnd(weekStart);
  const workspaceId = await ensureWorkspace();
  const employeeIds = await getWorkspaceEmployeeIds(workspaceId);

  const supabase = await createServerClient();
  const [{ data: staff }, { data: shifts }, { data: documents }, { data: branch }] =
    await Promise.all([
      supabase
        .from(TABLES.employees)
        .select("*")
        .eq(COLS.workspaceId, workspaceId)
        .order("name"),
      employeeIds.length > 0
        ? supabase
            .from(TABLES.shifts)
            .select("*")
            .in(COLS.employeeId, employeeIds)
            .gte("date", weekStart)
            .lte("date", weekEnd)
        : Promise.resolve({ data: [] as Shift[] }),
      employeeIds.length > 0
        ? supabase
            .from(TABLES.hrDocuments)
            .select("*")
            .in(COLS.employeeId, employeeIds)
        : Promise.resolve({ data: [] as HrDocument[] }),
      supabase
        .from(TABLES.branchSettings)
        .select("*")
        .eq(COLS.workspaceId, workspaceId)
        .maybeSingle(),
    ]);

  return (
    <CompliancePageView
      weekStart={weekStart}
      staff={(staff ?? []) as Staff[]}
      shifts={(shifts ?? []) as Shift[]}
      documents={(documents ?? []) as HrDocument[]}
      branchSettings={(branch as BranchSettings | null) ?? null}
    />
  );
}
