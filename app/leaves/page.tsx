export const dynamic = "force-dynamic";

import { LeavesPageView } from "@/components/views/LeavesPageView";
import { TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import type { LeaveBalance, LeaveRequest, Staff } from "@/lib/types";

export default async function LeavesPage() {
  const supabase = createServerClient();
  const [{ data: staff }, { data: requests }, { data: balances }] =
    await Promise.all([
      supabase.from(TABLES.employees).select("*").order("name"),
      supabase
        .from(TABLES.leaveRequests)
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from(TABLES.leaveBalances).select("*"),
    ]);

  return (
    <LeavesPageView
      staff={(staff ?? []) as Staff[]}
      requests={(requests ?? []) as LeaveRequest[]}
      balances={(balances ?? []) as LeaveBalance[]}
    />
  );
}
