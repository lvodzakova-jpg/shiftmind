import { ScheduleView } from "@/components/views/ScheduleView";
import { COLS, TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import type { Shift, Staff } from "@/lib/types";
import { formatDateISO, getWeekEnd, getWeekStart } from "@/lib/week";

interface PageProps {
  searchParams: Promise<{ week?: string }>;
}

export default async function SchedulePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const weekStart =
    params.week && /^\d{4}-\d{2}-\d{2}$/.test(params.week)
      ? params.week
      : formatDateISO(getWeekStart());

  const supabase = createServerClient();
  const [{ data: employees }, { data: shifts }] = await Promise.all([
    supabase.from(TABLES.employees).select("*").order("name"),
    supabase
      .from(TABLES.shifts)
      .select("*")
      .gte(COLS.shiftDate, weekStart)
      .lte(COLS.shiftDate, getWeekEnd(weekStart)),
  ]);

  return (
    <ScheduleView
      weekStart={weekStart}
      staff={(employees ?? []) as Staff[]}
      shifts={(shifts ?? []) as Shift[]}
    />
  );
}
