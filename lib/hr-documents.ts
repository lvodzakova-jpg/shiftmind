import type {
  ContractType,
  DocumentType,
  Employee,
  HrDocument,
  LegalCountry,
} from "./types";

/** Catalog keys for required HR paperwork — explanations live in i18n. */
export type HrDocumentKind =
  | "employment_contract"
  | "gdpr_consent"
  | "id_copy"
  | "bank_details"
  | "health_declaration"
  | "hygiene_certificate"
  | "work_rules"
  | "overtime_consent"
  | "intern_agreement"
  | "social_security"
  | "modelo145";

export interface DocumentRequirement {
  kind: HrDocumentKind;
  documentType: DocumentType;
}

export interface DocumentChecklistItem extends DocumentRequirement {
  status: "uploaded" | "missing";
  matchedDocument?: HrDocument;
}

const BASE_REQUIREMENTS: DocumentRequirement[] = [
  { kind: "employment_contract", documentType: "contract" },
  { kind: "gdpr_consent", documentType: "other" },
  { kind: "id_copy", documentType: "id" },
  { kind: "bank_details", documentType: "other" },
  { kind: "health_declaration", documentType: "other" },
  { kind: "hygiene_certificate", documentType: "certificate" },
  { kind: "work_rules", documentType: "other" },
  { kind: "overtime_consent", documentType: "other" },
];

const SK_ONLY: DocumentRequirement[] = [
  { kind: "social_security", documentType: "other" },
];

const ES_ONLY: DocumentRequirement[] = [
  { kind: "modelo145", documentType: "other" },
];

const INTERN_ONLY: DocumentRequirement[] = [
  { kind: "intern_agreement", documentType: "contract" },
];

const KIND_KEYWORDS: Record<HrDocumentKind, string[]> = {
  employment_contract: ["zmluv", "contract", "contrato", "employment"],
  gdpr_consent: ["gdpr", "súkrom", "privacy", "ochrana údaj", "protección"],
  id_copy: ["občiansk", "preukaz", "id", "dni", "pas"],
  bank_details: ["bank", "účet", "iban", "cuenta"],
  health_declaration: ["zdrav", "health", "salud", "prehlásen"],
  hygiene_certificate: ["hygien", "haccp", "sanit", "certifik", "bozp"],
  work_rules: ["pravidl", "rules", "interný", "prevádzk", "norm"],
  overtime_consent: ["nadčas", "overtime", "rozvrh", "súhlas"],
  intern_agreement: ["stáž", "intern", "praktik"],
  social_security: ["soc", "poist", "odvod"],
  modelo145: ["modelo", "145", "irpf", "hacienda"],
};

function isRequiredForEmployee(
  req: DocumentRequirement,
  employee: Employee,
  country: LegalCountry
): boolean {
  if (req.kind === "intern_agreement") {
    return employee.contract_type === "intern";
  }
  if (req.kind === "social_security") {
    return country === "sk";
  }
  if (req.kind === "modelo145") {
    return country === "es";
  }
  if (req.kind === "overtime_consent") {
    return employee.contract_type === "part_time" || employee.max_hours_per_week > 40;
  }
  if (INTERN_ONLY.some((r) => r.kind === req.kind)) {
    return employee.contract_type === "intern";
  }
  return true;
}

export function getRequirementsForEmployee(
  employee: Employee,
  country: LegalCountry
): DocumentRequirement[] {
  const all = [
    ...BASE_REQUIREMENTS,
    ...(country === "sk" ? SK_ONLY : []),
    ...(country === "es" ? ES_ONLY : []),
    ...INTERN_ONLY,
  ];

  const seen = new Set<HrDocumentKind>();
  return all.filter((req) => {
    if (seen.has(req.kind)) return false;
    seen.add(req.kind);
    return isRequiredForEmployee(req, employee, country);
  });
}

function matchesDocument(
  kind: HrDocumentKind,
  doc: HrDocument,
  requirement: DocumentRequirement
): boolean {
  if (doc.type !== requirement.documentType && requirement.documentType !== "other") {
    return false;
  }
  const haystack = `${doc.name} ${doc.type}`.toLowerCase();
  return KIND_KEYWORDS[kind].some((kw) => haystack.includes(kw));
}

export function buildDocumentChecklist(
  employee: Employee,
  documents: HrDocument[],
  country: LegalCountry
): DocumentChecklistItem[] {
  const employeeDocs = documents.filter((d) => d.employee_id === employee.id);
  const requirements = getRequirementsForEmployee(employee, country);

  return requirements.map((req) => {
    const matched = employeeDocs.find((doc) => matchesDocument(req.kind, doc, req));
    return {
      ...req,
      status: matched ? "uploaded" : "missing",
      matchedDocument: matched,
    };
  });
}

export function getTeamDocumentSummary(
  staff: Employee[],
  documents: HrDocument[],
  country: LegalCountry
): { employee: Employee; missing: number; total: number }[] {
  return staff.map((employee) => {
    const checklist = buildDocumentChecklist(employee, documents, country);
    const missing = checklist.filter((c) => c.status === "missing").length;
    return { employee, missing, total: checklist.length };
  });
}
