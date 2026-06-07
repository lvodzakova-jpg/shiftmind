"use client";

import { useTranslation } from "@/components/LanguageProvider";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface GenerateScheduleButtonProps {
  weekStart: string;
  variant?: "primary" | "secondary";
}

export function GenerateScheduleButton({
  weekStart,
  variant = "primary",
}: GenerateScheduleButtonProps) {
  const { locale, t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week_start: weekStart, locale }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t("generate.failed"));
      }
      router.refresh();
      router.push("/schedule");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.unknownError"));
    } finally {
      setLoading(false);
    }
  }

  const base =
    variant === "primary"
      ? "btn-primary shadow-sm"
      : "btn-secondary";

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium tracking-wide disabled:opacity-60 ${base}`}
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {t("generate.loading")}
          </>
        ) : (
          t("generate.button")
        )}
      </button>
      {error && (
        <p className="max-w-md text-sm text-rose-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
