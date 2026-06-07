import { buildDocumentChecklist } from "@/lib/hr-documents";
import {
  checkLegalCompliance,
  formatLegalViolation,
  type LegalRules,
  LEGAL_RULES,
} from "@/lib/legal-compliance";
import { getScheduledWeeklyHours } from "@/lib/overtime";
import type {
  Employee,
  HrDocument,
  LegalCountry,
  LegalViolation,
  Preference,
  Shift,
} from "@/lib/types";
import { getWeekDates } from "@/lib/week";

export interface ComplianceReport {
  score: number;
  violations: LegalViolation[];
  gdprIssues: Array<{ employeeId: string; employeeName: string; missing: number }>;
  rules: LegalRules;
  country: LegalCountry;
}

function employeeAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const born = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - born.getFullYear();
  const m = today.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < born.getDate())) age--;
  return age;
}

function checkConsecutiveWorkingDays(
  employees: Employee[],
  shifts: Shift[],
  weekStart: string,
  country: LegalCountry
): LegalViolation[] {
  const maxConsecutive = country === "sk" ? 6 : 6;
  const violations: LegalViolation[] = [];
  const weekDates = getWeekDates(weekStart);

  for (const emp of employees) {
    const workingDates = weekDates.filter((date) => {
      const s = shifts.find(
        (sh) =>
          sh.employee_id === emp.id &&
          sh.date === date &&
          sh.shift_type !== "off" &&
          sh.shift_type !== "sick"
      );
      return !!s;
    });

    let streak = 0;
    let maxStreak = 0;
    for (const date of weekDates) {
      if (workingDates.includes(date)) {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        streak = 0;
      }
    }

    if (maxStreak > maxConsecutive) {
      violations.push({
        id: `${emp.id}-consecutive`,
        employeeId: emp.id,
        employeeName: emp.name,
        rule: "max_consecutive_days",
        message: `max_consecutive_days:${maxStreak}:${maxConsecutive}`,
      });
    }
  }

  return violations;
}

function checkWeeklyRest(
  employees: Employee[],
  shifts: Shift[],
  weekStart: string
): LegalViolation[] {
  const violations: LegalViolation[] = [];
  const weekDates = getWeekDates(weekStart);

  for (const emp of employees) {
    const workingDays = weekDates.filter((date) => {
      const s = shifts.find(
        (sh) =>
          sh.employee_id === emp.id &&
          sh.date === date &&
          sh.shift_type !== "off" &&
          sh.shift_type !== "sick"
      );
      return !!s;
    }).length;

    if (workingDays >= 7) {
      violations.push({
        id: `${emp.id}-weekly-rest`,
        employeeId: emp.id,
        employeeName: emp.name,
        rule: "weekly_rest",
        message: "weekly_rest:0:1",
      });
    }
  }

  return violations;
}

function checkMinorRules(
  employees: Employee[],
  shifts: Shift[],
  weekStart: string,
  country: LegalCountry
): LegalViolation[] {
  const violations: LegalViolation[] = [];
  const minorMaxWeekly = country === "sk" ? 37.5 : 40;

  for (const emp of employees) {
    const age = employeeAge(emp.birth_date);
    if (age === null || age >= 18) continue;

    const weeklyHours = getScheduledWeeklyHours(emp.id, shifts);
    if (weeklyHours > minorMaxWeekly) {
      violations.push({
        id: `${emp.id}-minor-hours`,
        employeeId: emp.id,
        employeeName: emp.name,
        rule: "minor_max_hours",
        message: `minor_max_hours:${weeklyHours}:${minorMaxWeekly}`,
      });
    }
  }

  return violations;
}

export function buildComplianceReport(
  employees: Employee[],
  shifts: Shift[],
  weekStart: string,
  country: LegalCountry,
  documents: HrDocument[] = []
): ComplianceReport {
  const baseViolations = checkLegalCompliance(employees, shifts, weekStart, country);
  const extra = [
    ...checkConsecutiveWorkingDays(employees, shifts, weekStart, country),
    ...checkWeeklyRest(employees, shifts, weekStart),
    ...checkMinorRules(employees, shifts, weekStart, country),
  ];
  const violations = [...baseViolations, ...extra];

  const gdprIssues = employees
    .map((emp) => {
      const checklist = buildDocumentChecklist(emp, documents, country);
      const missing = checklist.filter(
        (c) =>
          c.status === "missing" &&
          (c.kind === "gdpr_consent" || c.kind === "employment_contract")
      ).length;
      return missing > 0
        ? { employeeId: emp.id, employeeName: emp.name, missing }
        : null;
    })
    .filter(Boolean) as Array<{
    employeeId: string;
    employeeName: string;
    missing: number;
  }>;

  const penalty =
    violations.length * 8 + gdprIssues.length * 10;
  const score = Math.max(0, Math.min(100, 100 - penalty));

  return {
    score,
    violations,
    gdprIssues,
    rules: LEGAL_RULES[country],
    country,
  };
}

export function formatComplianceViolation(
  t: (key: string, params?: Record<string, string | number>) => string,
  violation: LegalViolation
): string {
  if (
    violation.rule === "max_consecutive_days" ||
    violation.rule === "weekly_rest" ||
    violation.rule === "minor_max_hours"
  ) {
    const [, ...rest] = violation.message.split(":");
    switch (violation.rule) {
      case "max_consecutive_days":
        return t("compliance.maxConsecutive", {
          name: violation.employeeName,
          days: rest[0],
          max: rest[1],
        });
      case "weekly_rest":
        return t("compliance.weeklyRest", { name: violation.employeeName });
      case "minor_max_hours":
        return t("compliance.minorHours", {
          name: violation.employeeName,
          hours: rest[0],
          max: rest[1],
        });
    }
  }
  return formatLegalViolation(t, violation);
}
