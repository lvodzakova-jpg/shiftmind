export const dynamic = 'force-dynamic';
import { ScheduleView } from "@/components/views/ScheduleView";
import { COLS, TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import type { BranchSettings, Shift, Staff } from "@/lib/types";
import {
  ensureWorkspace,
  getWorkspaceEmployeeIds,
} from "@/lib/workspace-server";
import { formatDateISO, getWeekEnd, getWeekStart } from "@/lib/week";

interface PageProps {
  searchParams: Promise<{ week?: string }>;
}

export default async function SchedulePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const weekStart =
    params.week && /^\d{4}-\d{2}-\d{2}$/.test(params.week)
      ? params.week
      : formatDateISO(getWeekStart());

  const workspaceId = await ensureWorkspace();
  const employeeIds = await getWorkspaceEmployeeIds(workspaceId);
  const supabase = createServerClient();
  const weekEnd = getWeekEnd(weekStart);
  const [{ data: employees }, { data: shifts }, { data: branchSettings }] =
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
            .gte(COLS.shiftDate, weekStart)
            .lte(COLS.shiftDate, weekEnd)
        : Promise.resolve({ data: [] as Shift[] }),
      supabase
        .from(TABLES.branchSettings)
        .select("*")
        .eq(COLS.workspaceId, workspaceId)
        .maybeSingle(),
    ]);

  return (
    <ScheduleView
      weekStart={weekStart}
      staff={(employees ?? []) as Staff[]}
      shifts={(shifts ?? []) as Shift[]}
      branchSettings={(branchSettings ?? null) as BranchSettings | null}
    />
  );
}
