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
      : "https://shiftmind.com";

  const joinUrl = `${appUrl}/join?code=${inviteCode}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(joinUrl)}`;

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
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

      <div className="mt-4 flex flex-wrap items-start gap-6">
        <div>
          <span className="rounded-xl bg-subtle px-4 py-3 font-mono text-2xl font-bold tracking-widest text-foreground">
            {inviteCode}
          </span>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => copy(inviteCode)}
              className="btn-secondary"
            >
              {copied ? t("auth.copied") : t("auth.copyCode")}
            </button>
            <button
              type="button"
              onClick={() => copy(joinUrl)}
              className="btn-secondary"
            >
              {t("auth.copyJoinLink")}
            </button>
          </div>
        </div>
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt="QR code"
            width={180}
            height={180}
            className="rounded-lg border border-default"
          />
          <p className="mt-2 text-xs text-muted">{t("auth.scanQr")}</p>
        </div>
      </div>

      <p className="mt-4 break-all text-xs text-muted">{joinUrl}</p>
      <p className="mt-2 text-sm text-muted">{t("auth.inviteInstructions")}</p>
    </div>
  );
}
