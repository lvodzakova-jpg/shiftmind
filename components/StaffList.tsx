"use client";

import { useTranslation } from "@/components/LanguageProvider";
import { TABLES } from "@/lib/db";
import { formatMaxHours, isValidMaxHoursPerWeek } from "@/lib/hours";
import { formatBirthdayDate } from "@/lib/birthdays";
import { LOCALE_DATE_FORMAT, ROLE_OPTIONS, getRoleLabel } from "@/lib/i18n";
import { createBrowserClient } from "@/lib/supabase/client";
import type { ContractType, Staff } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const CONTRACT_TYPES: ContractType[] = [
  "full_time",
  "part_time",
  "temporary",
  "intern",
];

interface StaffListProps {
  initialStaff: Staff[];
}

export function StaffList({ initialStaff }: StaffListProps) {
  const { locale, t } = useTranslation();
  const router = useRouter();
  const [staff, setStaff] = useState(initialStaff);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>(ROLE_OPTIONS[0].value);
  const [maxHours, setMaxHours] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [contractType, setContractType] = useState<ContractType>("full_time");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !maxHours.trim()) return;

    const maxHoursPerWeek = Number(maxHours);
    if (!isValidMaxHoursPerWeek(maxHoursPerWeek)) {
      setError(t("staff.maxHoursInvalid"));
      return;
    }

    setLoading(true);
    setError(null);
    const supabase = createBrowserClient();

    const { data, error: insertError } = await supabase
      .from(TABLES.employees)
      .insert({
        name: name.trim(),
        email: email.trim(),
        role,
        max_hours_per_week: maxHoursPerWeek,
        hourly_rate: Number(hourlyRate) || 0,
        contract_type: contractType,
        phone: phone.trim(),
        birth_date: birthDate || null,
      })
      .select()
      .single();

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (data) {
      await supabase.from(TABLES.preferences).insert({
        employee_id: data.id,
      });
      setStaff((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      setEmail("");
      setRole(ROLE_OPTIONS[0].value);
      setMaxHours("");
      setHourlyRate("");
      setPhone("");
      setBirthDate("");
      setContractType("full_time");
      router.refresh();
    }
  }

  async function handleDelete(id: string, staffName: string) {
    if (!confirm(t("staff.deleteConfirm", { name: staffName }))) return;

    const supabase = createBrowserClient();
    const { error: deleteError } = await supabase
      .from(TABLES.employees)
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setStaff((prev) => prev.filter((s) => s.id !== id));
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form
        onSubmit={handleAdd}
        className="rounded-2xl border border-default bg-surface p-6 shadow-sm"
      >
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          {t("staff.addTitle")}
        </h2>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              {t("staff.nameLabel")}
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("staff.namePlaceholder")}
              className="w-full rounded-lg border border-default px-3 py-2 text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              required
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              {t("staff.emailLabel")}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("staff.emailPlaceholder")}
              className="w-full rounded-lg border border-default px-3 py-2 text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              required
            />
          </div>
          <div>
            <label
              htmlFor="role"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              {t("staff.roleLabel")}
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-default px-3 py-2 text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              required
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {t(`roles.${r.key}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="max-hours"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              {t("staff.maxHoursLabel")}
            </label>
            <input
              id="max-hours"
              type="number"
              min={1}
              max={60}
              step={0.5}
              value={maxHours}
              onChange={(e) => setMaxHours(e.target.value)}
              placeholder={t("staff.maxHoursPlaceholder")}
              className="w-full rounded-lg border border-default px-3 py-2 text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              required
            />
          </div>
          <div>
            <label htmlFor="hourly-rate" className="mb-1 block text-sm font-medium text-foreground">
              {t("staff.hourlyRateLabel")}
            </label>
            <input
              id="hourly-rate"
              type="number"
              step="0.01"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className="w-full rounded-lg border border-default px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="contract-type" className="mb-1 block text-sm font-medium text-foreground">
              {t("staff.contractLabel")}
            </label>
            <select
              id="contract-type"
              value={contractType}
              onChange={(e) => setContractType(e.target.value as ContractType)}
              className="w-full rounded-lg border border-default px-3 py-2"
            >
              {CONTRACT_TYPES.map((ct) => (
                <option key={ct} value={ct}>
                  {t(`profile.contracts.${ct}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-foreground">
              {t("staff.phoneLabel")}
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-default px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="birth-date" className="mb-1 block text-sm font-medium text-foreground">
              {t("staff.birthDateLabel")}
            </label>
            <input
              id="birth-date"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full rounded-lg border border-default px-3 py-2"
            />
          </div>
          {error && (
            <p className="text-sm text-rose-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand py-2.5 text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-60"
          >
            {loading ? t("common.saving") : t("staff.addButton")}
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-default bg-surface shadow-sm">
        <div className="border-b border-default px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            {t("staff.listTitle", { count: staff.length })}
          </h2>
        </div>
        {staff.length === 0 ? (
          <p className="px-6 py-8 text-center text-muted">
            {t("staff.emptyList")}
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border-color)]">
            {staff.map((person) => (
              <li
                key={person.id}
                className="flex items-center justify-between gap-4 px-6 py-4"
              >
                <div>
                  <p className="font-medium text-foreground">{person.name}</p>
                  {person.email && (
                    <p className="text-sm text-muted">{person.email}</p>
                  )}
                  <p className="text-xs text-muted">
                    {getRoleLabel(locale, person.role)}
                    {person.max_hours_per_week != null &&
                      ` · ${t("staff.hoursPerWeek", { hours: formatMaxHours(person.max_hours_per_week) })}`}
                    {(person.hourly_rate ?? 0) > 0 && ` · €${person.hourly_rate}/h`}
                    {person.birth_date &&
                      ` · 🎂 ${formatBirthdayDate(person.birth_date, LOCALE_DATE_FORMAT[locale], true)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                <Link
                  href={`/profile/${person.id}`}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-brand hover:bg-subtle"
                >
                  {t("staff.viewProfile")}
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(person.id, person.name)}
                  className="rounded-lg px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50"
                >
                  {t("common.remove")}
                </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
