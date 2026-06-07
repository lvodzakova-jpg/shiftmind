export const dynamic = "force-dynamic";

import { PayrollPageView } from "@/components/views/PayrollPageView";
import { COLS, TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import type { Employee, LeaveRequest, Shift, TimeLog } from "@/lib/types";
import {
  ensureWorkspace,
  getWorkspaceEmployeeIds,
} from "@/lib/workspace-server";

export default async function PayrollPage() {
  const workspaceId = await ensureWorkspace();
  const employeeIds = await getWorkspaceEmployeeIds(workspaceId);
  const supabase = createServerClient();
  const year = new Date().getFullYear();
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;

  const [
    { data: staff },
    { data: shifts },
    { data: timeLogs },
    { data: leaveRequests },
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
          .gte(COLS.shiftDate, start)
          .lte(COLS.shiftDate, end)
      : Promise.resolve({ data: [] as Shift[] }),
    employeeIds.length > 0
      ? supabase
          .from(TABLES.timeLogs)
          .select("*")
          .in(COLS.employeeId, employeeIds)
          .gte(COLS.clockIn, `${start}T00:00:00`)
          .lte(COLS.clockIn, `${end}T23:59:59`)
      : Promise.resolve({ data: [] as TimeLog[] }),
    employeeIds.length > 0
      ? supabase
          .from(TABLES.leaveRequests)
          .select("*")
          .in(COLS.employeeId, employeeIds)
      : Promise.resolve({ data: [] as LeaveRequest[] }),
    supabase
      .from(TABLES.branchSettings)
      .select("*")
      .eq(COLS.workspaceId, workspaceId)
      .maybeSingle(),
  ]);

  return (
    <PayrollPageView
      staff={(staff ?? []) as Employee[]}
      shifts={(shifts ?? []) as Shift[]}
      timeLogs={(timeLogs ?? []) as TimeLog[]}
      leaveRequests={(leaveRequests ?? []) as LeaveRequest[]}
      mealAllowance={branchSettings?.meal_allowance ?? 0}
      branchName={branchSettings?.branch_name ?? "ShiftMind"}
    />
  );
}
