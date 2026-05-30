"use client";

import { BranchSettingsForm } from "@/components/BranchSettingsForm";
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
      <BranchSettingsForm initialSettings={settings} />
    </div>
  );
}
