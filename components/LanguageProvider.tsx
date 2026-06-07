"use client";

import {
  DEFAULT_LOCALE,
  STORAGE_KEY,
  getStoredLocale,
  isLocale,
  translate,
  type Locale,
} from "@/lib/i18n";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Params = Record<string, string | number>;

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Params) => string;
  ready: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLocaleState(getStoredLocale());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale;
  }, [locale, ready]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: string, params?: Params) => translate(locale, key, params),
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, ready }),
    [locale, setLocale, t, ready]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within LanguageProvider");
  }
  return ctx;
}

export function useLocale(): Locale {
  return useTranslation().locale;
}
