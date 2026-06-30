import { AppShell } from "@/components/AppShell";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { getPaletteBootScript } from "@/lib/theme";
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
  description: "Weekly shift scheduling for teams",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ShiftMind",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0F3D2E",
};

const themeBootScript = `(function(){try{var palettes=${getPaletteBootScript()};var m=localStorage.getItem('shiftmind-theme-mode')||'light';var pid=localStorage.getItem('shiftmind-theme-palette')||'forest';var pal=palettes[pid]||palettes.forest;var r=document.documentElement;r.dataset.theme=m;r.dataset.palette=pid;r.style.setProperty('--brand-primary',pal.p);r.style.setProperty('--brand-primary-hover',pal.ph);r.style.setProperty('--brand-accent',pal.a);if(m==='dark'){r.style.setProperty('--bg-app','#0A0A0A');r.style.setProperty('--bg-surface','#141414');r.style.setProperty('--text-primary','#FFFFFF');r.style.setProperty('--text-muted','rgba(255,255,255,0.75)');r.style.setProperty('--border-color','rgba(255,255,255,0.12)');r.style.setProperty('--nav-bg','rgba(10,10,10,0.95)');}else{r.style.setProperty('--bg-app','#F5F5F5');r.style.setProperty('--bg-surface','#FFFFFF');r.style.setProperty('--text-primary','#000000');r.style.setProperty('--text-muted','rgba(0,0,0,0.65)');r.style.setProperty('--border-color','rgba(0,0,0,0.1)');r.style.setProperty('--nav-bg','rgba(255,255,255,0.95)');}r.style.setProperty('--text-on-brand','#FFFFFF');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-full bg-app font-sans text-foreground antialiased">
        <ThemeProvider>
          <LanguageProvider>
            <AppShell>{children}</AppShell>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
