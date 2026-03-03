"use client";

import React, { useState, useRef, useEffect, ReactNode } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { X, Minus, GripHorizontal } from "lucide-react";

interface DraggableWidgetProps {
  id: string;
  title: string;
  icon: ReactNode;
  children: ReactNode;
  onClose: () => void;
  defaultPosition?: { x: number; y: number };
  width?: number;
}

export default function DraggableWidget({
  id,
  title,
  icon,
  children,
  onClose,
  defaultPosition,
  width = 280,
}: DraggableWidgetProps) {
  const { colors } = useTheme();
  const [pos, setPos] = useState(() => {
    if (typeof window === "undefined") return defaultPosition || { x: 100, y: 100 };
    try {
      const saved = localStorage.getItem(`widget_pos_${id}`);
      if (saved) return JSON.parse(saved);
    } catch { /* noop */ }
    return defaultPosition || { x: 100, y: 100 };
  });
  const [minimized, setMinimized] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  useEffect(() => {
    try { localStorage.setItem(`widget_pos_${id}`, JSON.stringify(pos)); } catch { /* noop */ }
  }, [id, pos]);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      setPos({
        x: Math.max(0, dragRef.current.origX + dx),
        y: Math.max(0, dragRef.current.origY + dy),
      });
    };

    const onMouseUp = () => {
      dragRef.current = null;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div
      className={`fixed z-[90] ${colors.surface} border ${colors.border} rounded-xl overflow-hidden`}
      style={{ left: pos.x, top: pos.y, width, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
    >
      {/* Draggable header */}
      <div
        onMouseDown={onMouseDown}
        className={`flex items-center gap-2 px-3 py-2 ${colors.surfaceAlt} border-b ${colors.border} cursor-grab active:cursor-grabbing select-none`}
      >
        <GripHorizontal size={14} className={colors.textSecondary} />
        <span className="flex items-center gap-1.5 flex-1 min-w-0">
          {icon}
          <span className={`text-xs font-bold ${colors.text} truncate`}>{title}</span>
        </span>
        <button onClick={() => setMinimized(!minimized)} className={`p-0.5 rounded ${colors.sidebarHover} ${colors.textSecondary}`}>
          <Minus size={12} />
        </button>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-red-100 text-red-500">
          <X size={12} />
        </button>
      </div>

      {!minimized && (
        <div className="max-h-[350px] overflow-y-auto p-3">
          {children}
        </div>
      )}
    </div>
  );
}
