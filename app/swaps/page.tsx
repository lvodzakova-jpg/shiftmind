export const dynamic = "force-dynamic";

import { SwapsPageView } from "@/components/views/SwapsPageView";
import { COLS, TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import type { Shift, ShiftSwapRequest, Staff } from "@/lib/types";
import {
  ensureWorkspace,
  getWorkspaceEmployeeIds,
} from "@/lib/workspace-server";
import { addWeeks, formatDateISO, getWeekEnd, getWeekStart } from "@/lib/week";

export default async function SwapsPage() {
  const weekStart = formatDateISO(getWeekStart());
  const futureEnd = getWeekEnd(addWeeks(weekStart, 4));
  const workspaceId = await ensureWorkspace();
  const employeeIds = await getWorkspaceEmployeeIds(workspaceId);

  const supabase = createServerClient();
  const [{ data: staff }, { data: shifts }, { data: requests }] =
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
            .lte(COLS.shiftDate, futureEnd)
        : Promise.resolve({ data: [] as Shift[] }),
      employeeIds.length > 0
        ? supabase
            .from(TABLES.shiftSwapRequests)
            .select("*")
            .in("requester_id", employeeIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as ShiftSwapRequest[] }),
    ]);

  return (
    <SwapsPageView
      staff={(staff ?? []) as Staff[]}
      shifts={(shifts ?? []) as Shift[]}
      requests={(requests ?? []) as ShiftSwapRequest[]}
    />
  );
}
