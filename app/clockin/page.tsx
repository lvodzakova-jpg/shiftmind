export const dynamic = 'force-dynamic';
import { ClockInPageView } from "@/components/views/ClockInPageView";
import { COLS, TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import type { BranchSettings, Shift, Staff, TimeLog } from "@/lib/types";
import { formatDateISO } from "@/lib/week";

export default async function ClockInPage() {
  const today = formatDateISO(new Date());
  const supabase = createServerClient();

  const [
    { data: staff },
    { data: todayShifts },
    { data: timeLogs },
    { data: branchSettings },
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
    supabase.from(TABLES.branchSettings).select("*").limit(1).maybeSingle(),
  ]);

  return (
    <ClockInPageView
      staff={(staff ?? []) as Staff[]}
      todayShifts={(todayShifts ?? []) as Shift[]}
      timeLogs={(timeLogs ?? []) as TimeLog[]}
      branchSettings={(branchSettings ?? null) as BranchSettings | null}
    />
  );
}
