"use client";

import { useTranslation } from "@/components/LanguageProvider";
import type { HrDocumentKind } from "@/lib/hr-documents";
import { useEffect, useRef } from "react";

interface DocumentTextModalProps {
  open: boolean;
  title: string;
  text: string;
  loading?: boolean;
  onClose: () => void;
  kind?: HrDocumentKind;
}

export function DocumentTextModal({
  open,
  title,
  text,
  loading,
  onClose,
  kind,
}: DocumentTextModalProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleCopy() {
    void navigator.clipboard.writeText(text);
  }

  function handleDownload() {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${kind ?? "document"}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!open && !loading) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="w-full max-w-2xl rounded-2xl border border-default bg-surface p-0 shadow-xl backdrop:bg-black/40"
    >
      <div className="border-b border-default px-6 py-4">
        <h2 className="text-lg font-semibold text-foreground">
          {loading ? t("documents.generatingText") : title}
        </h2>
      </div>
      <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
        {loading ? (
          <p className="text-muted">{t("documents.generatingText")}</p>
        ) : (
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
            {text}
          </pre>
        )}
      </div>
      <div className="flex flex-wrap justify-end gap-2 border-t border-default px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-default px-4 py-2 text-sm hover:bg-subtle"
        >
          {t("documents.closeModal")}
        </button>
        {!loading && text && (
          <>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-lg border border-default px-4 py-2 text-sm hover:bg-subtle"
            >
              {t("documents.copyText")}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-on-brand hover:bg-brand-hover"
            >
              {t("documents.downloadText")}
            </button>
          </>
        )}
      </div>
    </dialog>
  );
}
