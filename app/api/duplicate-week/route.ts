import { COLS, TABLES } from "@/lib/db";
import { getShiftDbTimes } from "@/lib/shifts";
import { createServerClient } from "@/lib/supabase/server";
import { addWeeks, getWeekEnd } from "@/lib/week";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { weekStart } = (await request.json()) as { weekStart?: string };
    if (!weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
      return NextResponse.json({ error: "Invalid weekStart" }, { status: 400 });
    }

    const prevWeek = addWeeks(weekStart, -1);
    const supabase = createServerClient();

    const { data: shifts, error: fetchError } = await supabase
      .from(TABLES.shifts)
      .select("*")
      .gte(COLS.shiftDate, prevWeek)
      .lte(COLS.shiftDate, getWeekEnd(prevWeek));

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!shifts?.length) {
      return NextResponse.json(
        { error: "No shifts in previous week" },
        { status: 404 }
      );
    }

    const newRows = shifts.map((s) => {
      const oldDate = new Date(s.date + "T12:00:00");
      oldDate.setDate(oldDate.getDate() + 7);
      const y = oldDate.getFullYear();
      const m = String(oldDate.getMonth() + 1).padStart(2, "0");
      const d = String(oldDate.getDate()).padStart(2, "0");
      const times = getShiftDbTimes(s.shift_type);
      return {
        employee_id: s.employee_id,
        date: `${y}-${m}-${d}`,
        shift_type: s.shift_type,
        start_time: s.start_time ?? times.start_time,
        end_time: s.end_time ?? times.end_time,
      };
    });

    await supabase
      .from(TABLES.shifts)
      .delete()
      .gte(COLS.shiftDate, weekStart)
      .lte(COLS.shiftDate, getWeekEnd(weekStart));

    const { error: insertError } = await supabase
      .from(TABLES.shifts)
      .upsert(newRows, { onConflict: "employee_id,date" });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, count: newRows.length });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
