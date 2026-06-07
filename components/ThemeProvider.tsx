"use client";

import {
  DEFAULT_MODE,
  DEFAULT_PALETTE,
  applyThemeToDocument,
  getStoredThemeMode,
  getStoredThemePalette,
  type ThemeMode,
  type ThemePalette,
} from "@/lib/theme";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface ThemeContextValue {
  mode: ThemeMode;
  palette: ThemePalette;
  setMode: (mode: ThemeMode) => void;
  setPalette: (palette: ThemePalette) => void;
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_MODE);
  const [palette, setPaletteState] = useState<ThemePalette>(DEFAULT_PALETTE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedMode = getStoredThemeMode();
    const storedPalette = getStoredThemePalette();
    setModeState(storedMode);
    setPaletteState(storedPalette);
    applyThemeToDocument(storedMode, storedPalette);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    applyThemeToDocument(mode, palette);
    localStorage.setItem("shiftmind-theme-mode", mode);
    localStorage.setItem("shiftmind-theme-palette", palette);
  }, [mode, palette, ready]);

  const setMode = useCallback((next: ThemeMode) => setModeState(next), []);
  const setPalette = useCallback((next: ThemePalette) => setPaletteState(next), []);

  const value = useMemo(
    () => ({ mode, palette, setMode, setPalette, ready }),
    [mode, palette, setMode, setPalette, ready]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
