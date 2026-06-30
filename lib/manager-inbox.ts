import type { LeaveRequest, Preference, Shift, ShiftSwapRequest, Staff } from "@/lib/types";
import type { SchedulePublication } from "@/lib/types";
import { isWorkingShift } from "@/lib/shifts";
import type { ShiftType } from "@/lib/types";
import { getWeekDates } from "@/lib/week";

export interface InboxItem {
  id: string;
  type: "swap" | "leave" | "prefs" | "understaffed" | "draft";
  priority: "high" | "medium" | "low";
  message: string;
  href: string;
}

export function buildManagerInbox(
  staff: Staff[],
  shifts: Shift[],
  preferences: Preference[],
  swapRequests: ShiftSwapRequest[],
  leaveRequests: LeaveRequest[],
  weekStart: string,
  minStaff: number,
  publication: SchedulePublication | null,
  t: (key: string, params?: Record<string, string | number>) => string,
): InboxItem[] {
  const items: InboxItem[] = [];
  const weekDates = getWeekDates(weekStart);

  const pendingSwaps = swapRequests.filter((r) => r.status === "pending");
  if (pendingSwaps.length > 0) {
    items.push({
      id: "swaps-pending",
      type: "swap",
      priority: "high",
      message: t("inbox.swapPending", { count: pendingSwaps.length }),
      href: "/swaps",
    });
  }

  const pendingLeaves = leaveRequests.filter((r) => r.status === "pending");
  if (pendingLeaves.length > 0) {
    items.push({
      id: "leaves-pending",
      type: "leave",
      priority: "high",
      message: t("inbox.leavePending", { count: pendingLeaves.length }),
      href: "/leaves",
    });
  }

  const staffWithoutPrefs = staff.filter((emp) => {
    const pref = preferences.find((p) => p.employee_id === emp.id);
    if (!pref) return true;
    const days = [
      pref.monday,
      pref.tuesday,
      pref.wednesday,
      pref.thursday,
      pref.friday,
      pref.saturday,
      pref.sunday,
    ];
    return days.every((d) => d === "off");
  });

  if (staffWithoutPrefs.length > 0) {
    items.push({
      id: "prefs-missing",
      type: "prefs",
      priority: "medium",
      message: t("inbox.missingPrefs", { count: staffWithoutPrefs.length }),
      href: "/preferences",
    });
  }

  for (const date of weekDates) {
    const count = shifts.filter(
      (s) =>
        s.date === date && isWorkingShift(s.shift_type as ShiftType),
    ).length;
    if (count < minStaff) {
      items.push({
        id: `under-${date}`,
        type: "understaffed",
        priority: "high",
        message: t("inbox.understaffed", { date, count, min: minStaff }),
        href: `/schedule?week=${weekStart}`,
      });
    }
  }

  if (!publication || publication.status === "draft") {
    items.push({
      id: "draft-week",
      type: "draft",
      priority: "medium",
      message: t("inbox.draftWeek"),
      href: `/schedule?week=${weekStart}`,
    });
  }

  const order = { high: 0, medium: 1, low: 2 };
  return items.sort((a, b) => order[a.priority] - order[b.priority]);
}
