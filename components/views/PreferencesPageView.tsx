"use client";

import { useTranslation } from "@/components/LanguageProvider";
import { PageHeader } from "@/components/PageHeader";
import { PreferencesForm } from "@/components/PreferencesForm";
import type { Preference, Staff } from "@/lib/types";
import Link from "next/link";

interface PreferencesPageViewProps {
  staff: Staff[];
  preferences: Preference[];
}

export function PreferencesPageView({
  staff,
  preferences,
}: PreferencesPageViewProps) {
  const { t } = useTranslation();

  return (
    <div>
      <PageHeader
        title={t("preferences.title")}
        description={t("preferences.description")}
      />
      {staff.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center text-stone-600">
          {t("preferences.empty")}{" "}
          <Link href="/staff" className="font-medium text-amber-700 hover:underline">
            {t("preferences.teamLink")}
          </Link>
          .
        </div>
      ) : (
        <PreferencesForm staff={staff} initialPreferences={preferences} />
      )}
    </div>
  );
}
