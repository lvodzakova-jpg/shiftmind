export const dynamic = "force-dynamic";

import { MyScheduleView } from "@/components/views/MyScheduleView";
import { COLS, TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import type { Shift, Staff } from "@/lib/types";
import {
  ensureWorkspace,
  getWorkspaceEmployeeIds,
} from "@/lib/workspace-server";
import { formatDateISO, getWeekEnd, getWeekStart } from "@/lib/week";

interface PageProps {
  searchParams: Promise<{ week?: string }>;
}

export default async function MySchedulePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const weekStart =
    params.week && /^\d{4}-\d{2}-\d{2}$/.test(params.week)
      ? params.week
      : formatDateISO(getWeekStart());
  const weekEnd = getWeekEnd(weekStart);
  const workspaceId = await ensureWorkspace();
  const employeeIds = await getWorkspaceEmployeeIds(workspaceId);

  const supabase = await createServerClient();
  const [{ data: staff }, { data: shifts }] = await Promise.all([
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
  ]);

  return (
    <MyScheduleView
      weekStart={weekStart}
      staff={(staff ?? []) as Staff[]}
      shifts={(shifts ?? []) as Shift[]}
    />
  );
}
