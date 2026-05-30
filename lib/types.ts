export type ShiftType = "morning" | "evening" | "full" | "off" | "sick";

export type AvailabilityType =
  | "morning"
  | "evening"
  | "full"
  | "off"
  | "unavailable";

/** Row from `employees` table */
export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  max_hours_per_week: number;
  created_at: string;
}

/** @deprecated Use Employee — kept as alias for existing components */
export type Staff = Employee;

/** One row per employee — availability per weekday column */
export interface Preference {
  id: string;
  employee_id: string;
  monday: AvailabilityType;
  tuesday: AvailabilityType;
  wednesday: AvailabilityType;
  thursday: AvailabilityType;
  friday: AvailabilityType;
  saturday: AvailabilityType;
  sunday: AvailabilityType;
}

export interface Shift {
  id: string;
  employee_id: string;
  date: string;
  shift_type: ShiftType;
  start_time: string;
  end_time: string;
}

export interface GeneratedShift {
  employee_id: string;
  date: string;
  shift_type: ShiftType;
}

export interface GeneratedSchedule {
  week_start: string;
  shifts: GeneratedShift[];
}

export interface BranchSettings {
  id: string;
  branch_name: string;
  min_staff_per_shift: number;
  monday_open: string;
  monday_close: string;
  tuesday_open: string;
  tuesday_close: string;
  wednesday_open: string;
  wednesday_close: string;
  thursday_open: string;
  thursday_close: string;
  friday_open: string;
  friday_close: string;
  saturday_open: string;
  saturday_close: string;
  sunday_open: string;
  sunday_close: string;
  updated_at?: string;
}

export interface TimeLog {
  id: string;
  employee_id: string;
  shift_id: string | null;
  clock_in: string;
  clock_out: string | null;
  actual_hours: number | null;
  overtime_hours: number | null;
}
