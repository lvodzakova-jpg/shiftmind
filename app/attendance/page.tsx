export const dynamic = "force-dynamic";

import { AttendancePageView } from "@/components/views/AttendancePageView";
import { COLS, TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import type { BranchSettings, Staff, TimeLog } from "@/lib/types";
import { formatDateISO, getWeekEnd, getWeekStart } from "@/lib/week";

export default async function AttendancePage() {
  const weekStart = formatDateISO(getWeekStart());
  const weekEnd = getWeekEnd(weekStart);
  const supabase = createServerClient();

  const [{ data: staff }, { data: timeLogs }, { data: branchSettings }] =
    await Promise.all([
      supabase.from(TABLES.employees).select("*").order("name"),
      supabase
        .from(TABLES.timeLogs)
        .select("*")
        .gte(COLS.clockIn, `${weekStart}T00:00:00`)
        .lte(COLS.clockIn, `${weekEnd}T23:59:59`)
        .order(COLS.clockIn, { ascending: false }),
      supabase.from(TABLES.branchSettings).select("*").limit(1).maybeSingle(),
    ]);

  return (
    <AttendancePageView
      staff={(staff ?? []) as Staff[]}
      timeLogs={(timeLogs ?? []) as TimeLog[]}
      branchSettings={(branchSettings ?? null) as BranchSettings | null}
    />
  );
}
