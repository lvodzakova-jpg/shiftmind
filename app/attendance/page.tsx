export const dynamic = "force-dynamic";

import { AttendancePageView } from "@/components/views/AttendancePageView";
import { COLS, TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import type { BranchSettings, Staff, TimeLog } from "@/lib/types";
import {
  ensureWorkspace,
  getWorkspaceEmployeeIds,
} from "@/lib/workspace-server";
import { formatDateISO, getWeekEnd, getWeekStart } from "@/lib/week";

export default async function AttendancePage() {
  const weekStart = formatDateISO(getWeekStart());
  const weekEnd = getWeekEnd(weekStart);
  const workspaceId = await ensureWorkspace();
  const employeeIds = await getWorkspaceEmployeeIds(workspaceId);
  const supabase = await createServerClient();

  const [{ data: staff }, { data: timeLogs }, { data: branchSettings }] =
    await Promise.all([
      supabase
        .from(TABLES.employees)
        .select("*")
        .eq(COLS.workspaceId, workspaceId)
        .order("name"),
      employeeIds.length > 0
        ? supabase
            .from(TABLES.timeLogs)
            .select("*")
            .in(COLS.employeeId, employeeIds)
            .gte(COLS.clockIn, `${weekStart}T00:00:00`)
            .lte(COLS.clockIn, `${weekEnd}T23:59:59`)
            .order(COLS.clockIn, { ascending: false })
        : Promise.resolve({ data: [] as TimeLog[] }),
      supabase
        .from(TABLES.branchSettings)
        .select("*")
        .eq(COLS.workspaceId, workspaceId)
        .maybeSingle(),
    ]);

  return (
    <AttendancePageView
      staff={(staff ?? []) as Staff[]}
      timeLogs={(timeLogs ?? []) as TimeLog[]}
      branchSettings={(branchSettings ?? null) as BranchSettings | null}
    />
  );
}
