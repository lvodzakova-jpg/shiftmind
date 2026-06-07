"use client";

import { useTranslation } from "@/components/LanguageProvider";
import { COLS, TABLES } from "@/lib/db";
import { getDayNames } from "@/lib/i18n";
import {
  PREF_DAY_COLUMNS,
  buildPreferenceRow,
  countFilledPreferenceDays,
} from "@/lib/preferences";
import { AVAILABILITY_OPTIONS } from "@/lib/shifts";
import { createBrowserClient } from "@/lib/supabase/client";
import type { AvailabilityType, Preference, Staff } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

interface PreferencesFormProps {
  staff: Staff[];
  initialPreferences: Preference[];
}

function initPrefsMap(preferences: Preference[]): Record<string, AvailabilityType> {
  const map: Record<string, AvailabilityType> = {};
  for (const p of preferences) {
    PREF_DAY_COLUMNS.forEach((col, dayIndex) => {
      map[`${p.employee_id}:${dayIndex}`] = p[col] ?? "off";
    });
  }
  return map;
}

export function PreferencesForm({
  staff,
  initialPreferences,
}: PreferencesFormProps) {
  const { locale, t } = useTranslation();
  const router = useRouter();
  const dayNames = getDayNames(locale);
  const [selectedStaffId, setSelectedStaffId] = useState(staff[0]?.id ?? "");
  const [prefs, setPrefs] = useState<Record<string, AvailabilityType>>(() =>
    initPrefsMap(initialPreferences)
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedStaff = staff.find((s) => s.id === selectedStaffId);

  const getValue = useCallback(
    (dayIndex: number): AvailabilityType =>
      prefs[`${selectedStaffId}:${dayIndex}`] ?? "off",
    [prefs, selectedStaffId]
  );

  const filledCount = useMemo(() => {
    const row = PREF_DAY_COLUMNS.reduce(
      (acc, col, dayIndex) => {
        acc[col] = prefs[`${selectedStaffId}:${dayIndex}`] ?? "off";
        return acc;
      },
      {} as Record<(typeof PREF_DAY_COLUMNS)[number], AvailabilityType>
    );
    return countFilledPreferenceDays(row);
  }, [prefs, selectedStaffId]);

  function setDay(dayIndex: number, value: AvailabilityType) {
    setPrefs((prev) => ({
      ...prev,
      [`${selectedStaffId}:${dayIndex}`]: value,
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStaffId) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    const supabase = createBrowserClient();
    const values = PREF_DAY_COLUMNS.map((_, dayIndex) => getValue(dayIndex));
    const row = buildPreferenceRow(selectedStaffId, values);

    const { error: deleteError } = await supabase
      .from(TABLES.preferences)
      .delete()
      .eq(COLS.employeeId, selectedStaffId);

    if (deleteError) {
      setSaving(false);
      setError(deleteError.message);
      return;
    }

    const { error: insertError } = await supabase
      .from(TABLES.preferences)
      .insert(row);

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setMessage(t("preferences.saved"));
    router.refresh();
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <label
          htmlFor="staff-select"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          {t("preferences.employee")}
        </label>
        <select
          id="staff-select"
          value={selectedStaffId}
          onChange={(e) => {
            setSelectedStaffId(e.target.value);
            setMessage(null);
          }}
          className="w-full rounded-lg border border-default px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.role}
            </option>
          ))}
        </select>
      </div>

      <form
        onSubmit={handleSave}
        className="rounded-2xl border border-default bg-surface p-6 shadow-sm"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {selectedStaff?.name ?? t("preferences.prefsFallback")}
          </h2>
          <span className="text-sm text-muted">
            {t("preferences.daysSet", { filled: filledCount })}
          </span>
        </div>

        <div className="space-y-3">
          {dayNames.map((dayName, dayIndex) => (
            <div
              key={dayName}
              className="flex flex-col gap-2 rounded-xl border border-default bg-subtle/50 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="font-medium text-foreground">{dayName}</span>
              <select
                value={getValue(dayIndex)}
                onChange={(e) =>
                  setDay(dayIndex, e.target.value as AvailabilityType)
                }
                className="rounded-lg border border-default bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-w-[220px]"
              >
                {AVAILABILITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {t(`availability.${opt}`)}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {error && (
          <p className="mt-4 text-sm text-rose-600" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="mt-4 text-sm text-accent" role="status">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-6 w-full rounded-xl bg-brand py-3 text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-60"
        >
          {saving ? t("preferences.saving") : t("preferences.saveButton")}
        </button>
      </form>
    </div>
  );
}
