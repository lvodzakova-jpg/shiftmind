"use client";

import { BranchSettingsForm } from "@/components/BranchSettingsForm";
import { TeamInviteCard } from "@/components/TeamInviteCard";
import { ThemeControls } from "@/components/ThemeControls";
import { useTranslation } from "@/components/LanguageProvider";
import { PageHeader } from "@/components/PageHeader";
import type { BranchSettings } from "@/lib/types";

export function SettingsPageView({
  settings,
  inviteCode,
  businessName,
  workspaceId,
}: {
  settings: BranchSettings | null;
  inviteCode: string;
  businessName: string;
  workspaceId: string;
}) {
  const { t } = useTranslation();

  return (
    <div>
      <PageHeader
        title={t("settings.title")}
        description={t("settings.description")}
      />
      {inviteCode && (
        <TeamInviteCard inviteCode={inviteCode} businessName={businessName} />
      )}
      <div className="mb-8">
        <ThemeControls showTitle />
      </div>
      <BranchSettingsForm
        initialSettings={settings}
        workspaceId={workspaceId}
      />
    </div>
  );
}
