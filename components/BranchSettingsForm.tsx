"use client";

import { useTranslation } from "@/components/LanguageProvider";
import {
  BRANCH_DAYS,
  branchDayCloseKey,
  branchDayOpenKey,
} from "@/lib/branch-settings";
import { TABLES } from "@/lib/db";
import { getDayNames } from "@/lib/i18n";
import { createBrowserClient } from "@/lib/supabase/client";
import type { BranchSettings } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface BranchSettingsFormProps {
  initialSettings: BranchSettings | null;
}

function normalizeTime(value: string): string {
  return value.slice(0, 5);
}

export function BranchSettingsForm({
  initialSettings,
}: BranchSettingsFormProps) {
  const { locale, t } = useTranslation();
  const router = useRouter();
  const dayNames = getDayNames(locale);

  const [branchName, setBranchName] = useState(
    initialSettings?.branch_name ?? "Kaviareň Centrum"
  );
  const [minStaff, setMinStaff] = useState(
    String(initialSettings?.min_staff_per_shift ?? 2)
  );
  const [hours, setHours] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const day of BRANCH_DAYS) {
      map[branchDayOpenKey(day)] = normalizeTime(
        initialSettings?.[branchDayOpenKey(day)] ?? "07:00"
      );
      map[branchDayCloseKey(day)] = normalizeTime(
        initialSettings?.[branchDayCloseKey(day)] ?? "22:00"
      );
    }
    if (!initialSettings) {
      map.saturday_open = "08:00";
      map.saturday_close = "20:00";
      map.sunday_open = "08:00";
      map.sunday_close = "20:00";
    }
    return map;
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const minStaffNum = Number(minStaff);
    if (!Number.isInteger(minStaffNum) || minStaffNum < 1) {
      setSaving(false);
      setError(t("common.unknownError"));
      return;
    }

    const row: Record<string, string | number> = {
      branch_name: branchName.trim(),
      min_staff_per_shift: minStaffNum,
      updated_at: new Date().toISOString(),
    };
    for (const day of BRANCH_DAYS) {
      row[branchDayOpenKey(day)] = hours[branchDayOpenKey(day)];
      row[branchDayCloseKey(day)] = hours[branchDayCloseKey(day)];
    }

    const supabase = createBrowserClient();

    if (initialSettings?.id) {
      const { error: updateError } = await supabase
        .from(TABLES.branchSettings)
        .update(row)
        .eq("id", initialSettings.id);

      setSaving(false);
      if (updateError) {
        setError(updateError.message);
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from(TABLES.branchSettings)
        .insert(row);

      setSaving(false);
      if (insertError) {
        setError(insertError.message);
        return;
      }
    }

    setMessage(t("settings.saved"));
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSave}
      className="max-w-2xl rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="branch-name" className="mb-1 block text-sm font-medium text-stone-700">
            {t("settings.branchName")}
          </label>
          <input
            id="branch-name"
            type="text"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            placeholder={t("settings.branchNamePlaceholder")}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            required
          />
        </div>
        <div>
          <label htmlFor="min-staff" className="mb-1 block text-sm font-medium text-stone-700">
            {t("settings.minStaff")}
          </label>
          <input
            id="min-staff"
            type="number"
            min={1}
            max={20}
            value={minStaff}
            onChange={(e) => setMinStaff(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            required
          />
        </div>

        <h3 className="pt-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
          {t("settings.hoursTitle")}
        </h3>

        <div className="space-y-3">
          {BRANCH_DAYS.map((day, i) => (
            <div
              key={day}
              className="flex flex-col gap-2 rounded-xl border border-stone-100 bg-stone-50/50 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="min-w-[100px] font-medium text-stone-800">
                {dayNames[i]}
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-stone-600">
                  {t("settings.open")}
                  <input
                    type="time"
                    value={hours[branchDayOpenKey(day)]}
                    onChange={(e) =>
                      setHours((prev) => ({
                        ...prev,
                        [branchDayOpenKey(day)]: e.target.value,
                      }))
                    }
                    className="rounded-lg border border-stone-300 px-2 py-1.5"
                    required
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-stone-600">
                  {t("settings.close")}
                  <input
                    type="time"
                    value={hours[branchDayCloseKey(day)]}
                    onChange={(e) =>
                      setHours((prev) => ({
                        ...prev,
                        [branchDayCloseKey(day)]: e.target.value,
                      }))
                    }
                    className="rounded-lg border border-stone-300 px-2 py-1.5"
                    required
                  />
                </label>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-sm text-rose-600" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="text-sm text-emerald-700" role="status">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-amber-600 py-3 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {saving ? t("common.saving") : t("settings.saveButton")}
        </button>
      </div>
    </form>
  );
}
