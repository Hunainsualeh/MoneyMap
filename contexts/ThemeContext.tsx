"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

export type ThemeName = "light" | "dark" | "ocean" | "forest" | "rose" | "midnight" | "coffee" | "sunset";

export interface ThemeColors {
  name: string;
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  shadow: string;
  text: string;
  textSecondary: string;
  primary: string;
  primaryText: string;
  accent: string;
  accentText: string;
  success: string;
  danger: string;
  warning: string;
  income: string;
  expense: string;
  sidebarBg: string;
  sidebarText: string;
  sidebarActive: string;
  sidebarHover: string;
  cardShadow: string;
  inputBg: string;
}

export const themes: Record<ThemeName, ThemeColors> = {
  light: {
    name: "Light",
    bg: "bg-stone-50",
    surface: "bg-white",
    surfaceAlt: "bg-stone-100",
    border: "border-stone-300",
    shadow: "shadow-sm",
    text: "text-stone-900",
    textSecondary: "text-stone-500",
    primary: "bg-stone-800",
    primaryText: "text-white",
    accent: "bg-emerald-600",
    accentText: "text-white",
    success: "text-emerald-600",
    danger: "text-red-600",
    warning: "bg-amber-500",
    income: "text-emerald-600",
    expense: "text-red-600",
    sidebarBg: "bg-white",
    sidebarText: "text-stone-600",
    sidebarActive: "bg-stone-100",
    sidebarHover: "hover:bg-stone-50",
    cardShadow: "shadow-sm",
    inputBg: "bg-white",
  },
  dark: {
    name: "Dark",
    bg: "bg-zinc-950",
    surface: "bg-zinc-900",
    surfaceAlt: "bg-zinc-800",
    border: "border-zinc-700",
    shadow: "shadow-sm shadow-black/20",
    text: "text-zinc-100",
    textSecondary: "text-zinc-400",
    primary: "bg-indigo-600",
    primaryText: "text-white",
    accent: "bg-indigo-500",
    accentText: "text-white",
    success: "text-emerald-400",
    danger: "text-red-400",
    warning: "bg-amber-500",
    income: "text-emerald-400",
    expense: "text-red-400",
    sidebarBg: "bg-zinc-900",
    sidebarText: "text-zinc-400",
    sidebarActive: "bg-zinc-800",
    sidebarHover: "hover:bg-zinc-800/70",
    cardShadow: "shadow-sm shadow-black/30",
    inputBg: "bg-zinc-800",
  },
  ocean: {
    name: "Ocean",
    bg: "bg-slate-50",
    surface: "bg-white",
    surfaceAlt: "bg-sky-50",
    border: "border-sky-200",
    shadow: "shadow-sm",
    text: "text-slate-900",
    textSecondary: "text-sky-600",
    primary: "bg-sky-700",
    primaryText: "text-white",
    accent: "bg-teal-600",
    accentText: "text-white",
    success: "text-teal-600",
    danger: "text-rose-600",
    warning: "bg-amber-500",
    income: "text-teal-600",
    expense: "text-rose-600",
    sidebarBg: "bg-sky-900",
    sidebarText: "text-sky-200",
    sidebarActive: "bg-sky-800",
    sidebarHover: "hover:bg-sky-800/70",
    cardShadow: "shadow-sm",
    inputBg: "bg-white",
  },
  forest: {
    name: "Forest",
    bg: "bg-green-50",
    surface: "bg-white",
    surfaceAlt: "bg-green-50",
    border: "border-green-200",
    shadow: "shadow-sm",
    text: "text-green-950",
    textSecondary: "text-green-600",
    primary: "bg-green-800",
    primaryText: "text-white",
    accent: "bg-lime-600",
    accentText: "text-white",
    success: "text-emerald-600",
    danger: "text-red-600",
    warning: "bg-yellow-500",
    income: "text-emerald-600",
    expense: "text-red-600",
    sidebarBg: "bg-green-900",
    sidebarText: "text-green-200",
    sidebarActive: "bg-green-800",
    sidebarHover: "hover:bg-green-800/70",
    cardShadow: "shadow-sm",
    inputBg: "bg-white",
  },
  rose: {
    name: "Rose",
    bg: "bg-rose-50",
    surface: "bg-white",
    surfaceAlt: "bg-rose-50",
    border: "border-rose-200",
    shadow: "shadow-sm",
    text: "text-rose-950",
    textSecondary: "text-rose-500",
    primary: "bg-rose-700",
    primaryText: "text-white",
    accent: "bg-pink-500",
    accentText: "text-white",
    success: "text-emerald-600",
    danger: "text-red-600",
    warning: "bg-amber-500",
    income: "text-emerald-600",
    expense: "text-red-600",
    sidebarBg: "bg-rose-900",
    sidebarText: "text-rose-200",
    sidebarActive: "bg-rose-800",
    sidebarHover: "hover:bg-rose-800/70",
    cardShadow: "shadow-sm",
    inputBg: "bg-white",
  },
  midnight: {
    name: "Midnight",
    bg: "bg-slate-950",
    surface: "bg-slate-900",
    surfaceAlt: "bg-slate-800",
    border: "border-slate-700",
    shadow: "shadow-sm shadow-black/20",
    text: "text-slate-100",
    textSecondary: "text-slate-400",
    primary: "bg-blue-600",
    primaryText: "text-white",
    accent: "bg-blue-500",
    accentText: "text-white",
    success: "text-emerald-400",
    danger: "text-red-400",
    warning: "bg-amber-500",
    income: "text-emerald-400",
    expense: "text-red-400",
    sidebarBg: "bg-slate-950",
    sidebarText: "text-slate-400",
    sidebarActive: "bg-slate-800",
    sidebarHover: "hover:bg-slate-800/70",
    cardShadow: "shadow-sm shadow-black/30",
    inputBg: "bg-slate-800",
  },
  coffee: {
    name: "Coffee",
    bg: "bg-stone-100",
    surface: "bg-white",
    surfaceAlt: "bg-stone-100",
    border: "border-stone-300",
    shadow: "shadow-sm",
    text: "text-stone-900",
    textSecondary: "text-stone-500",
    primary: "bg-stone-700",
    primaryText: "text-white",
    accent: "bg-amber-700",
    accentText: "text-white",
    success: "text-emerald-600",
    danger: "text-red-600",
    warning: "bg-amber-500",
    income: "text-emerald-600",
    expense: "text-red-600",
    sidebarBg: "bg-stone-800",
    sidebarText: "text-stone-300",
    sidebarActive: "bg-stone-700",
    sidebarHover: "hover:bg-stone-700/70",
    cardShadow: "shadow-sm",
    inputBg: "bg-white",
  },
  sunset: {
    name: "Sunset",
    bg: "bg-orange-50",
    surface: "bg-white",
    surfaceAlt: "bg-orange-50",
    border: "border-orange-200",
    shadow: "shadow-sm",
    text: "text-orange-950",
    textSecondary: "text-orange-600",
    primary: "bg-orange-700",
    primaryText: "text-white",
    accent: "bg-amber-600",
    accentText: "text-white",
    success: "text-emerald-600",
    danger: "text-red-600",
    warning: "bg-yellow-500",
    income: "text-emerald-600",
    expense: "text-red-600",
    sidebarBg: "bg-orange-900",
    sidebarText: "text-orange-200",
    sidebarActive: "bg-orange-800",
    sidebarHover: "hover:bg-orange-800/70",
    cardShadow: "shadow-sm",
    inputBg: "bg-white",
  },
};

interface ThemeContextType {
  theme: ThemeName;
  colors: ThemeColors;
  setTheme: (theme: ThemeName) => void;
  isTransitioning: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("light");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [phase, setPhase] = useState<"idle" | "shatter" | "rebuild">("idle");
  const pendingRef = useRef<ThemeName | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("moneymap_theme") as ThemeName | null;
    if (saved && themes[saved]) setThemeState(saved);
  }, []);

  const setTheme = useCallback((t: ThemeName) => {
    if (t === theme || isTransitioning) return;
    pendingRef.current = t;
    setIsTransitioning(true);
    setPhase("shatter");

    setTimeout(() => {
      setThemeState(t);
      localStorage.setItem("moneymap_theme", t);
      setPhase("rebuild");
      setTimeout(() => {
        setPhase("idle");
        setIsTransitioning(false);
        pendingRef.current = null;
      }, 420);
    }, 400);
  }, [theme, isTransitioning]);

  return (
    <ThemeContext.Provider value={{ theme, colors: themes[theme], setTheme, isTransitioning }}>
      <div
        className={phase === "shatter" ? "theme-shatter" : phase === "rebuild" ? "theme-rebuild" : ""}
        style={{ minHeight: "100vh" }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
