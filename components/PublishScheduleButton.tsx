"use client";

import { useTranslation } from "@/components/LanguageProvider";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function PublishScheduleButton({
  weekStart,
  isDraft,
}: {
  weekStart: string;
  isDraft: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isDraft) {
    return (
      <span className="inline-flex items-center rounded-lg bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-800">
        {t("publish.published")}
      </span>
    );
  }

  async function handlePublish() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/schedule/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week_start: weekStart }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("publish.failed"));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.unknownError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handlePublish}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? t("publish.publishing") : t("publish.button")}
      </button>
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  );
}
