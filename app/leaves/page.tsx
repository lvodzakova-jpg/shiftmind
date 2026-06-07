export const dynamic = "force-dynamic";

import { LeavesPageView } from "@/components/views/LeavesPageView";
import { COLS, TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import type { LeaveBalance, LeaveRequest, Staff } from "@/lib/types";
import {
  ensureWorkspace,
  getWorkspaceEmployeeIds,
} from "@/lib/workspace-server";

export default async function LeavesPage() {
  const workspaceId = await ensureWorkspace();
  const employeeIds = await getWorkspaceEmployeeIds(workspaceId);
  const supabase = createServerClient();
  const [{ data: staff }, { data: requests }, { data: balances }] =
    await Promise.all([
      supabase
        .from(TABLES.employees)
        .select("*")
        .eq(COLS.workspaceId, workspaceId)
        .order("name"),
      employeeIds.length > 0
        ? supabase
            .from(TABLES.leaveRequests)
            .select("*")
            .in(COLS.employeeId, employeeIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as LeaveRequest[] }),
      employeeIds.length > 0
        ? supabase
            .from(TABLES.leaveBalances)
            .select("*")
            .in(COLS.employeeId, employeeIds)
        : Promise.resolve({ data: [] as LeaveBalance[] }),
    ]);

  return (
    <LeavesPageView
      staff={(staff ?? []) as Staff[]}
      requests={(requests ?? []) as LeaveRequest[]}
      balances={(balances ?? []) as LeaveBalance[]}
    />
  );
}
