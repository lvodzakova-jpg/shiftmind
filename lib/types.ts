export type ShiftType = "morning" | "evening" | "full" | "off" | "sick";

export type AvailabilityType =
  | "morning"
  | "evening"
  | "full"
  | "off"
  | "unavailable";

export type ContractType = "full_time" | "part_time" | "temporary" | "intern";

export type LeaveType = "paid" | "sick" | "unpaid" | "bank_holiday" | "rtt";

export type LeaveStatus = "pending" | "approved" | "rejected";

export type ShiftSwapStatus = "pending" | "approved" | "rejected";

export type RecurrenceType =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "last_weekday";

export type DocumentType = "contract" | "id" | "certificate" | "other";

export type LegalCountry = "sk" | "es";

/** Row from `employees` table */
export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  max_hours_per_week: number;
  hourly_rate: number;
  contract_type: ContractType;
  phone: string;
  birth_date: string | null;
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
  meal_allowance: number;
  weekly_budget: number;
  gps_radius_m: number;
  workplace_lat: number | null;
  workplace_lng: number | null;
  legal_country: LegalCountry;
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
  clock_in_lat: number | null;
  clock_in_lng: number | null;
  clock_out_lat: number | null;
  clock_out_lng: number | null;
}

export interface ShiftTemplate {
  id: string;
  name: string;
  shift_type: ShiftType;
  employee_id: string | null;
  recurrence: RecurrenceType;
  weekday: number | null;
  created_at: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  type: LeaveType;
  start_date: string;
  end_date: string;
  status: LeaveStatus;
  note: string | null;
  created_at: string;
}

export interface ShiftSwapRequest {
  id: string;
  requester_id: string;
  shift_id: string;
  cover_employee_id: string | null;
  exchange_shift_id: string | null;
  status: ShiftSwapStatus;
  note: string | null;
  created_at: string;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  leave_type: LeaveType;
  total_days: number;
  used_days: number;
  year: number;
}

export interface HrDocument {
  id: string;
  employee_id: string;
  name: string;
  type: DocumentType;
  url: string;
  uploaded_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  content: string;
  read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  employee_id: string;
  schedule_published: boolean;
  shift_changed: boolean;
  leave_updated: boolean;
  new_message: boolean;
  document_reminder: boolean;
}

export interface PushSubscriptionRow {
  id: string;
  employee_id: string | null;
  endpoint: string;
  subscription: Record<string, unknown>;
  created_at: string;
}

export interface LegalViolation {
  id: string;
  employeeId: string;
  employeeName: string;
  date?: string;
  rule: string;
  message: string;
}
