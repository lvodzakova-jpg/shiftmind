import { LanguageProvider } from "@/components/LanguageProvider";
import { Navbar } from "@/components/Navbar";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShiftMind — AI shift scheduling",
  description: "Weekly shift schedule management for cafés",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sk"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full bg-stone-50 font-sans text-stone-900 antialiased">
        <LanguageProvider>
          <Navbar />
          <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
        </LanguageProvider>
      </body>
    </html>
  );
}
