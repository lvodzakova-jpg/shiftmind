"use client";

import { AppLogo } from "@/components/AppLogo";
import { useTranslation } from "@/components/LanguageProvider";
import { createBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function JoinPageView() {
  const { t } = useTranslation();
  const router = useRouter();

  const [inviteCode, setInviteCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createBrowserClient();

    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (signUpError) {
        setLoading(false);
        setError(signUpError.message);
        return;
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setLoading(false);
        setError(signInError.message);
        return;
      }
    }

    const joinRes = await fetch("/api/auth/join-workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode }),
    });

    const joinBody = await joinRes.json();
    setLoading(false);

    if (!joinRes.ok) {
      setError(joinBody.error ?? t("auth.joinFailed"));
      return;
    }

    router.push("/");
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
          {t("auth.joinTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted">{t("auth.joinSubtitle")}</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t("auth.inviteCodeLabel")}
            </label>
            <input
              type="text"
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="w-full rounded-lg border border-default bg-app px-3 py-2 font-mono text-lg tracking-widest"
              placeholder="ABC123"
              maxLength={8}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t("auth.emailLabel")}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-default bg-app px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              {t("auth.passwordLabel")}
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-default bg-app px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2 text-sm">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded-lg px-3 py-1.5 ${
                mode === "login"
                  ? "bg-brand text-white"
                  : "bg-subtle text-muted"
              }`}
            >
              {t("auth.loginLink")}
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`rounded-lg px-3 py-1.5 ${
                mode === "signup"
                  ? "bg-brand text-white"
                  : "bg-subtle text-muted"
              }`}
            >
              {t("auth.signupLink")}
            </button>
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
          {loading ? t("auth.joining") : t("auth.joinButton")}
        </button>

        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/signup" className="font-medium text-brand hover:underline">
            {t("auth.createOwnTeam")}
          </Link>
        </p>
      </form>
    </div>
  );
}
