"use client";

import { AppLogo } from "@/components/AppLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeControls } from "@/components/ThemeControls";
import { useTranslation } from "@/components/LanguageProvider";
import { TABLES } from "@/lib/db";
import { getCurrentEmployeeId } from "@/lib/current-user";
import { createBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [unread, setUnread] = useState(0);

  async function handleLogout() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const links = [
    { href: "/dashboard", label: t("nav.overview") },
    { href: "/schedule", label: t("nav.schedule") },
    { href: "/templates", label: t("nav.templates") },
    { href: "/staff", label: t("nav.staff") },
    { href: "/leaves", label: t("nav.leaves") },
    { href: "/swaps", label: t("nav.swaps") },
    { href: "/compliance", label: t("nav.compliance") },
    { href: "/documents", label: t("nav.documents") },
    { href: "/payroll", label: t("nav.payroll") },
    { href: "/attendance", label: t("nav.attendance") },
    { href: "/preferences", label: t("nav.preferences") },
    { href: "/settings", label: t("nav.settings") },
    { href: "/clockin", label: t("nav.clockin") },
  ];

  useEffect(() => {
    const employeeId = getCurrentEmployeeId();
    if (!employeeId) return;
    const supabase = createBrowserClient();
    supabase
      .from(TABLES.messages)
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", employeeId)
      .eq("read", false)
      .then(({ count }) => setUnread(count ?? 0));
  }, [pathname]);

  return (
    <header
      className="sticky top-0 z-50 border-b border-default backdrop-blur-md"
      style={{ backgroundColor: "var(--nav-bg)" }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-3">
          <Link href="/dashboard" className="shrink-0">
            <AppLogo size="sm" showWordmark tagline={t("nav.tagline")} />
          </Link>
          <div className="flex items-center gap-1.5">
            <Link
              href="/messages"
              className="relative rounded-lg p-2 text-muted transition-colors hover:bg-subtle hover:text-foreground"
              aria-label={t("nav.messages")}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-brand">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
            <ThemeControls compact />
            <LanguageSwitcher />
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-subtle hover:text-foreground sm:text-sm"
            >
              {t("auth.logout")}
            </button>
          </div>
        </div>
        <nav className="-mx-1 flex gap-0.5 overflow-x-auto pb-2 scrollbar-none">
          {links.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium tracking-wide transition-colors sm:px-3 sm:py-2 sm:text-sm ${
                  active
                    ? "bg-brand text-on-brand"
                    : "text-foreground hover:bg-subtle"
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
