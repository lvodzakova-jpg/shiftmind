"use client";

import { AppLogo } from "@/components/AppLogo";
import { ThemeControls } from "@/components/ThemeControls";
import { useTranslation } from "@/components/LanguageProvider";
import { DEFAULT_LOCALE, isLocale, STORAGE_KEY } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const languages = [
  { code: "sk", name: "Slovenčina" },
  { code: "cs", name: "Čeština" },
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "it", name: "Italiano" },
  { code: "pt", name: "Português" },
  { code: "pl", name: "Polski" },
  { code: "nl", name: "Nederlands" },
  { code: "hu", name: "Magyar" },
  { code: "ro", name: "Română" },
  { code: "bg", name: "Български" },
  { code: "hr", name: "Hrvatski" },
  { code: "sr", name: "Srpski" },
  { code: "sl", name: "Slovenščina" },
  { code: "da", name: "Dansk" },
  { code: "sv", name: "Svenska" },
  { code: "no", name: "Norsk" },
  { code: "fi", name: "Suomi" },
  { code: "et", name: "Eesti" },
  { code: "lv", name: "Latviešu" },
  { code: "lt", name: "Lietuvių" },
  { code: "el", name: "Ελληνικά" },
];

export default function LanguagePicker() {
  const router = useRouter();
  const { t, setLocale } = useTranslation();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) router.push("/dashboard");
  }, [router]);

  function selectLanguage(code: string) {
    const locale = isLocale(code) ? code : DEFAULT_LOCALE;
    setLocale(locale);
    router.push("/dashboard");
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-app px-6 py-16">
      <div className="absolute right-6 top-6">
        <ThemeControls compact />
      </div>

      <div className="mb-12 text-center">
        <div className="mb-6 flex justify-center">
          <AppLogo size="lg" showWordmark tagline={t("languagePicker.tagline")} />
        </div>
        <p className="mx-auto max-w-md text-sm tracking-wide text-muted">
          {t("languagePicker.subtitle")}
        </p>
      </div>

      <div className="grid w-full max-w-3xl grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {languages.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => selectLanguage(lang.code)}
            className="group card flex flex-col items-start px-4 py-3.5 text-left transition-all hover:border-brand hover:shadow-sm"
          >
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
              {lang.code}
            </span>
            <span className="mt-1 text-sm font-medium text-foreground">
              {lang.name}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-12 w-full max-w-3xl">
        <ThemeControls />
      </div>
    </div>
  );
}
