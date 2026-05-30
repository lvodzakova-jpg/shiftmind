/** Supabase table and column names (matches remote schema). */
export const TABLES = {
  employees: "employees",
  preferences: "preferences",
  shifts: "shifts",
  branchSettings: "branch_settings",
  timeLogs: "time_logs",
} as const;

export const COLS = {
  employeeId: "employee_id",
  shiftDate: "date",
  startTime: "start_time",
  endTime: "end_time",
  shiftId: "shift_id",
  clockIn: "clock_in",
  clockOut: "clock_out",
  actualHours: "actual_hours",
  overtimeHours: "overtime_hours",
} as const;
