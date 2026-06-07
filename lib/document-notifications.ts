import {
  buildDocumentChecklist,
  type HrDocumentKind,
} from "@/lib/hr-documents";
import type { Employee, HrDocument, LegalCountry } from "@/lib/types";

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export function buildMissingDocumentsMessage(
  employee: Employee,
  documents: HrDocument[],
  country: LegalCountry,
  t: TranslateFn
): {
  hasMissing: boolean;
  content: string;
  missingKinds: HrDocumentKind[];
  missingCount: number;
} {
  const checklist = buildDocumentChecklist(employee, documents, country);
  const missing = checklist.filter((c) => c.status === "missing");

  if (missing.length === 0) {
    return { hasMissing: false, content: "", missingKinds: [], missingCount: 0 };
  }

  const lines = missing.map(
    (item, i) => `${i + 1}. ${t(`documents.guide.${item.kind}.title`)}`
  );

  const content = t("documents.reminderMessage", {
    name: employee.name,
    count: missing.length,
    list: lines.join("\n"),
  });

  return {
    hasMissing: true,
    content,
    missingKinds: missing.map((m) => m.kind),
    missingCount: missing.length,
  };
}

export function findManagerSender(staff: Employee[]): Employee | null {
  const manager = staff.find((s) =>
    /manager|manažér/i.test(s.role)
  );
  return manager ?? staff[0] ?? null;
}
