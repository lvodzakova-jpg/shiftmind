export const dynamic = 'force-dynamic';
import { DashboardView } from "@/components/views/DashboardView";
import { COLS, TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import type { BranchSettings } from "@/lib/types";
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
  const supabase = createServerClient();

  const [
    { data: employees },
    { data: shifts },
    { data: preferences },
    { data: timeLogs },
    { data: prevShifts },
    { data: prevTimeLogs },
    { data: branchSettings },
  ] = await Promise.all([
    supabase.from(TABLES.employees).select("*").order("name"),
    supabase
      .from(TABLES.shifts)
      .select("*")
      .gte(COLS.shiftDate, weekStart)
      .lte(COLS.shiftDate, weekEnd),
    supabase.from(TABLES.preferences).select("*"),
    supabase
      .from(TABLES.timeLogs)
      .select("*")
      .gte(COLS.clockIn, `${weekStart}T00:00:00`)
      .lte(COLS.clockIn, `${weekEnd}T23:59:59`),
    supabase
      .from(TABLES.shifts)
      .select("*")
      .gte(COLS.shiftDate, prevWeek)
      .lte(COLS.shiftDate, prevWeekEnd),
    supabase
      .from(TABLES.timeLogs)
      .select("*")
      .gte(COLS.clockIn, `${prevWeek}T00:00:00`)
      .lte(COLS.clockIn, `${prevWeekEnd}T23:59:59`),
    supabase.from(TABLES.branchSettings).select("*").limit(1).maybeSingle(),
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
