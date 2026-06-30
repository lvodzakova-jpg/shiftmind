"use client";

import { MobileBottomNav } from "@/components/MobileBottomNav";
import { MemberProvider } from "@/components/MemberProvider";
import { Navbar } from "@/components/Navbar";
import { usePathname } from "next/navigation";

const AUTH_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/join",
  "/forgot-password",
  "/reset-password",
  "/onboarding",
]);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = AUTH_PATHS.has(pathname);

  return (
    <MemberProvider>
      {!hideNav && <Navbar />}
      <main
        className={`mx-auto max-w-6xl px-4 sm:px-6 ${
          hideNav ? "max-w-none px-0" : "py-8 pb-24 md:pb-8"
        }`}
      >
        {children}
      </main>
      {!hideNav && <MobileBottomNav />}
    </MemberProvider>
  );
}
