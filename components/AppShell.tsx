"use client";

import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Navbar } from "@/components/Navbar";
import { usePathname } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanguagePage = pathname === "/";

  return (
    <>
      {!isLanguagePage && <Navbar />}
      <main
        className={`mx-auto max-w-6xl px-4 sm:px-6 ${
          isLanguagePage ? "max-w-none px-0" : "py-8 pb-24 md:pb-8"
        }`}
      >
        {children}
      </main>
      {!isLanguagePage && <MobileBottomNav />}
    </>
  );
}
