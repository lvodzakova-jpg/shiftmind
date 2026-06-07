"use client";

import { useTranslation } from "@/components/LanguageProvider";
import { useState } from "react";

interface TeamInviteCardProps {
  inviteCode: string;
  businessName: string;
}

export function TeamInviteCard({
  inviteCode,
  businessName,
}: TeamInviteCardProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://shiftmind-2mcl.vercel.app";

  async function copyCode() {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function copyLink() {
    const link = `${appUrl}/join`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mb-8 rounded-2xl border border-default bg-surface p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">
        {t("auth.inviteTeamTitle")}
      </h2>
      <p className="mt-1 text-sm text-muted">
        {t("auth.inviteTeamDescription", { name: businessName })}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="rounded-xl bg-subtle px-4 py-3 font-mono text-2xl font-bold tracking-widest text-foreground">
          {inviteCode}
        </span>
        <button type="button" onClick={copyCode} className="btn-secondary">
          {copied ? t("auth.copied") : t("auth.copyCode")}
        </button>
        <button type="button" onClick={copyLink} className="btn-secondary">
          {t("auth.copyJoinLink")}
        </button>
      </div>

      <p className="mt-4 text-sm text-muted">{t("auth.inviteInstructions")}</p>
    </div>
  );
}
