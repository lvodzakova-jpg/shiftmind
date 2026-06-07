export const dynamic = "force-dynamic";

import { SwapsPageView } from "@/components/views/SwapsPageView";
import { COLS, TABLES } from "@/lib/db";
import { createServerClient } from "@/lib/supabase/server";
import type { Shift, ShiftSwapRequest, Staff } from "@/lib/types";
import { addWeeks, formatDateISO, getWeekEnd, getWeekStart } from "@/lib/week";

export default async function SwapsPage() {
  const weekStart = formatDateISO(getWeekStart());
  const weekEnd = getWeekEnd(weekStart);
  const futureEnd = getWeekEnd(addWeeks(weekStart, 4));

  const supabase = createServerClient();
  const [{ data: staff }, { data: shifts }, { data: requests }] =
    await Promise.all([
      supabase.from(TABLES.employees).select("*").order("name"),
      supabase
        .from(TABLES.shifts)
        .select("*")
        .gte(COLS.shiftDate, weekStart)
        .lte(COLS.shiftDate, futureEnd),
      supabase
        .from(TABLES.shiftSwapRequests)
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

  return (
    <SwapsPageView
      staff={(staff ?? []) as Staff[]}
      shifts={(shifts ?? []) as Shift[]}
      requests={(requests ?? []) as ShiftSwapRequest[]}
    />
  );
}
