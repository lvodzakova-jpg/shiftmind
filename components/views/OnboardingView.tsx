"use client";

import { AppLogo } from "@/components/AppLogo";
import { GenerateScheduleButton } from "@/components/GenerateScheduleButton";
import { useTranslation } from "@/components/LanguageProvider";
import { createBrowserClient } from "@/lib/supabase/client";
import { TABLES } from "@/lib/db";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const STEPS = ["team", "hours", "schedule"] as const;

export function OnboardingView() {
  const { t } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [maxHours, setMaxHours] = useState("40");
  const [minStaff, setMinStaff] = useState("2");
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d.toISOString().slice(0, 10);
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.workspaceId && setWorkspaceId(d.workspaceId));
  }, []);

  async function addFirstEmployee() {
    if (!name.trim() || !email.trim()) return;
    setLoading(true);
    setError(null);
    const supabase = createBrowserClient();
    if (!workspaceId) {
      setError(t("common.unknownError"));
      setLoading(false);
      return;
    }
    const { data, error: insertError } = await supabase
      .from(TABLES.employees)
      .insert({
        workspace_id: workspaceId,
        name: name.trim(),
        email: email.trim(),
        role: "barista",
        max_hours_per_week: Number(maxHours) || 40,
      })
      .select()
      .single();
    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }
    if (data) {
      await supabase.from(TABLES.preferences).insert({ employee_id: data.id });
    }
    setLoading(false);
    setStep(1);
  }

  async function saveHours() {
    setLoading(true);
    setError(null);
    const supabase = createBrowserClient();
    if (!workspaceId) {
      setError(t("common.unknownError"));
      setLoading(false);
      return;
    }
    const { error: updateError } = await supabase
      .from(TABLES.branchSettings)
      .update({ min_staff_per_shift: Number(minStaff) || 2 })
      .eq("workspace_id", workspaceId);
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setStep(2);
  }

  async function finish() {
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <AppLogo size="lg" showWordmark tagline={t("onboarding.tagline")} />
      </div>

      <div className="mb-6 flex justify-center gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-2 w-12 rounded-full ${i <= step ? "bg-brand" : "bg-subtle"}`}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-default bg-surface p-6 shadow-sm">
        {step === 0 && (
          <>
            <h1 className="text-xl font-semibold">{t("onboarding.step1Title")}</h1>
            <p className="mt-1 text-sm text-muted">{t("onboarding.step1Desc")}</p>
            <div className="mt-4 space-y-3">
              <input
                className="w-full rounded-lg border border-default bg-app px-3 py-2 text-sm"
                placeholder={t("staff.namePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="w-full rounded-lg border border-default bg-app px-3 py-2 text-sm"
                placeholder={t("staff.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="w-full rounded-lg border border-default bg-app px-3 py-2 text-sm"
                placeholder={t("staff.maxHoursPlaceholder")}
                value={maxHours}
                onChange={(e) => setMaxHours(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={addFirstEmployee}
              disabled={loading}
              className="btn-primary mt-6 w-full"
            >
              {t("onboarding.continue")}
            </button>
            <Link href="/staff" className="mt-3 block text-center text-sm text-brand">
              {t("onboarding.skipAddMore")}
            </Link>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="text-xl font-semibold">{t("onboarding.step2Title")}</h1>
            <p className="mt-1 text-sm text-muted">{t("onboarding.step2Desc")}</p>
            <label className="mt-4 block text-sm font-medium">
              {t("settings.minStaff")}
              <input
                className="mt-1 w-full rounded-lg border border-default bg-app px-3 py-2"
                value={minStaff}
                onChange={(e) => setMinStaff(e.target.value)}
              />
            </label>
            <button
              type="button"
              onClick={saveHours}
              disabled={loading}
              className="btn-primary mt-6 w-full"
            >
              {t("onboarding.continue")}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-xl font-semibold">{t("onboarding.step3Title")}</h1>
            <p className="mt-1 text-sm text-muted">{t("onboarding.step3Desc")}</p>
            <div className="mt-6">
              <GenerateScheduleButton weekStart={weekStart} />
            </div>
            <button
              type="button"
              onClick={finish}
              className="btn-secondary mt-4 w-full"
            >
              {t("onboarding.goDashboard")}
            </button>
          </>
        )}

        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
      </div>
    </div>
  );
}
