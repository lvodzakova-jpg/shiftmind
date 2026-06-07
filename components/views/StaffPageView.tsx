"use client";

import { useTranslation } from "@/components/LanguageProvider";
import { PageHeader } from "@/components/PageHeader";
import { StaffList } from "@/components/StaffList";
import type { Staff } from "@/lib/types";

export function StaffPageView({
  staff,
  workspaceId,
}: {
  staff: Staff[];
  workspaceId: string;
}) {
  const { t } = useTranslation();

  return (
    <div>
      <PageHeader
        title={t("staff.title")}
        description={t("staff.description")}
      />
      <StaffList initialStaff={staff} workspaceId={workspaceId} />
    </div>
  );
}
