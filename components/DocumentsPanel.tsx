"use client";

import { DocumentGuide } from "@/components/DocumentGuide";
import { DocumentTextModal } from "@/components/DocumentTextModal";
import { useTranslation } from "@/components/LanguageProvider";
import { showLocalNotification } from "@/lib/push-client";
import {
  buildDocumentChecklist,
  getTeamDocumentSummary,
  type HrDocumentKind,
} from "@/lib/hr-documents";
import { TABLES } from "@/lib/db";
import { createBrowserClient } from "@/lib/supabase/client";
import type { DocumentType, HrDocument, LegalCountry, Staff } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

interface DocumentsPanelProps {
  staff: Staff[];
  documents: HrDocument[];
  currentEmployeeId?: string | null;
  legalCountry?: LegalCountry;
}

const DOC_TYPES: DocumentType[] = ["contract", "id", "certificate", "other"];

interface ChecklistItemEnriched {
  kind: HrDocumentKind;
  documentType: DocumentType;
  status: "uploaded" | "missing";
  aiNote?: string | null;
}

export function DocumentsPanel({
  staff,
  documents: initial,
  currentEmployeeId,
  legalCountry = "sk",
}: DocumentsPanelProps) {
  const { locale, t } = useTranslation();
  const router = useRouter();
  const [documents, setDocuments] = useState(initial);
  const [employeeId, setEmployeeId] = useState(
    currentEmployeeId ?? staff[0]?.id ?? ""
  );
  const [name, setName] = useState("");
  const [type, setType] = useState<DocumentType>("contract");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiChecklist, setAiChecklist] = useState<ChecklistItemEnriched[] | null>(
    null
  );
  const [notifying, setNotifying] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState<string | null>(null);
  const [textModal, setTextModal] = useState<{
    open: boolean;
    title: string;
    text: string;
    loading: boolean;
    kind?: HrDocumentKind;
  }>({ open: false, title: "", text: "", loading: false });

  const selectedEmployee = staff.find((s) => s.id === employeeId);
  const teamSummary = useMemo(
    () => getTeamDocumentSummary(staff, documents, legalCountry),
    [staff, documents, legalCountry]
  );

  const localChecklist = useMemo(() => {
    if (!selectedEmployee) return [];
    return buildDocumentChecklist(selectedEmployee, documents, legalCountry);
  }, [selectedEmployee, documents, legalCountry]);

  const checklist = aiChecklist ?? localChecklist;
  const missingCount = checklist.filter((c) => c.status === "missing").length;

  const visibleDocs = currentEmployeeId
    ? documents.filter((d) => d.employee_id === currentEmployeeId)
    : documents;

  async function handleNotify(targetId?: string) {
    setNotifying(true);
    setNotifyMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/notify-missing-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: targetId,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.count === 0) {
        setNotifyMessage(t("documents.notifyNone"));
      } else {
        setNotifyMessage(
          t("documents.notifySuccess", { count: data.count })
        );
        showLocalNotification(
          t("documents.reminderTitle"),
          t("documents.notifySuccess", { count: data.count })
        );
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.unknownError"));
    } finally {
      setNotifying(false);
    }
  }

  async function handleGenerateText(kind: HrDocumentKind) {
    if (!employeeId) return;
    setTextModal({
      open: true,
      title: t(`documents.guide.${kind}.title`),
      text: "",
      loading: true,
      kind,
    });
    try {
      const res = await fetch("/api/generate-document-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: employeeId,
          kind,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTextModal({
        open: true,
        title: t(`documents.guide.${kind}.title`),
        text: data.text,
        loading: false,
        kind,
      });
    } catch (e) {
      setTextModal({ open: false, title: "", text: "", loading: false });
      setError(e instanceof Error ? e.message : t("common.unknownError"));
    }
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: employeeId || undefined,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const match = data.checklists?.find(
        (c: { employee: { id: string } }) => c.employee.id === employeeId
      );
      if (match) {
        setAiChecklist(match.items);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.unknownError"));
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId || !name.trim() || !file) return;
    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const url = reader.result as string;
      const supabase = createBrowserClient();
      const { data, error: insertError } = await supabase
        .from(TABLES.hrDocuments)
        .insert({
          employee_id: employeeId,
          name: name.trim(),
          type,
          url,
        })
        .select()
        .single();
      setLoading(false);
      if (insertError) {
        setError(insertError.message);
        return;
      }
      if (data) {
        setDocuments((prev) => [data as HrDocument, ...prev]);
        setAiChecklist(null);
        setName("");
        setFile(null);
        router.refresh();
      }
    };
    reader.readAsDataURL(file);
  }

  const empName = (id: string) => staff.find((s) => s.id === id)?.name ?? id;

  return (
    <div>
      <DocumentTextModal
        open={textModal.open}
        title={textModal.title}
        text={textModal.text}
        loading={textModal.loading}
        kind={textModal.kind}
        onClose={() =>
          setTextModal({ open: false, title: "", text: "", loading: false })
        }
      />

      {!currentEmployeeId && (
        <DocumentGuide
          country={legalCountry}
          sampleEmployee={selectedEmployee}
        />
      )}

      {!currentEmployeeId && staff.length > 0 && (
        <section className="mb-8 rounded-2xl border border-default bg-subtle p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{t("documents.teamOverview")}</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleNotify()}
                disabled={notifying}
                className="rounded-xl border border-default bg-surface px-4 py-2 text-sm font-medium hover:bg-subtle disabled:opacity-50"
              >
                {notifying ? t("documents.notifying") : t("documents.notifyTeam")}
              </button>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing}
                className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-50"
              >
                {analyzing ? t("documents.analyzing") : t("documents.analyzeAi")}
              </button>
            </div>
          </div>
          {notifyMessage && (
            <p className="mb-3 text-sm text-accent">{notifyMessage}</p>
          )}
          <ul className="grid gap-2 sm:grid-cols-2">
            {teamSummary.map((row) => (
              <li
                key={row.employee.id}
                className={`rounded-xl border px-4 py-3 text-sm ${
                  row.missing > 0
                    ? "border-amber-200 bg-amber-50"
                    : "border-accent/30 bg-surface"
                }`}
              >
                <span className="font-medium">{row.employee.name}</span>
                <span className="text-muted">
                  {" "}
                  —{" "}
                  {row.missing === 0
                    ? t("documents.allComplete")
                    : t("documents.missingCount", {
                        missing: row.missing,
                        total: row.total,
                      })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {selectedEmployee && (
        <section className="mb-8 rounded-2xl border border-default bg-surface p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{t("documents.checklistTitle")}</h2>
              <p className="text-sm text-muted">
                {selectedEmployee.name} ·{" "}
                {missingCount === 0
                  ? t("documents.allComplete")
                  : t("documents.missingCount", {
                      missing: missingCount,
                      total: checklist.length,
                    })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {missingCount > 0 && (
                <button
                  type="button"
                  onClick={() => handleNotify(employeeId)}
                  disabled={notifying}
                  className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                >
                  {notifying ? t("documents.notifying") : t("documents.notifyOne")}
                </button>
              )}
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing}
                className="rounded-xl border border-default bg-subtle px-4 py-2 text-sm font-medium hover:bg-surface disabled:opacity-50"
              >
                {analyzing ? t("documents.analyzing") : t("documents.analyzeAi")}
              </button>
            </div>
          </div>
          <ul className="space-y-3">
            {checklist.map((item) => (
              <li
                key={item.kind}
                className={`rounded-xl border p-4 ${
                  item.status === "missing"
                    ? "border-amber-200 bg-amber-50/50"
                    : "border-accent/30 bg-subtle/50"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">
                      {item.status === "uploaded" ? "✓ " : "○ "}
                      {t(`documents.guide.${item.kind}.title`)}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {t(`documents.guide.${item.kind}.why`)}
                    </p>
                    {"aiNote" in item && item.aiNote && (
                      <p className="mt-2 text-sm text-brand">{item.aiNote}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        item.status === "missing"
                          ? "bg-amber-100 text-amber-900"
                          : "bg-accent/20 text-foreground"
                      }`}
                    >
                      {item.status === "missing"
                        ? t("documents.statusMissing")
                        : t("documents.statusUploaded")}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleGenerateText(item.kind)}
                      className="rounded-lg bg-brand px-2.5 py-1 text-xs font-semibold text-on-brand hover:bg-brand-hover"
                    >
                      {t("documents.generateText")}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {!currentEmployeeId && (
          <form
            onSubmit={handleUpload}
            className="rounded-2xl border border-default bg-surface p-6 shadow-sm"
          >
            <h2 className="mb-4 text-lg font-semibold">{t("documents.upload")}</h2>
            <div className="space-y-3">
              <select
                value={employeeId}
                onChange={(e) => {
                  setEmployeeId(e.target.value);
                  setAiChecklist(null);
                }}
                className="w-full rounded-lg border border-default px-3 py-2"
              >
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("documents.name")}
                className="w-full rounded-lg border border-default px-3 py-2"
                required
              />
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DocumentType)}
                className="w-full rounded-lg border border-default px-3 py-2"
              >
                {DOC_TYPES.map((dt) => (
                  <option key={dt} value={dt}>
                    {t(`documents.types.${dt}`)}
                  </option>
                ))}
              </select>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-brand py-2.5 font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-50"
              >
                {loading ? t("common.saving") : t("documents.upload")}
              </button>
              {error && <p className="text-sm text-rose-600">{error}</p>}
            </div>
          </form>
        )}

        <div className={`space-y-3 ${currentEmployeeId ? "lg:col-span-2" : ""}`}>
          <h2 className="text-lg font-semibold">{t("documents.uploadedTitle")}</h2>
          {visibleDocs.length === 0 ? (
            <p className="text-muted">{t("documents.empty")}</p>
          ) : (
            visibleDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-xl border border-default bg-surface p-4 shadow-sm"
              >
                <div>
                  <p className="font-medium text-foreground">{doc.name}</p>
                  <p className="text-sm text-muted">
                    {!currentEmployeeId && `${empName(doc.employee_id)} · `}
                    {t(`documents.types.${doc.type}`)} ·{" "}
                    {new Date(doc.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-subtle px-3 py-1.5 text-sm font-medium text-brand hover:bg-subtle"
                >
                  {t("documents.view")}
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
