"use client";

import { TemplatesList } from "@/components/TemplatesList";
import { useTranslation } from "@/components/LanguageProvider";
import { PageHeader } from "@/components/PageHeader";
import type { ShiftTemplate, Staff } from "@/lib/types";

interface TemplatesPageViewProps {
  templates: ShiftTemplate[];
  staff: Staff[];
  workspaceId: string;
}

export function TemplatesPageView({
  templates,
  staff,
  workspaceId,
}: TemplatesPageViewProps) {
  const { t } = useTranslation();
  return (
    <div>
      <PageHeader title={t("templates.title")} description={t("templates.description")} />
      <TemplatesList templates={templates} staff={staff} workspaceId={workspaceId} />
    </div>
  );
}
