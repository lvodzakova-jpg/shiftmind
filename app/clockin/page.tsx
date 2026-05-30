import { ClockInPageView } from "@/components/views/ClockInPageView";
import { COLS, TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import type { Shift, Staff, TimeLog } from "@/lib/types";
import { formatDateISO } from "@/lib/week";

export default async function ClockInPage() {
  const today = formatDateISO(new Date());
  const supabase = createServerClient();

  const [
    { data: staff },
    { data: todayShifts },
    { data: timeLogs },
  ] = await Promise.all([
    supabase.from(TABLES.employees).select("*").order("name"),
    supabase
      .from(TABLES.shifts)
      .select("*")
      .eq(COLS.shiftDate, today),
    supabase
      .from(TABLES.timeLogs)
      .select("*")
      .gte(COLS.clockIn, `${today}T00:00:00`)
      .lte(COLS.clockIn, `${today}T23:59:59`),
  ]);

  return (
    <ClockInPageView
      staff={(staff ?? []) as Staff[]}
      todayShifts={(todayShifts ?? []) as Shift[]}
      timeLogs={(timeLogs ?? []) as TimeLog[]}
    />
  );
}
