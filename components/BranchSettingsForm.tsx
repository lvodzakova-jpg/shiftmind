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
import { registerPushNotifications } from "@/lib/push-client";
import type { BranchSettings, LegalCountry } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface BranchSettingsFormProps {
  initialSettings: BranchSettings | null;
  workspaceId: string;
}

function normalizeTime(value: string): string {
  return value.slice(0, 5);
}

export function BranchSettingsForm({
  initialSettings,
  workspaceId,
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
  const [mealAllowance, setMealAllowance] = useState(
    String(initialSettings?.meal_allowance ?? 0)
  );
  const [weeklyBudget, setWeeklyBudget] = useState(
    String(initialSettings?.weekly_budget ?? 0)
  );
  const [gpsRadius, setGpsRadius] = useState(
    String(initialSettings?.gps_radius_m ?? 100)
  );
  const [workplaceLat, setWorkplaceLat] = useState(
    initialSettings?.workplace_lat != null
      ? String(initialSettings.workplace_lat)
      : ""
  );
  const [workplaceLng, setWorkplaceLng] = useState(
    initialSettings?.workplace_lng != null
      ? String(initialSettings.workplace_lng)
      : ""
  );
  const [legalCountry, setLegalCountry] = useState<LegalCountry>(
    initialSettings?.legal_country ?? "sk"
  );
  const [pushStatus, setPushStatus] = useState<string | null>(null);
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

    const row: Record<string, string | number | null> = {
      branch_name: branchName.trim(),
      min_staff_per_shift: minStaffNum,
      meal_allowance: Number(mealAllowance) || 0,
      weekly_budget: Number(weeklyBudget) || 0,
      gps_radius_m: Number(gpsRadius) || 100,
      workplace_lat: workplaceLat ? Number(workplaceLat) : null,
      workplace_lng: workplaceLng ? Number(workplaceLng) : null,
      legal_country: legalCountry,
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
        .insert({ ...row, workspace_id: workspaceId });

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
      className="max-w-2xl rounded-2xl border border-default bg-surface p-6 shadow-sm"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="branch-name" className="mb-1 block text-sm font-medium text-foreground">
            {t("settings.branchName")}
          </label>
          <input
            id="branch-name"
            type="text"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            placeholder={t("settings.branchNamePlaceholder")}
            className="w-full rounded-lg border border-default px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            required
          />
        </div>
        <div>
          <label htmlFor="min-staff" className="mb-1 block text-sm font-medium text-foreground">
            {t("settings.minStaff")}
          </label>
          <input
            id="min-staff"
            type="number"
            min={1}
            max={20}
            value={minStaff}
            onChange={(e) => setMinStaff(e.target.value)}
            className="w-full rounded-lg border border-default px-3 py-2 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t("settings.mealAllowance")}
            </label>
            <input
              type="number"
              step="0.01"
              value={mealAllowance}
              onChange={(e) => setMealAllowance(e.target.value)}
              className="w-full rounded-lg border border-default px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t("settings.weeklyBudget")}
            </label>
            <input
              type="number"
              step="0.01"
              value={weeklyBudget}
              onChange={(e) => setWeeklyBudget(e.target.value)}
              className="w-full rounded-lg border border-default px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t("settings.gpsRadius")}
            </label>
            <input
              type="number"
              value={gpsRadius}
              onChange={(e) => setGpsRadius(e.target.value)}
              className="w-full rounded-lg border border-default px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t("settings.legalCountry")}
            </label>
            <select
              value={legalCountry}
              onChange={(e) => setLegalCountry(e.target.value as LegalCountry)}
              className="w-full rounded-lg border border-default px-3 py-2"
            >
              <option value="sk">{t("settings.countries.sk")}</option>
              <option value="es">{t("settings.countries.es")}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t("settings.workplaceLat")}
            </label>
            <input
              type="number"
              step="any"
              value={workplaceLat}
              onChange={(e) => setWorkplaceLat(e.target.value)}
              placeholder="48.1486"
              className="w-full rounded-lg border border-default px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t("settings.workplaceLng")}
            </label>
            <input
              type="number"
              step="any"
              value={workplaceLng}
              onChange={(e) => setWorkplaceLng(e.target.value)}
              placeholder="17.1077"
              className="w-full rounded-lg border border-default px-3 py-2"
            />
          </div>
        </div>

        <h3 className="pt-2 text-sm font-semibold uppercase tracking-wide text-muted">
          {t("settings.hoursTitle")}
        </h3>

        <div className="space-y-3">
          {BRANCH_DAYS.map((day, i) => (
            <div
              key={day}
              className="flex flex-col gap-2 rounded-xl border border-default bg-subtle/50 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="min-w-[100px] font-medium text-foreground">
                {dayNames[i]}
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-muted">
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
                    className="rounded-lg border border-default px-2 py-1.5"
                    required
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-muted">
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
                    className="rounded-lg border border-default px-2 py-1.5"
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
          <p className="text-sm text-accent" role="status">
            {message}
          </p>
        )}

        <div className="rounded-xl border border-default bg-subtle p-4">
          <h3 className="mb-2 text-sm font-semibold">{t("settings.notifications")}</h3>
          <button
            type="button"
            onClick={async () => {
              const ok = await registerPushNotifications();
              setPushStatus(ok ? t("settings.pushEnabled") : t("settings.pushDisabled"));
            }}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-on-brand hover:bg-brand-hover"
          >
            {t("settings.enablePush")}
          </button>
          {pushStatus && (
            <p className="mt-2 text-sm text-muted">{pushStatus}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-60"
        >
          {saving ? t("common.saving") : t("settings.saveButton")}
        </button>
      </div>
    </form>
  );
}
