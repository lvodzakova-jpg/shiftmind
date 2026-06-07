export type ThemeMode = "light" | "dark";
export type ThemePalette =
  | "forest"
  | "midnight"
  | "platinum"
  | "emerald"
  | "slate"
  | "burgundy"
  | "ocean"
  | "sunset"
  | "violet"
  | "gold"
  | "rose"
  | "mint";

export const THEME_MODE_KEY = "shiftmind-theme-mode";
export const THEME_PALETTE_KEY = "shiftmind-theme-palette";

export interface PaletteColors {
  id: ThemePalette;
  labelKey: string;
  primary: string;
  primaryHover: string;
  accent: string;
  accentMuted: string;
}

export const PALETTES: PaletteColors[] = [
  {
    id: "forest",
    labelKey: "forest",
    primary: "#0F3D2E",
    primaryHover: "#0A2D22",
    accent: "#7EC8E3",
    accentMuted: "#B8E4F0",
  },
  {
    id: "midnight",
    labelKey: "midnight",
    primary: "#1A2744",
    primaryHover: "#121B30",
    accent: "#93C5FD",
    accentMuted: "#BFDBFE",
  },
  {
    id: "platinum",
    labelKey: "platinum",
    primary: "#2D3436",
    primaryHover: "#1E2426",
    accent: "#74B9FF",
    accentMuted: "#A8D4FF",
  },
  {
    id: "emerald",
    labelKey: "emerald",
    primary: "#064E3B",
    primaryHover: "#043D2E",
    accent: "#6EE7B7",
    accentMuted: "#A7F3D0",
  },
  {
    id: "slate",
    labelKey: "slate",
    primary: "#1E293B",
    primaryHover: "#0F172A",
    accent: "#38BDF8",
    accentMuted: "#7DD3FC",
  },
  {
    id: "burgundy",
    labelKey: "burgundy",
    primary: "#4A1942",
    primaryHover: "#361231",
    accent: "#E8B4B8",
    accentMuted: "#F5D5D8",
  },
  {
    id: "ocean",
    labelKey: "ocean",
    primary: "#0C4A6E",
    primaryHover: "#083652",
    accent: "#67E8F9",
    accentMuted: "#A5F3FC",
  },
  {
    id: "sunset",
    labelKey: "sunset",
    primary: "#7C2D12",
    primaryHover: "#5C210D",
    accent: "#FDBA74",
    accentMuted: "#FED7AA",
  },
  {
    id: "violet",
    labelKey: "violet",
    primary: "#4C1D95",
    primaryHover: "#3B1578",
    accent: "#C4B5FD",
    accentMuted: "#DDD6FE",
  },
  {
    id: "gold",
    labelKey: "gold",
    primary: "#78350F",
    primaryHover: "#5C2809",
    accent: "#FCD34D",
    accentMuted: "#FDE68A",
  },
  {
    id: "rose",
    labelKey: "rose",
    primary: "#881337",
    primaryHover: "#6B0F2B",
    accent: "#FDA4AF",
    accentMuted: "#FECDD3",
  },
  {
    id: "mint",
    labelKey: "mint",
    primary: "#134E4A",
    primaryHover: "#0D3D3A",
    accent: "#5EEAD4",
    accentMuted: "#99F6E4",
  },
];

export const DEFAULT_MODE: ThemeMode = "light";
export const DEFAULT_PALETTE: ThemePalette = "forest";

export function isThemeMode(v: string): v is ThemeMode {
  return v === "light" || v === "dark";
}

export function isThemePalette(v: string): v is ThemePalette {
  return PALETTES.some((p) => p.id === v);
}

export function getPalette(id: ThemePalette): PaletteColors {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

export function getStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") return DEFAULT_MODE;
  const stored = localStorage.getItem(THEME_MODE_KEY);
  return stored && isThemeMode(stored) ? stored : DEFAULT_MODE;
}

export function getStoredThemePalette(): ThemePalette {
  if (typeof window === "undefined") return DEFAULT_PALETTE;
  const stored = localStorage.getItem(THEME_PALETTE_KEY);
  return stored && isThemePalette(stored) ? stored : DEFAULT_PALETTE;
}

export function applyThemeToDocument(mode: ThemeMode, paletteId: ThemePalette) {
  const palette = getPalette(paletteId);
  const root = document.documentElement;
  root.dataset.theme = mode;
  root.dataset.palette = paletteId;
  root.style.setProperty("--brand-primary", palette.primary);
  root.style.setProperty("--brand-primary-hover", palette.primaryHover);
  root.style.setProperty("--brand-accent", palette.accent);
  root.style.setProperty("--brand-accent-muted", palette.accentMuted);

  if (mode === "dark") {
    root.style.setProperty("--bg-app", "#0A0A0A");
    root.style.setProperty("--bg-surface", "#141414");
    root.style.setProperty("--bg-elevated", "#1A1A1A");
    root.style.setProperty("--bg-subtle", "rgba(255, 255, 255, 0.06)");
    root.style.setProperty("--text-primary", "#FFFFFF");
    root.style.setProperty("--text-muted", "rgba(255, 255, 255, 0.75)");
    root.style.setProperty("--border-color", "rgba(255, 255, 255, 0.12)");
    root.style.setProperty("--nav-bg", "rgba(10, 10, 10, 0.95)");
    root.style.setProperty("--text-on-brand", "#FFFFFF");
  } else {
    root.style.setProperty("--bg-app", "#F5F5F5");
    root.style.setProperty("--bg-surface", "#FFFFFF");
    root.style.setProperty("--bg-elevated", "#FFFFFF");
    root.style.setProperty("--bg-subtle", "rgba(0, 0, 0, 0.04)");
    root.style.setProperty("--text-primary", "#000000");
    root.style.setProperty("--text-muted", "rgba(0, 0, 0, 0.65)");
    root.style.setProperty("--border-color", "rgba(0, 0, 0, 0.1)");
    root.style.setProperty("--nav-bg", "rgba(255, 255, 255, 0.95)");
    root.style.setProperty("--text-on-brand", "#FFFFFF");
  }
}

/** JSON map for inline boot script */
export function getPaletteBootScript(): string {
  const map: Record<string, { p: string; ph: string; a: string }> = {};
  for (const pal of PALETTES) {
    map[pal.id] = { p: pal.primary, ph: pal.primaryHover, a: pal.accent };
  }
  return JSON.stringify(map);
}
