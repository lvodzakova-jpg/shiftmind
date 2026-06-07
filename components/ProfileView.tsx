"use client";

import { useTranslation } from "@/components/LanguageProvider";
import { DocumentsPanel } from "@/components/DocumentsPanel";
import { ShiftBadge } from "@/components/ShiftBadge";
import { TABLES } from "@/lib/db";
import { getCurrentEmployeeId, setCurrentEmployeeId } from "@/lib/current-user";
import { LEAVE_TYPES } from "@/lib/leaves";
import { createBrowserClient } from "@/lib/supabase/client";
import type {
  ContractType,
  Employee,
  HrDocument,
  LeaveBalance,
  Preference,
  Shift,
} from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ProfileViewProps {
  employee: Employee;
  documents: HrDocument[];
  balances: LeaveBalance[];
  shifts: Shift[];
  preference: Preference | null;
  allStaff: Employee[];
}

const CONTRACT_TYPES: ContractType[] = [
  "full_time",
  "part_time",
  "temporary",
  "intern",
];

export function ProfileView({
  employee: initial,
  documents,
  balances,
  shifts,
  preference,
  allStaff,
}: ProfileViewProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [employee, setEmployee] = useState(initial);
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [email, setEmail] = useState(initial.email);
  const [hourlyRate, setHourlyRate] = useState(String(initial.hourly_rate ?? 0));
  const [contractType, setContractType] = useState<ContractType>(
    initial.contract_type ?? "full_time"
  );
  const [birthDate, setBirthDate] = useState(initial.birth_date ?? "");
  const [canEdit, setCanEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const current = getCurrentEmployeeId();
    setCanEdit(!current || current === employee.id);
    if (!current) setCurrentEmployeeId(employee.id);
  }, [employee.id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    const supabase = createBrowserClient();
    const { error } = await supabase
      .from(TABLES.employees)
      .update({
        phone: phone.trim(),
        email: email.trim(),
        hourly_rate: Number(hourlyRate) || 0,
        contract_type: contractType,
        birth_date: birthDate || null,
      })
      .eq("id", employee.id);
    setSaving(false);
    if (!error) {
      setMessage(t("profile.saved"));
      setEmployee((prev) => ({
        ...prev,
        phone: phone.trim(),
        email: email.trim(),
        hourly_rate: Number(hourlyRate) || 0,
        contract_type: contractType,
        birth_date: birthDate || null,
      }));
      router.refresh();
    }
  }

  const year = new Date().getFullYear();
  const yearBalances = balances.filter(
    (b) => b.employee_id === employee.id && b.year === year
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{employee.name}</h1>
          <p className="text-muted">{employee.role}</p>
        </div>
        <select
          value={employee.id}
          onChange={(e) => {
            setCurrentEmployeeId(e.target.value);
            router.push(`/profile/${e.target.value}`);
          }}
          className="rounded-lg border border-default px-3 py-2 text-sm"
        >
          {allStaff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <form
        onSubmit={handleSave}
        className="rounded-2xl border border-default bg-surface p-6 shadow-sm"
      >
        <h2 className="mb-4 text-lg font-semibold">{t("profile.personalInfo")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">{t("profile.email")}</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!canEdit}
              className="w-full rounded-lg border border-default px-3 py-2 disabled:bg-subtle"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t("profile.phone")}</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={!canEdit}
              className="w-full rounded-lg border border-default px-3 py-2 disabled:bg-subtle"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t("profile.hourlyRate")}</label>
            <input
              type="number"
              step="0.01"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              disabled={!canEdit}
              className="w-full rounded-lg border border-default px-3 py-2 disabled:bg-subtle"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t("profile.contractType")}</label>
            <select
              value={contractType}
              onChange={(e) => setContractType(e.target.value as ContractType)}
              disabled={!canEdit}
              className="w-full rounded-lg border border-default px-3 py-2 disabled:bg-subtle"
            >
              {CONTRACT_TYPES.map((ct) => (
                <option key={ct} value={ct}>
                  {t(`profile.contracts.${ct}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t("profile.birthDate")}</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              disabled={!canEdit}
              className="w-full rounded-lg border border-default px-3 py-2 disabled:bg-subtle"
            />
          </div>
        </div>
        {canEdit && (
          <button
            type="submit"
            disabled={saving}
            className="mt-4 rounded-xl bg-brand px-6 py-2.5 font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-50"
          >
            {saving ? t("common.saving") : t("profile.save")}
          </button>
        )}
        {message && <p className="mt-2 text-sm text-accent">{message}</p>}
      </form>

      <section className="rounded-2xl border border-default bg-surface p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">{t("profile.leaveBalances")}</h2>
        {yearBalances.length === 0 ? (
          <p className="text-sm text-muted">{t("leaves.empty")}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {yearBalances.map((bal) => (
              <div
                key={bal.id}
                className="rounded-xl border border-default bg-subtle p-4"
              >
                <p className="text-sm font-medium">{t(`leaves.types.${bal.leave_type}`)}</p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {bal.total_days - bal.used_days}
                  <span className="text-sm font-normal text-muted">
                    /{bal.total_days}
                  </span>
                </p>
              </div>
            ))}
          </div>
        )}
        {!yearBalances.length && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LEAVE_TYPES.slice(0, 3).map((lt) => (
              <div
                key={lt}
                className="rounded-xl border border-dashed border-default p-4 text-sm text-muted"
              >
                {t(`leaves.types.${lt}`)}: —
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">{t("profile.documents")}</h2>
        <DocumentsPanel
          staff={allStaff}
          documents={documents}
          currentEmployeeId={employee.id}
        />
      </section>

      <section className="rounded-2xl border border-default bg-surface p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("profile.workHistory")}</h2>
          <Link
            href="/preferences"
            className="text-sm font-medium text-brand hover:underline"
          >
            {t("profile.editAvailability")} →
          </Link>
        </div>
        {shifts.length === 0 ? (
          <p className="text-sm text-muted">{t("profile.noHistory")}</p>
        ) : (
          <div className="space-y-2">
            {shifts.slice(0, 14).map((shift) => (
              <div
                key={shift.id}
                className="flex items-center justify-between rounded-lg border border-default px-3 py-2 text-sm"
              >
                <span className="text-muted">{shift.date}</span>
                <ShiftBadge type={shift.shift_type} compact />
                <span className="text-muted">
                  {shift.start_time.slice(0, 5)} – {shift.end_time.slice(0, 5)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
