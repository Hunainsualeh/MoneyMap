"use client";

import React, { useState, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import ConfirmModal from "@/components/ConfirmModal";
import { Plus, Trash2, Edit3, Check, X, GripVertical, Download, Upload, Tag } from "lucide-react";

interface CategoriesManagerProps {
  categories: string[];
  onCategoriesChange: (cats: string[]) => void;
}

export default function CategoriesManager({ categories, onCategoriesChange }: CategoriesManagerProps) {
  const { colors } = useTheme();
  const [newCat, setNewCat] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    const v = newCat.trim();
    if (!v || categories.includes(v)) return;
    onCategoriesChange([...categories, v]);
    setNewCat("");
  };

  const handleDelete = (idx: number) => {
    onCategoriesChange(categories.filter((_, i) => i !== idx));
    setDeleteConfirm(null);
  };

  const handleEdit = (idx: number) => {
    const v = editValue.trim();
    if (!v || (categories.includes(v) && categories[idx] !== v)) return;
    const updated = [...categories];
    updated[idx] = v;
    onCategoriesChange(updated);
    setEditingIdx(null);
    setEditValue("");
  };

  // Drag & Drop
  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) return;
    const updated = [...categories];
    const [moved] = updated.splice(dragIdx, 1);
    updated.splice(idx, 0, moved);
    onCategoriesChange(updated);
    setDragIdx(null);
    setDragOverIdx(null);
  };
  const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };

  // JSON export
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ _moneymap_categories: true, categories }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `moneymap_categories_${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  // JSON import via text
  const importJSON = () => {
    setImportError("");
    try {
      const parsed = JSON.parse(importText);
      if (Array.isArray(parsed)) {
        onCategoriesChange([...new Set([...categories, ...parsed.filter((c: unknown) => typeof c === "string" && c.trim())])]);
      } else if (parsed._moneymap_categories && Array.isArray(parsed.categories)) {
        onCategoriesChange([...new Set([...categories, ...parsed.categories.filter((c: unknown) => typeof c === "string" && c.trim())])]);
      } else {
        setImportError("Invalid format. Expected array or {_moneymap_categories: true, categories: [...]}");
        return;
      }
      setImportText("");
    } catch {
      setImportError("Invalid JSON");
    }
  };

  // File drop / select
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  };
  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (Array.isArray(parsed)) {
          onCategoriesChange([...new Set([...categories, ...parsed.filter((c: unknown) => typeof c === "string")])]);
        } else if (parsed._moneymap_categories && Array.isArray(parsed.categories)) {
          onCategoriesChange([...new Set([...categories, ...parsed.categories])]);
        }
      } catch { setImportError("Failed to parse dropped file"); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-5 animate-fade-up w-full">
      {/* Add Category */}
      <div className={`${colors.surface} border ${colors.border} rounded-xl p-4 ${colors.cardShadow}`}>
        <h3 className={`text-sm font-bold ${colors.text} mb-3 flex items-center gap-2`}><Tag size={14} /> Add Category</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            placeholder="Category name..."
            className={`flex-1 px-3 py-2 rounded-xl border ${colors.border} ${colors.inputBg} ${colors.text} text-sm outline-none`}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <button onClick={handleAdd} className={`px-4 py-2 rounded-xl ${colors.primary} text-white text-sm font-medium flex items-center gap-1.5`}>
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {/* Category List */}
      <div className={`${colors.surface} border ${colors.border} rounded-xl p-4 ${colors.cardShadow}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-bold ${colors.text}`}>Categories ({categories.length})</h3>
          <button onClick={exportJSON} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${colors.primary} text-white text-xs font-medium`}>
            <Download size={12} /> Export JSON
          </button>
        </div>

        {categories.length === 0 ? (
          <p className={`text-sm ${colors.textSecondary} text-center py-6`}>No categories yet. Add one above.</p>
        ) : (
          <div className="space-y-1">
            {categories.map((cat, idx) => (
              <div
                key={`${cat}-${idx}`}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  dragOverIdx === idx ? "bg-blue-100 border border-blue-300" : colors.surfaceAlt
                } ${dragIdx === idx ? "opacity-50" : ""}`}
              >
                <GripVertical size={14} className={`cursor-grab ${colors.textSecondary}`} />
                {editingIdx === idx ? (
                  <>
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className={`flex-1 px-2 py-1 rounded border ${colors.border} ${colors.inputBg} ${colors.text} text-sm outline-none`}
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && handleEdit(idx)}
                    />
                    <button onClick={() => handleEdit(idx)} className="p-1 rounded hover:bg-emerald-100 text-emerald-600"><Check size={14} /></button>
                    <button onClick={() => setEditingIdx(null)} className="p-1 rounded hover:bg-red-100 text-red-500"><X size={14} /></button>
                  </>
                ) : (
                  <>
                    <span className={`flex-1 text-sm ${colors.text}`}>{cat}</span>
                    <button onClick={() => { setEditingIdx(idx); setEditValue(cat); }} className={`p-1 rounded ${colors.sidebarHover} ${colors.textSecondary}`}><Edit3 size={13} /></button>
                    <button onClick={() => setDeleteConfirm(idx)} className="p-1 rounded hover:bg-red-100 text-red-500"><Trash2 size={13} /></button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Import Section */}
      <div className={`${colors.surface} border ${colors.border} rounded-xl p-4 ${colors.cardShadow}`}>
        <h3 className={`text-sm font-bold ${colors.text} mb-3 flex items-center gap-2`}><Upload size={14} /> Import Categories</h3>

        {/* Drag & drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("ring-2", "ring-blue-400"); }}
          onDragLeave={(e) => e.currentTarget.classList.remove("ring-2", "ring-blue-400")}
          onDrop={(e) => { e.currentTarget.classList.remove("ring-2", "ring-blue-400"); handleFileDrop(e); }}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed ${colors.border} rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 transition-colors mb-3`}
        >
          <Upload size={24} className={`mx-auto mb-2 ${colors.textSecondary}`} />
          <p className={`text-sm ${colors.textSecondary}`}>Drop a JSON file here or click to browse</p>
          <input ref={fileRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
        </div>

        {/* Paste JSON */}
        <textarea
          rows={3}
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder='Paste JSON: ["Food", "Transport", ...] or {_moneymap_categories: true, categories: [...]}'
          className={`w-full px-3 py-2 rounded-lg border ${colors.border} ${colors.inputBg} ${colors.text} text-xs outline-none font-mono resize-none mb-2`}
        />
        {importError && <p className="text-xs text-red-500 mb-2">{importError}</p>}
        <button
          onClick={importJSON}
          disabled={!importText.trim()}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${colors.accent} text-white text-sm font-medium disabled:opacity-40`}
        >
          <Upload size={14} /> Import from JSON
        </button>
      </div>

      <ConfirmModal
        open={deleteConfirm !== null}
        title="Delete Category"
        message={deleteConfirm !== null ? `Delete "${categories[deleteConfirm]}"? It won't remove it from existing expenses.` : ""}
        confirmLabel="Delete"
        danger
        onConfirm={() => deleteConfirm !== null && handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
