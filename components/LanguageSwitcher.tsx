"use client";

import { useTranslation } from "@/components/LanguageProvider";
import { LOCALE_LABELS, LOCALES, type Locale } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div
      className="flex items-center rounded-lg border border-default bg-surface p-0.5"
      role="group"
      aria-label={t("aria.language")}
    >
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code as Locale)}
          className={`rounded-md px-2.5 py-1.5 text-xs font-semibold tracking-wide transition-colors ${
            locale === code
              ? "bg-brand text-on-brand"
              : "text-foreground hover:bg-subtle"
          }`}
          aria-pressed={locale === code}
        >
          {LOCALE_LABELS[code]}
        </button>
      ))}
    </div>
  );
}
