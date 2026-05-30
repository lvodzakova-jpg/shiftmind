"use client";

import { useTranslation } from "@/components/LanguageProvider";
import { LOCALE_LABELS, LOCALES, type Locale } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div
      className="flex items-center rounded-lg border border-stone-200 bg-stone-50 p-0.5"
      role="group"
      aria-label={t("aria.language")}
    >
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code as Locale)}
          className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
            locale === code
              ? "bg-white text-amber-900 shadow-sm"
              : "text-stone-600 hover:text-stone-900"
          }`}
          aria-pressed={locale === code}
        >
          {LOCALE_LABELS[code]}
        </button>
      ))}
    </div>
  );
}
