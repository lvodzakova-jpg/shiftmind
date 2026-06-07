import { TABLES, COLS } from "@/lib/db";
import type { Shift, ShiftSwapRequest } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function applyApprovedSwap(
  supabase: SupabaseClient,
  request: ShiftSwapRequest,
  shifts: Shift[]
): Promise<void> {
  const primary = shifts.find((s) => s.id === request.shift_id);
  if (!primary) throw new Error("Shift not found");

  if (request.exchange_shift_id && request.cover_employee_id) {
    const exchange = shifts.find((s) => s.id === request.exchange_shift_id);
    if (!exchange) throw new Error("Exchange shift not found");

    const { error: e1 } = await supabase
      .from(TABLES.shifts)
      .update({ [COLS.employeeId]: request.cover_employee_id })
      .eq("id", primary.id);

    const { error: e2 } = await supabase
      .from(TABLES.shifts)
      .update({ [COLS.employeeId]: request.requester_id })
      .eq("id", exchange.id);

    if (e1 || e2) throw new Error(e1?.message ?? e2?.message);
    return;
  }

  if (!request.cover_employee_id) {
    throw new Error("No cover employee assigned");
  }

  const { error } = await supabase
    .from(TABLES.shifts)
    .update({ [COLS.employeeId]: request.cover_employee_id })
    .eq("id", primary.id);

  if (error) throw new Error(error.message);
}

export function getUpcomingShiftsForEmployee(
  employeeId: string,
  shifts: Shift[],
  fromDate: string
): Shift[] {
  return shifts
    .filter(
      (s) =>
        s.employee_id === employeeId &&
        s.date >= fromDate &&
        s.shift_type !== "off" &&
        s.shift_type !== "sick"
    )
    .sort((a, b) => a.date.localeCompare(b.date));
}
