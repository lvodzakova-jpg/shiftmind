export const dynamic = "force-dynamic";

import { PayrollPageView } from "@/components/views/PayrollPageView";
import { COLS, TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import type { Employee, LeaveRequest, Shift, TimeLog } from "@/lib/types";

export default async function PayrollPage() {
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
    supabase.from(TABLES.employees).select("*").order("name"),
    supabase
      .from(TABLES.shifts)
      .select("*")
      .gte(COLS.shiftDate, start)
      .lte(COLS.shiftDate, end),
    supabase
      .from(TABLES.timeLogs)
      .select("*")
      .gte(COLS.clockIn, `${start}T00:00:00`)
      .lte(COLS.clockIn, `${end}T23:59:59`),
    supabase.from(TABLES.leaveRequests).select("*"),
    supabase.from(TABLES.branchSettings).select("*").limit(1).maybeSingle(),
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
