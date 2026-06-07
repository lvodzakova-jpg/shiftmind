"use client";

import { useTranslation } from "@/components/LanguageProvider";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DuplicateWeekButtonProps {
  weekStart: string;
}

export function DuplicateWeekButton({ weekStart }: DuplicateWeekButtonProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDuplicate() {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/duplicate-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("schedule.duplicateFailed"));
      setMessage(t("schedule.duplicateSuccess"));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("schedule.duplicateFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleDuplicate}
        disabled={loading}
        className="rounded-lg border border-default bg-surface px-3 py-2 text-sm font-medium hover:bg-subtle disabled:opacity-50"
      >
        {loading ? t("common.saving") : t("schedule.duplicateWeek")}
      </button>
      {message && <p className="mt-1 text-xs text-accent">{message}</p>}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
