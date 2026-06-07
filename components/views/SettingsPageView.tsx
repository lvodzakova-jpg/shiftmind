"use client";

import { BranchSettingsForm } from "@/components/BranchSettingsForm";
import { ThemeControls } from "@/components/ThemeControls";
import { useTranslation } from "@/components/LanguageProvider";
import { PageHeader } from "@/components/PageHeader";
import type { BranchSettings } from "@/lib/types";

export function SettingsPageView({
  settings,
}: {
  settings: BranchSettings | null;
}) {
  const { t } = useTranslation();

  return (
    <div>
      <PageHeader
        title={t("settings.title")}
        description={t("settings.description")}
      />
      <div className="mb-8">
        <ThemeControls showTitle />
      </div>
      <BranchSettingsForm initialSettings={settings} />
    </div>
  );
}
