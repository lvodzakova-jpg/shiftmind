"use client";

import { useMember } from "@/components/MemberProvider";
import { useTranslation } from "@/components/LanguageProvider";
import { MANAGER_MOBILE_NAV, STAFF_MOBILE_NAV } from "@/lib/roles";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { isManager, loaded } = useMember();

  if (!loaded) return null;

  const links = isManager ? MANAGER_MOBILE_NAV : STAFF_MOBILE_NAV;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-default bg-surface/95 backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-lg justify-around px-2 py-2">
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          const label =
            link.key === "clockin"
              ? t("nav.clockin")
              : link.key === "mySchedule"
                ? t("nav.mySchedule")
                : link.key === "overview"
                  ? t("nav.overview")
                  : t(`nav.${link.key}`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] font-medium ${
                active ? "text-brand" : "text-muted"
              }`}
            >
              <span className="text-lg">{link.icon}</span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
