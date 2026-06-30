"use client";

import { AppLogo } from "@/components/AppLogo";
import { useTranslation } from "@/components/LanguageProvider";
import { createBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ResetPasswordView() {
  const { t } = useTranslation();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-app px-6 py-12">
      <AppLogo size="lg" showWordmark />
      <form
        onSubmit={handleSubmit}
        className="mt-8 w-full max-w-md rounded-2xl border border-default bg-surface p-6"
      >
        <h1 className="text-xl font-semibold">{t("auth.resetTitle")}</h1>
        {done ? (
          <p className="mt-4 text-sm text-emerald-700">{t("auth.resetDone")}</p>
        ) : (
          <>
            <input
              type="password"
              required
              minLength={6}
              className="mt-4 w-full rounded-lg border border-default bg-app px-3 py-2 text-sm"
              placeholder={t("auth.passwordLabel")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary mt-4 w-full">
              {t("auth.resetButton")}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
