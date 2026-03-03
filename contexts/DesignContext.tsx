"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type DesignName = "modern" | "neobrutalist" | "minimal" | "glass";

export const designMeta: Record<DesignName, { name: string; description: string; preview: string }> = {
  modern: { name: "Modern", description: "Clean sidebar layout with soft curves", preview: "✨" },
  neobrutalist: { name: "Neo Brutalist", description: "Bold borders, sharp shadows, full-width", preview: "🎨" },
  minimal: { name: "Minimal", description: "Ultra-clean top navigation layout", preview: "🪶" },
  glass: { name: "Glass", description: "Frosted glass effects with gradient backdrop", preview: "💎" },
};

export const designNames = Object.keys(designMeta) as DesignName[];

interface DesignContextType {
  design: DesignName;
  setDesign: (d: DesignName) => void;
}

const DesignContext = createContext<DesignContextType | undefined>(undefined);

export function DesignProvider({ children }: { children: React.ReactNode }) {
  const [design, setDesignState] = useState<DesignName>("modern");

  useEffect(() => {
    const saved = localStorage.getItem("moneymap_design") as DesignName | null;
    if (saved && designMeta[saved]) setDesignState(saved);
  }, []);

  const setDesign = useCallback((d: DesignName) => {
    setDesignState(d);
    localStorage.setItem("moneymap_design", d);
  }, []);

  return (
    <DesignContext.Provider value={{ design, setDesign }}>
      {children}
    </DesignContext.Provider>
  );
}

export function useDesign() {
  const ctx = useContext(DesignContext);
  if (!ctx) throw new Error("useDesign must be used within DesignProvider");
  return ctx;
}
