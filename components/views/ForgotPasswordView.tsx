"use client";

import { AppLogo } from "@/components/AppLogo";
import { useTranslation } from "@/components/LanguageProvider";
import { createBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordView() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createBrowserClient();
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${origin}/reset-password` },
    );
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-app px-6 py-12">
      <AppLogo size="lg" showWordmark />
      <form
        onSubmit={handleSubmit}
        className="mt-8 w-full max-w-md rounded-2xl border border-default bg-surface p-6"
      >
        <h1 className="text-xl font-semibold">{t("auth.forgotTitle")}</h1>
        <p className="mt-1 text-sm text-muted">{t("auth.forgotSubtitle")}</p>
        {sent ? (
          <p className="mt-4 text-sm text-emerald-700">{t("auth.forgotSent")}</p>
        ) : (
          <>
            <input
              type="email"
              required
              className="mt-4 w-full rounded-lg border border-default bg-app px-3 py-2 text-sm"
              placeholder={t("auth.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary mt-4 w-full">
              {loading ? t("auth.sending") : t("auth.forgotButton")}
            </button>
          </>
        )}
        <p className="mt-4 text-center text-sm">
          <Link href="/login" className="text-brand hover:underline">
            {t("auth.backToLogin")}
          </Link>
        </p>
      </form>
    </div>
  );
}
