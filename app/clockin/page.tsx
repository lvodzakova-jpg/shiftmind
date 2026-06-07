export const dynamic = 'force-dynamic';
import { ClockInPageView } from "@/components/views/ClockInPageView";
import { COLS, TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import type { BranchSettings, Shift, Staff, TimeLog } from "@/lib/types";
import {
  ensureWorkspace,
  getWorkspaceEmployeeIds,
} from "@/lib/workspace-server";
import { formatDateISO } from "@/lib/week";

export default async function ClockInPage() {
  const today = formatDateISO(new Date());
  const workspaceId = await ensureWorkspace();
  const employeeIds = await getWorkspaceEmployeeIds(workspaceId);
  const supabase = await createServerClient();

  const [
    { data: staff },
    { data: todayShifts },
    { data: timeLogs },
    { data: branchSettings },
  ] = await Promise.all([
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
          .eq(COLS.shiftDate, today)
      : Promise.resolve({ data: [] as Shift[] }),
    employeeIds.length > 0
      ? supabase
          .from(TABLES.timeLogs)
          .select("*")
          .in(COLS.employeeId, employeeIds)
          .gte(COLS.clockIn, `${today}T00:00:00`)
          .lte(COLS.clockIn, `${today}T23:59:59`)
      : Promise.resolve({ data: [] as TimeLog[] }),
    supabase
      .from(TABLES.branchSettings)
      .select("*")
      .eq(COLS.workspaceId, workspaceId)
      .maybeSingle(),
  ]);

  return (
    <ClockInPageView
      staff={(staff ?? []) as Staff[]}
      todayShifts={(todayShifts ?? []) as Shift[]}
      timeLogs={(timeLogs ?? []) as TimeLog[]}
      branchSettings={(branchSettings ?? null) as BranchSettings | null}
    />
  );
}
