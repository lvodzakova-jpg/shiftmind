"use client";

import { useTranslation } from "@/components/LanguageProvider";
import {
  getRequirementsForEmployee,
  type HrDocumentKind,
} from "@/lib/hr-documents";
import type { Employee, LegalCountry } from "@/lib/types";
import { useState } from "react";

const GUIDE_KINDS: HrDocumentKind[] = [
  "employment_contract",
  "gdpr_consent",
  "id_copy",
  "bank_details",
  "health_declaration",
  "hygiene_certificate",
  "work_rules",
  "overtime_consent",
  "intern_agreement",
  "social_security",
  "modelo145",
];

interface DocumentGuideProps {
  country: LegalCountry;
  sampleEmployee?: Employee;
}

export function DocumentGuide({ country, sampleEmployee }: DocumentGuideProps) {
  const { t } = useTranslation();
  const [openKind, setOpenKind] = useState<HrDocumentKind | null>(
    "employment_contract"
  );

  const reference =
    sampleEmployee ??
    ({
      id: "",
      name: "",
      email: "",
      role: "barista",
      max_hours_per_week: 40,
      hourly_rate: 0,
      contract_type: "full_time",
      phone: "",
      birth_date: null,
      created_at: "",
    } satisfies Employee);

  const visibleKinds = GUIDE_KINDS.filter((kind) =>
    getRequirementsForEmployee(reference, country).some((r) => r.kind === kind)
  );

  return (
    <section className="mb-8 rounded-2xl border border-default bg-surface p-6 shadow-sm">
      <h2 className="mb-2 text-lg font-semibold text-foreground">
        {t("documents.guideTitle")}
      </h2>
      <p className="mb-4 text-sm text-muted">{t("documents.guideIntro")}</p>
      <div className="space-y-2">
        {visibleKinds.map((kind) => {
          const isOpen = openKind === kind;
          return (
            <div
              key={kind}
              className="rounded-xl border border-default bg-subtle/50"
            >
              <button
                type="button"
                onClick={() => setOpenKind(isOpen ? null : kind)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <span className="font-medium text-foreground">
                  {t(`documents.guide.${kind}.title`)}
                </span>
                <span className="text-muted">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && (
                <div className="space-y-3 border-t border-default px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-foreground">
                      {t("documents.guideWhat")}
                    </p>
                    <p className="text-muted">
                      {t(`documents.guide.${kind}.what`)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {t("documents.guideWhy")}
                    </p>
                    <p className="text-muted">
                      {t(`documents.guide.${kind}.why`)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {t("documents.guideWhen")}
                    </p>
                    <p className="text-muted">
                      {t(`documents.guide.${kind}.when`)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
