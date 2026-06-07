"use client";

import { DocumentsPanel } from "@/components/DocumentsPanel";
import { useTranslation } from "@/components/LanguageProvider";
import { PageHeader } from "@/components/PageHeader";
import type { HrDocument, LegalCountry, Staff } from "@/lib/types";

interface DocumentsPageViewProps {
  staff: Staff[];
  documents: HrDocument[];
  legalCountry: LegalCountry;
}

export function DocumentsPageView({
  staff,
  documents,
  legalCountry,
}: DocumentsPageViewProps) {
  const { t } = useTranslation();
  return (
    <div>
      <PageHeader title={t("documents.title")} description={t("documents.description")} />
      <DocumentsPanel
        staff={staff}
        documents={documents}
        legalCountry={legalCountry}
      />
    </div>
  );
}
