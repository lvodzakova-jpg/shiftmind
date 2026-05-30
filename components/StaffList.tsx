"use client";

import { useTranslation } from "@/components/LanguageProvider";
import { TABLES } from "@/lib/db";
import { formatMaxHours, isValidMaxHoursPerWeek } from "@/lib/hours";
import { ROLE_OPTIONS, getRoleLabel } from "@/lib/i18n";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Staff } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
      })
      .select()
      .single();

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (data) {
      setStaff((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      setEmail("");
      setRole(ROLE_OPTIONS[0].value);
      setMaxHours("");
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
        className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
      >
        <h2 className="mb-4 text-lg font-semibold text-stone-900">
          {t("staff.addTitle")}
        </h2>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-stone-700"
            >
              {t("staff.nameLabel")}
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("staff.namePlaceholder")}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              required
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-stone-700"
            >
              {t("staff.emailLabel")}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("staff.emailPlaceholder")}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              required
            />
          </div>
          <div>
            <label
              htmlFor="role"
              className="mb-1 block text-sm font-medium text-stone-700"
            >
              {t("staff.roleLabel")}
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
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
              className="mb-1 block text-sm font-medium text-stone-700"
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
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              required
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
            className="w-full rounded-xl bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {loading ? t("common.saving") : t("staff.addButton")}
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-stone-900">
            {t("staff.listTitle", { count: staff.length })}
          </h2>
        </div>
        {staff.length === 0 ? (
          <p className="px-6 py-8 text-center text-stone-500">
            {t("staff.emptyList")}
          </p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {staff.map((person) => (
              <li
                key={person.id}
                className="flex items-center justify-between gap-4 px-6 py-4"
              >
                <div>
                  <p className="font-medium text-stone-900">{person.name}</p>
                  {person.email && (
                    <p className="text-sm text-stone-500">{person.email}</p>
                  )}
                  <p className="text-xs text-stone-400">
                    {getRoleLabel(locale, person.role)}
                    {person.max_hours_per_week != null &&
                      ` · ${t("staff.hoursPerWeek", { hours: formatMaxHours(person.max_hours_per_week) })}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(person.id, person.name)}
                  className="rounded-lg px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50"
                >
                  {t("common.remove")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
