export const CURRENT_EMPLOYEE_KEY = "shiftmind-current-employee";

export function getCurrentEmployeeId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CURRENT_EMPLOYEE_KEY);
}

export function setCurrentEmployeeId(id: string): void {
  localStorage.setItem(CURRENT_EMPLOYEE_KEY, id);
}
