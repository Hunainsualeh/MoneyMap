"use client";

import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { colors } = useTheme();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onCancel} />
      <div className={`relative w-full max-w-sm ${colors.surface} border ${colors.border} rounded-2xl p-6 ${colors.shadow} animate-scale-in`}>
        <div className="flex items-start gap-3 mb-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${danger ? "bg-red-100" : "bg-amber-100"}`}>
            <AlertTriangle size={20} className={danger ? "text-red-600" : "text-amber-600"} />
          </div>
          <div>
            <h3 className={`text-base font-bold ${colors.text}`}>{title}</h3>
            <p className={`text-sm ${colors.textSecondary} mt-1`}>{message}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className={`px-4 py-2 rounded-xl border ${colors.border} ${colors.text} text-sm font-medium hover:opacity-80 transition-opacity`}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity ${
              danger ? "bg-red-600" : colors.primary
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
