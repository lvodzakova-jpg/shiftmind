"use client";

import { useTranslation } from "@/components/LanguageProvider";
import { PageHeader } from "@/components/PageHeader";
import {
  buildComplianceReport,
  formatComplianceViolation,
} from "@/lib/compliance-report";
import { LEGAL_RULES } from "@/lib/legal-compliance";
import type {
  BranchSettings,
  Employee,
  HrDocument,
  Shift,
} from "@/lib/types";
import { useMemo } from "react";

interface CompliancePageViewProps {
  weekStart: string;
  staff: Employee[];
  shifts: Shift[];
  documents: HrDocument[];
  branchSettings: BranchSettings | null;
}

export function CompliancePageView({
  weekStart,
  staff,
  shifts,
  documents,
  branchSettings,
}: CompliancePageViewProps) {
  const { t } = useTranslation();
  const country = branchSettings?.legal_country ?? "sk";
  const rules = LEGAL_RULES[country];

  const report = useMemo(
    () => buildComplianceReport(staff, shifts, weekStart, country, documents),
    [staff, shifts, weekStart, country, documents]
  );

  const scoreColor =
    report.score >= 80
      ? "text-brand border-accent/30 bg-subtle"
      : report.score >= 50
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-rose-200 bg-rose-50 text-rose-900";

  return (
    <div>
      <PageHeader
        title={t("compliance.title")}
        description={t("compliance.description")}
      />

      <div className={`mb-8 rounded-2xl border p-8 text-center ${scoreColor}`}>
        <p className="text-sm font-medium uppercase tracking-wide opacity-80">
          {t("compliance.score")}
        </p>
        <p className="mt-2 text-5xl font-bold">{report.score}%</p>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-default bg-surface p-6 shadow-sm">
          <h2 className="mb-4 font-semibold">{t("compliance.violations")}</h2>
          {report.violations.length === 0 ? (
            <p className="text-sm text-muted">{t("compliance.noViolations")}</p>
          ) : (
            <ul className="space-y-2">
              {report.violations.map((v) => (
                <li
                  key={v.id}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900"
                >
                  {formatComplianceViolation(t, v)}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-default bg-surface p-6 shadow-sm">
          <h2 className="mb-4 font-semibold">{t("compliance.gdprTitle")}</h2>
          {report.gdprIssues.length === 0 ? (
            <p className="text-sm text-muted">{t("compliance.noGdprIssues")}</p>
          ) : (
            <ul className="space-y-2">
              {report.gdprIssues.map((g) => (
                <li
                  key={g.employeeId}
                  className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                >
                  {t("compliance.gdprIssue", {
                    name: g.employeeName,
                    missing: g.missing,
                  })}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-default bg-subtle p-6">
        <h2 className="mb-4 font-semibold">{t("compliance.rulesTitle")}</h2>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <RuleItem label="Min. rest" value={`${rules.minRestHours}h`} />
          <RuleItem label="Max. shift" value={`${rules.maxShiftHours}h`} />
          <RuleItem label="Max. week" value={`${rules.maxWeeklyHours}h`} />
          <RuleItem
            label="Break after"
            value={`${rules.breakAfterHours}h → ${rules.breakMinutes} min`}
          />
          <RuleItem label="Country" value={country.toUpperCase()} />
        </dl>
      </section>
    </div>
  );
}

function RuleItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-default bg-surface px-4 py-3">
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold text-foreground">{value}</dd>
    </div>
  );
}
