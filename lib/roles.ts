export type WorkspaceRole = "owner" | "manager" | "member";

export function isManagerRole(role: string | null | undefined): boolean {
  return role === "owner" || role === "manager";
}

export const MANAGER_NAV = [
  { href: "/dashboard", key: "overview" },
  { href: "/schedule", key: "schedule" },
  { href: "/staff", key: "staff" },
  { href: "/leaves", key: "leaves" },
  { href: "/swaps", key: "swaps" },
  { href: "/attendance", key: "attendance" },
  { href: "/settings", key: "settings" },
] as const;

export const STAFF_NAV = [
  { href: "/my-schedule", key: "mySchedule" },
  { href: "/clockin", key: "clockin" },
  { href: "/swaps", key: "swaps" },
  { href: "/messages", key: "messages" },
  { href: "/preferences", key: "preferences" },
] as const;

export const MANAGER_MOBILE_NAV = [
  { href: "/dashboard", key: "overview", icon: "📊" },
  { href: "/schedule", key: "schedule", icon: "📋" },
  { href: "/staff", key: "staff", icon: "👥" },
  { href: "/swaps", key: "swaps", icon: "🔄" },
  { href: "/settings", key: "settings", icon: "⚙️" },
] as const;

export const STAFF_MOBILE_NAV = [
  { href: "/my-schedule", key: "mySchedule", icon: "📅" },
  { href: "/clockin", key: "clockin", icon: "⏱" },
  { href: "/swaps", key: "swaps", icon: "🔄" },
  { href: "/messages", key: "messages", icon: "💬" },
  { href: "/preferences", key: "preferences", icon: "✓" },
] as const;
