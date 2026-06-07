"use client";

import { useTheme } from "@/components/ThemeProvider";
import { useTranslation } from "@/components/LanguageProvider";
import { PALETTES } from "@/lib/theme";
import { useState } from "react";

export function ThemeControls({
  compact = false,
  showTitle = true,
}: {
  compact?: boolean;
  showTitle?: boolean;
}) {
  const { mode, palette, setMode, setPalette } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  if (compact) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="rounded-lg border border-default p-2 text-foreground transition-colors hover:bg-subtle"
          aria-label={t("theme.customize")}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <ThemePanel
              mode={mode}
              palette={palette}
              setMode={setMode}
              setPalette={setPalette}
              onClose={() => setOpen(false)}
              showTitle={showTitle}
              className="absolute right-0 top-full z-50 mt-2 w-80"
            />
          </>
        )}
      </div>
    );
  }

  return (
    <ThemePanel
      mode={mode}
      palette={palette}
      setMode={setMode}
      setPalette={setPalette}
      showTitle={showTitle}
    />
  );
}

function ThemePanel({
  mode,
  palette,
  setMode,
  setPalette,
  onClose,
  showTitle = true,
  className = "",
}: {
  mode: "light" | "dark";
  palette: string;
  setMode: (m: "light" | "dark") => void;
  setPalette: (p: import("@/lib/theme").ThemePalette) => void;
  onClose?: () => void;
  showTitle?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <div
      className={`card p-5 shadow-xl ${className}`}
    >
      {showTitle && (
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          {t("theme.customize")}
        </h3>
      )}
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
        {t("theme.appearance")}
      </p>
      <div className="mb-5 flex rounded-lg border border-default p-0.5">
        {(["light", "dark"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              onClose?.();
            }}
            className={`flex-1 rounded-md py-2 text-xs font-medium transition-colors ${
              mode === m
                ? "bg-brand text-on-brand"
                : "text-foreground hover:bg-subtle"
            }`}
          >
            {t(`theme.${m}`)}
          </button>
        ))}
      </div>
      <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
        {t("theme.palette")}
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {PALETTES.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              setPalette(p.id);
              onClose?.();
            }}
            className={`flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-all hover:bg-subtle ${
              palette === p.id
                ? "border-brand ring-1 ring-brand"
                : "border-default"
            }`}
          >
            <span
              className="h-8 w-full rounded-md"
              style={{
                background: `linear-gradient(135deg, ${p.primary} 50%, ${p.accent} 50%)`,
              }}
            />
            <span className="text-[10px] font-medium text-foreground">
              {t(`theme.palettes.${p.labelKey}`)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
