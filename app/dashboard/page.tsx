export const dynamic = 'force-dynamic';
import { DashboardView } from "@/components/views/DashboardView";
import { COLS, TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import type { BranchSettings, Preference, Shift, TimeLog } from "@/lib/types";
import {
  ensureWorkspace,
  getWorkspaceEmployeeIds,
} from "@/lib/workspace-server";
import { addWeeks, formatDateISO, getWeekEnd, getWeekStart } from "@/lib/week";

interface PageProps {
  searchParams: Promise<{ week?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const weekStart =
    params.week && /^\d{4}-\d{2}-\d{2}$/.test(params.week)
      ? params.week
      : formatDateISO(getWeekStart());

  const weekEnd = getWeekEnd(weekStart);
  const prevWeek = addWeeks(weekStart, -1);
  const prevWeekEnd = getWeekEnd(prevWeek);
  const workspaceId = await ensureWorkspace();
  const employeeIds = await getWorkspaceEmployeeIds(workspaceId);
  const supabase = createServerClient();

  const shiftsForRange = (start: string, end: string) =>
    employeeIds.length > 0
      ? supabase
          .from(TABLES.shifts)
          .select("*")
          .in(COLS.employeeId, employeeIds)
          .gte(COLS.shiftDate, start)
          .lte(COLS.shiftDate, end)
      : Promise.resolve({ data: [] as Shift[] });

  const timeLogsForRange = (start: string, end: string) =>
    employeeIds.length > 0
      ? supabase
          .from(TABLES.timeLogs)
          .select("*")
          .in(COLS.employeeId, employeeIds)
          .gte(COLS.clockIn, `${start}T00:00:00`)
          .lte(COLS.clockIn, `${end}T23:59:59`)
      : Promise.resolve({ data: [] as TimeLog[] });

  const [
    { data: employees },
    { data: shifts },
    { data: preferences },
    { data: timeLogs },
    { data: prevShifts },
    { data: prevTimeLogs },
    { data: branchSettings },
  ] = await Promise.all([
    supabase
      .from(TABLES.employees)
      .select("*")
      .eq(COLS.workspaceId, workspaceId)
      .order("name"),
    shiftsForRange(weekStart, weekEnd),
    employeeIds.length > 0
      ? supabase
          .from(TABLES.preferences)
          .select("*")
          .in(COLS.employeeId, employeeIds)
      : Promise.resolve({ data: [] as Preference[] }),
    timeLogsForRange(weekStart, weekEnd),
    shiftsForRange(prevWeek, prevWeekEnd),
    timeLogsForRange(prevWeek, prevWeekEnd),
    supabase
      .from(TABLES.branchSettings)
      .select("*")
      .eq(COLS.workspaceId, workspaceId)
      .maybeSingle(),
  ]);

  return (
    <DashboardView
      weekStart={weekStart}
      staff={employees ?? []}
      shifts={shifts ?? []}
      preferences={preferences ?? []}
      timeLogs={timeLogs ?? []}
      prevShifts={prevShifts ?? []}
      prevTimeLogs={prevTimeLogs ?? []}
      branchSettings={(branchSettings ?? null) as BranchSettings | null}
    />
  );
}
