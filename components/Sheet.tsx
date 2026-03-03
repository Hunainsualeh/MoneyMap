"use client";

import React, { useState, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useDesign } from "@/contexts/DesignContext";
import ConfirmModal from "@/components/ConfirmModal";
import { Plus, Trash2, Edit3, Check, X, ChevronDown, ChevronUp, GripVertical, Download } from "lucide-react";

export interface ColumnDef<T> {
  key: keyof T & string;
  label: string;
  type?: "text" | "number" | "date" | "select" | "checkbox" | "toggle";
  options?: string[];
  width?: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface SheetProps<T extends { id: string }> {
  title: string;
  columns: ColumnDef<T>[];
  data: T[];
  onAdd: (item: T) => void;
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
  defaultItem: () => T;
  currency?: string;
}

export default function Sheet<T extends { id: string }>({
  title,
  columns,
  data,
  onAdd,
  onEdit,
  onDelete,
  defaultItem,
  currency = "PKR",
}: SheetProps<T>) {
  const { colors } = useTheme();
  const { design } = useDesign();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<T>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState<T>(defaultItem());
  const [sortKey, setSortKey] = useState<string>("");
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Drag row
  const [dragRowIdx, setDragRowIdx] = useState<number | null>(null);
  const [dragOverRowIdx, setDragOverRowIdx] = useState<number | null>(null);
  const localData = useRef(data);
  localData.current = data;

  // Column reorder
  const [colOrder, setColOrder] = useState<string[]>(columns.filter(c => c.key !== "id").map(c => c.key));
  const [dragColIdx, setDragColIdx] = useState<number | null>(null);
  const [dragOverColIdx, setDragOverColIdx] = useState<number | null>(null);

  // Ensure colOrder stays in sync when columns prop changes
  const visibleCols = colOrder
    .map(k => columns.find(c => c.key === k))
    .filter((c): c is ColumnDef<T> => !!c);

  // If columns prop has new keys not in colOrder, append them
  const allKeys: string[] = columns.filter(c => c.key !== "id").map(c => c.key as string);
  if (allKeys.length !== colOrder.length || !allKeys.every(k => colOrder.includes(k))) {
    const fresh = allKeys.filter(k => !colOrder.includes(k));
    if (fresh.length > 0) {
      setColOrder([...colOrder.filter(k => allKeys.includes(k)), ...fresh]);
    }
  }

  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const av = a[sortKey as keyof T];
    const bv = b[sortKey as keyof T];
    if (typeof av === "number" && typeof bv === "number") return sortAsc ? av - bv : bv - av;
    return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const startEdit = (row: T) => { setEditingId(row.id); setEditValues({ ...row }); };
  const saveEdit = () => { if (editingId) { onEdit({ ...editValues, id: editingId } as T); setEditingId(null); setEditValues({}); } };
  const cancelEdit = () => { setEditingId(null); setEditValues({}); };
  const handleAdd = () => { onAdd({ ...newItem, id: crypto.randomUUID() }); setNewItem(defaultItem()); setShowAddForm(false); };

  // Row drag handlers
  const onRowDragStart = (idx: number) => setDragRowIdx(idx);
  const onRowDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverRowIdx(idx); };
  const onRowDrop = (idx: number) => {
    if (dragRowIdx === null || dragRowIdx === idx) return;
    const items = [...sorted];
    const [moved] = items.splice(dragRowIdx, 1);
    items.splice(idx, 0, moved);
    // Re-save all items in new order
    items.forEach((item, i) => {
      if (sorted[i]?.id !== item.id) onEdit(item);
    });
    setDragRowIdx(null); setDragOverRowIdx(null);
  };
  const onRowDragEnd = () => { setDragRowIdx(null); setDragOverRowIdx(null); };

  // Column drag handlers
  const onColDragStart = (idx: number) => setDragColIdx(idx);
  const onColDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverColIdx(idx); };
  const onColDrop = (idx: number) => {
    if (dragColIdx === null || dragColIdx === idx) return;
    const newOrder = [...colOrder];
    const [moved] = newOrder.splice(dragColIdx, 1);
    newOrder.splice(idx, 0, moved);
    setColOrder(newOrder);
    setDragColIdx(null); setDragOverColIdx(null);
  };
  const onColDragEnd = () => { setDragColIdx(null); setDragOverColIdx(null); };

  // CSV export
  const exportCSV = () => {
    const heads = visibleCols.map(c => c.label);
    const rows = data.map(row => visibleCols.map(col => {
      const v = row[col.key];
      return typeof v === "string" ? `"${v.replace(/"/g, '""')}"` : String(v ?? "");
    }));
    const csv = [heads.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${title.toLowerCase()}_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  function renderInput(col: ColumnDef<T>, value: unknown, onChange: (val: unknown) => void, isCompact = false) {
    const baseClass = `w-full rounded-lg border ${colors.border} ${colors.inputBg} ${colors.text} text-sm px-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-400 ${isCompact ? "text-xs" : ""}`;

    if (col.type === "toggle" && col.options) {
      const v = String(value ?? col.options[0]);
      const next = col.options[(col.options.indexOf(v) + 1) % col.options.length];
      return (
        <button
          type="button"
          onClick={() => onChange(next)}
          className={`w-full px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
            v === "Paid" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-amber-100 text-amber-700 hover:bg-amber-200"
          }`}
        >
          {v}
        </button>
      );
    }
    if (col.type === "select" && col.options) {
      return (
        <select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={baseClass}>
          <option value="">Select</option>
          {col.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }
    if (col.type === "checkbox") {
      return <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 rounded" />;
    }
    if (col.type === "number") {
      return <input type="number" value={value === undefined || value === null ? "" : String(value)} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className={baseClass} step="any" />;
    }
    return <input type={col.type === "date" ? "date" : "text"} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={baseClass} />;
  }

  function renderCell(col: ColumnDef<T>, row: T) {
    const val = row[col.key];
    if (col.type === "toggle" && col.options) {
      const v = String(val ?? col.options[0]);
      const next = col.options[(col.options.indexOf(v) + 1) % col.options.length];
      return (
        <button
          type="button"
          onClick={() => onEdit({ ...row, [col.key]: next } as T)}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
            v === "Paid" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-amber-100 text-amber-700 hover:bg-amber-200"
          }`}
        >
          {v}
        </button>
      );
    }
    if (col.render) return col.render(val, row);
    if (col.type === "checkbox") return val ? <span className="text-emerald-600 font-bold">✓</span> : <span className={colors.textSecondary}>—</span>;
    if (col.type === "number") return <span className="font-medium">{currency ? `${currency} ` : ""}{Number(val).toLocaleString()}</span>;
    return String(val ?? "");
  }

  /* Design-aware classes */
  const isNeo = design === "neobrutalist";
  const isGlass = design === "glass";
  const cardClass = isNeo
    ? `${colors.surface} border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.25)]`
    : isGlass
    ? `backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl`
    : `${colors.surface} border ${colors.border} rounded-xl ${colors.cardShadow}`;
  const textColor = isGlass ? "text-white" : colors.text;
  const textSecColor = isGlass ? "text-white/60" : colors.textSecondary;
  const headerBg = isNeo ? `${colors.surfaceAlt} border-b-3 border-black font-black uppercase tracking-wide` : isGlass ? "bg-white/5 border-b border-white/10" : colors.surfaceAlt;
  const rowBorder = isNeo ? `border-t-2 border-black/30` : isGlass ? "border-t border-white/10" : `border-t ${colors.border}`;
  const neoCellBorder = isNeo ? "border-r-2 border-black/10 last:border-r-0" : "";
  const neoRound = isNeo ? "" : "rounded-xl";
  const neoBtn = isNeo ? "border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all" : "rounded-xl";

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className={`text-lg font-bold ${textColor}`}>{title} <span className={`text-sm font-normal ${textSecColor}`}>({data.length})</span></h2>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className={`flex items-center gap-1.5 px-3 py-1.5 ${neoRound} border ${isNeo ? 'border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)]' : colors.border} ${textColor} text-sm font-${isNeo ? 'black' : 'medium'} hover:opacity-80`}>
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`flex items-center gap-1.5 px-3 py-1.5 ${neoRound} ${colors.primary} text-white text-sm font-${isNeo ? 'black' : 'medium'} hover:opacity-90 transition-opacity ${isNeo ? 'border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] active:translate-x-0.5 active:translate-y-0.5' : ''}`}
          >
            {showAddForm ? <X size={14} /> : <Plus size={14} />}
            {showAddForm ? "Cancel" : "Add Row"}
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className={`${cardClass} ${neoRound} p-4 mb-4 animate-fade-up`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {columns.filter(c => c.key !== "id").map((col) => (
              <div key={col.key}>
                <label className={`block text-xs font-medium ${textSecColor} mb-1`}>{col.label}</label>
                {renderInput(col, newItem[col.key], (v) => setNewItem({ ...newItem, [col.key]: v }))}
              </div>
            ))}
          </div>
          <button onClick={handleAdd} className={`mt-3 flex items-center gap-1.5 px-4 py-2 ${neoRound} ${colors.accent} text-white text-sm font-${isNeo ? 'black' : 'medium'} hover:opacity-90 transition-opacity ${isNeo ? 'border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)]' : ''}`}>
            <Plus size={14} /> Add {title.replace(/s$/, "")}
          </button>
        </div>
      )}

      {data.length === 0 ? (
        <div className={`text-center py-12 ${textSecColor} text-sm ${cardClass}`}>
          No {title.toLowerCase()} yet. Click &quot;Add Row&quot; to create one.
        </div>
      ) : (
        <>
          {/* Desktop Table inside scrollable container */}
          <div className={`hidden md:block ${cardClass} overflow-hidden`}>
            <div className="overflow-auto max-h-[70vh]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className={headerBg}>
                    <th className={`w-8 px-2 py-3 ${textSecColor}`}></th>
                    {visibleCols.map((col, ci) => (
                      <th
                        key={col.key}
                        draggable
                        onDragStart={() => onColDragStart(ci)}
                        onDragOver={(e) => onColDragOver(e, ci)}
                        onDrop={() => onColDrop(ci)}
                        onDragEnd={onColDragEnd}
                        onClick={() => toggleSort(col.key)}
                        className={`text-left px-4 py-3 font-${isNeo ? 'black text-xs' : 'medium'} ${textSecColor} cursor-pointer select-none whitespace-nowrap transition-colors ${neoCellBorder} ${
                          dragOverColIdx === ci ? "bg-blue-100/20" : ""
                        }`}
                        style={{ width: col.width }}
                      >
                        <span className="flex items-center gap-1">
                          <GripVertical size={10} className="opacity-30 cursor-grab" />
                          {col.label}
                          {sortKey === col.key && (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                        </span>
                      </th>
                    ))}
                    <th className={`text-right px-4 py-3 font-medium ${textSecColor} sticky right-0 ${headerBg}`} style={{ width: "80px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row, ri) => (
                    <tr
                      key={row.id}
                      draggable
                      onDragStart={() => onRowDragStart(ri)}
                      onDragOver={(e) => onRowDragOver(e, ri)}
                      onDrop={() => onRowDrop(ri)}
                      onDragEnd={onRowDragEnd}
                      className={`${rowBorder} transition-colors ${
                        dragOverRowIdx === ri ? "bg-blue-50/20" : ""
                      } ${dragRowIdx === ri ? "opacity-40" : ""} ${isNeo ? 'hover:bg-black/5' : ''}`}
                    >
                      <td className="px-2 py-3 text-center">
                        <GripVertical size={14} className={`cursor-grab ${textSecColor} opacity-40 hover:opacity-100`} />
                      </td>
                      {visibleCols.map((col) => (
                        <td key={col.key} className={`px-4 py-3 ${textColor} ${neoCellBorder} ${isNeo ? 'font-medium' : ''}`}>
                          {editingId === row.id
                            ? renderInput(col, editValues[col.key], (v) => setEditValues({ ...editValues, [col.key]: v }))
                            : renderCell(col, row)}
                        </td>
                      ))}
                      <td className={`px-4 py-3 text-right sticky right-0 ${isGlass ? "bg-white/5" : colors.surface}`}>
                        {editingId === row.id ? (
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={saveEdit} className="p-1 rounded hover:bg-emerald-100 text-emerald-600"><Check size={14} /></button>
                            <button onClick={cancelEdit} className="p-1 rounded hover:bg-red-100 text-red-500"><X size={14} /></button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => startEdit(row)} className={`p-1 rounded ${colors.sidebarHover} ${colors.textSecondary}`}><Edit3 size={14} /></button>
                            <button onClick={() => setDeleteId(row.id)} className="p-1 rounded hover:bg-red-100 text-red-500"><Trash2 size={14} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-2 max-h-[75vh] overflow-y-auto">
            {sorted.map((row) => (
              <div key={row.id} className={`${cardClass} overflow-hidden`}>
                <button
                  onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                  className={`w-full flex items-center justify-between p-3 text-left ${textColor}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{String(row[columns[1]?.key] ?? row[columns[0]?.key] ?? "")}</p>
                    {columns.find(c => c.type === "number") && (
                      <p className={`text-xs ${textSecColor}`}>{currency} {Number(row[columns.find(c => c.type === "number")!.key]).toLocaleString()}</p>
                    )}
                  </div>
                  {expandedId === row.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {expandedId === row.id && (
                  <div className={`px-3 pb-3 ${rowBorder} pt-2 space-y-2 animate-fade-up`}>
                    {editingId === row.id ? (
                      <>
                        {columns.filter(c => c.key !== "id").map((col) => (
                          <div key={col.key}>
                            <label className={`block text-xs ${textSecColor} mb-0.5`}>{col.label}</label>
                            {renderInput(col, editValues[col.key], (v) => setEditValues({ ...editValues, [col.key]: v }), true)}
                          </div>
                        ))}
                        <div className="flex gap-2 pt-1">
                          <button onClick={saveEdit} className="flex-1 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium">Save</button>
                          <button onClick={cancelEdit} className={`flex-1 py-1.5 rounded-lg border ${colors.border} ${textColor} text-xs font-medium`}>Cancel</button>
                        </div>
                      </>
                    ) : (
                      <>
                        {columns.filter(c => c.key !== "id").map((col) => (
                          <div key={col.key} className="flex justify-between text-xs">
                            <span className={textSecColor}>{col.label}</span>
                            <span className={textColor}>{renderCell(col, row)}</span>
                          </div>
                        ))}
                        <div className="flex gap-2 pt-1">
                          <button onClick={() => startEdit(row)} className={`flex-1 py-1.5 rounded-lg border ${colors.border} ${textColor} text-xs font-medium`}>Edit</button>
                          <button onClick={() => setDeleteId(row.id)} className="flex-1 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium">Delete</button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmModal
        open={deleteId !== null}
        title={`Delete ${title.replace(/s$/, "")}`}
        message="Are you sure? This action cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={() => { if (deleteId) { onDelete(deleteId); setDeleteId(null); } }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
