"use client";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "@/components/LanguageProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const links = [
    { href: "/", label: t("nav.overview") },
    { href: "/schedule", label: t("nav.schedule") },
    { href: "/staff", label: t("nav.staff") },
    { href: "/preferences", label: t("nav.preferences") },
    { href: "/settings", label: t("nav.settings") },
    { href: "/clockin", label: t("nav.clockin") },
  ];

  return (
    <header className="border-b border-stone-200 bg-white/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-3">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600 text-sm font-bold text-white shadow-sm">
              SM
            </span>
            <div>
              <span className="text-lg font-semibold tracking-tight text-stone-900">
                ShiftMind
              </span>
              <span className="hidden text-xs text-stone-500 sm:block">
                {t("nav.tagline")}
              </span>
            </div>
          </Link>
          <LanguageSwitcher />
        </div>
        <nav className="-mx-1 flex gap-0.5 overflow-x-auto pb-2 scrollbar-none">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:py-2 sm:text-sm ${
                  active
                    ? "bg-amber-50 text-amber-900"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
