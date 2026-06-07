"use client";

import { AppLogo } from "@/components/AppLogo";
import { useTranslation } from "@/components/LanguageProvider";
import { createBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginPageView() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-app px-6 py-12">
      <div className="mb-8">
        <AppLogo size="lg" showWordmark tagline={t("auth.tagline")} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-default bg-surface p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-foreground">
          {t("auth.loginTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted">{t("auth.loginSubtitle")}</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t("auth.emailLabel")}
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-default bg-app px-3 py-2 text-sm"
              placeholder={t("auth.emailPlaceholder")}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t("auth.passwordLabel")}
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-default bg-app px-3 py-2 text-sm"
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-rose-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-6 w-full"
        >
          {loading ? t("auth.signingIn") : t("auth.loginButton")}
        </button>

        <p className="mt-6 text-center text-sm text-muted">
          {t("auth.noAccount")}{" "}
          <Link href="/signup" className="font-medium text-brand hover:underline">
            {t("auth.signupLink")}
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-muted">
          {t("auth.haveInvite")}{" "}
          <Link href="/join" className="font-medium text-brand hover:underline">
            {t("auth.joinLink")}
          </Link>
        </p>
      </form>
    </div>
  );
}
