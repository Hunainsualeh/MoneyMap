"use client";

import React, { useState, useRef } from "react";
import { useTheme, themes, ThemeName } from "@/contexts/ThemeContext";
import { useDesign, designMeta, designNames, DesignName } from "@/contexts/DesignContext";
import { useAuth } from "@/contexts/AuthContext";
import { TabItem, defaultTabs } from "@/components/Sidebar";
import ConfirmModal from "@/components/ConfirmModal";
import {
  Palette,
  Download,
  Upload,
  Plus,
  Trash2,
  User,
  Check,
  X,
  Wallet,
  Layout,
  BarChart3,
  StickyNote,
  CheckSquare,
  Settings,
  Tag,
  LucideIcon,
  GripVertical,
  Monitor,
  LogOut,
  FileJson,
  Save,
  Grid3X3,
  CalendarClock,
} from "lucide-react";

const tabIcons: Record<string, LucideIcon> = {
  expenses: Wallet,
  budgets: Layout,
  graphs: BarChart3,
  notes: StickyNote,
  todos: CheckSquare,
  scheduler: CalendarClock,
  widgets: Grid3X3,
  categories: Tag,
  settings: Settings,
};

interface SettingsPanelProps {
  tabs: TabItem[];
  onTabsChange: (tabs: TabItem[]) => void;
  onExportTemplate: () => void;
  onImportTemplate: (json: string) => void;
  monthlySalary: number;
  onSalaryChange: (v: number) => void;
}

export default function SettingsPanel({
  tabs,
  onTabsChange,
  onExportTemplate,
  onImportTemplate,
  monthlySalary,
  onSalaryChange,
}: SettingsPanelProps) {
  const { theme, setTheme, colors } = useTheme();
  const { design, setDesign } = useDesign();
  const { user, signOut } = useAuth();
  const [importText, setImportText] = useState("");
  const [newTabLabel, setNewTabLabel] = useState("");
  const [editingSalary, setEditingSalary] = useState(false);
  const [salaryInput, setSalaryInput] = useState(String(monthlySalary));
  const [deleteTabConfirm, setDeleteTabConfirm] = useState<string | null>(null);
  const [importError, setImportError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Tab drag state
  const [dragTabIdx, setDragTabIdx] = useState<number | null>(null);
  const [dragOverTabIdx, setDragOverTabIdx] = useState<number | null>(null);

  const safeTabs = Array.isArray(tabs) ? tabs : defaultTabs;

  const handleAddTab = () => {
    if (!newTabLabel.trim()) return;
    const id = newTabLabel.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const newTab: TabItem = { id, label: newTabLabel.trim(), icon: Layout };
    onTabsChange([...safeTabs, newTab]);
    setNewTabLabel("");
  };

  const handleRemoveTab = (tabId: string) => {
    if (["expenses", "settings"].includes(tabId)) return;
    onTabsChange(safeTabs.filter(t => t.id !== tabId));
    setDeleteTabConfirm(null);
  };

  const handleSalary = () => {
    const num = parseFloat(salaryInput) || 0;
    onSalaryChange(num);
    setEditingSalary(false);
  };

  // Tab drag handlers
  const onTabDragStart = (idx: number) => setDragTabIdx(idx);
  const onTabDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverTabIdx(idx); };
  const onTabDrop = (idx: number) => {
    if (dragTabIdx === null || dragTabIdx === idx) return;
    const newOrder = [...safeTabs];
    const [moved] = newOrder.splice(dragTabIdx, 1);
    newOrder.splice(idx, 0, moved);
    onTabsChange(newOrder);
    setDragTabIdx(null); setDragOverTabIdx(null);
  };
  const onTabDragEnd = () => { setDragTabIdx(null); setDragOverTabIdx(null); };

  // Template file drop
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("ring-2", "ring-blue-400");
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (text) onImportTemplate(text);
      };
      reader.readAsText(file);
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (text) onImportTemplate(text);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up w-full">
      {/* Account */}
      <section className={`${colors.surface} border ${colors.border} rounded-xl p-4 ${colors.cardShadow}`}>
        <h3 className={`text-sm font-bold ${colors.text} mb-3 flex items-center gap-2`}><User size={14} /> Account</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className={colors.textSecondary}>Name</span>
            <span className={`font-medium ${colors.text}`}>{user?.displayName || "—"}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className={colors.textSecondary}>Email</span>
            <span className={`font-medium ${colors.text}`}>{user?.email || "—"}</span>
          </div>
        </div>
      </section>

      {/* Monthly Salary */}
      <section className={`${colors.surface} border ${colors.border} rounded-xl p-4 ${colors.cardShadow}`}>
        <h3 className={`text-sm font-bold ${colors.text} mb-3 flex items-center gap-2`}><Wallet size={14} /> Monthly Salary</h3>
        {editingSalary ? (
          <div className="flex items-center gap-2">
            <span className={`text-sm ${colors.textSecondary}`}>PKR</span>
            <input type="number" value={salaryInput} onChange={(e) => setSalaryInput(e.target.value)}
              className={`flex-1 px-3 py-1.5 rounded-lg border ${colors.border} ${colors.inputBg} ${colors.text} text-sm outline-none`} autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSalary()} />
            <button onClick={handleSalary} className="p-1.5 rounded-lg bg-emerald-600 text-white"><Check size={14} /></button>
            <button onClick={() => setEditingSalary(false)} className={`p-1.5 rounded-lg border ${colors.border} ${colors.text}`}><X size={14} /></button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className={`text-lg font-bold ${colors.text}`}>PKR {monthlySalary.toLocaleString()}</span>
            <button onClick={() => { setSalaryInput(String(monthlySalary)); setEditingSalary(true); }}
              className={`px-3 py-1 rounded-lg border ${colors.border} text-xs ${colors.text} font-medium hover:opacity-80`}>Edit</button>
          </div>
        )}
      </section>

      {/* Design Layout */}
      <section className={`${colors.surface} border ${colors.border} rounded-xl p-5 ${colors.cardShadow}`}>
        <h3 className={`text-sm font-bold ${colors.text} mb-4 flex items-center gap-2`}><Monitor size={16} /> Design Layout</h3>
        <div className="grid grid-cols-2 gap-3">
          {designNames.map((d) => {
            const meta = designMeta[d];
            const isActive = design === d;
            return (
              <button
                key={d}
                onClick={() => setDesign(d)}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  isActive
                    ? `${colors.primary} text-white border-transparent`
                    : `${colors.surface} ${colors.border} ${colors.text} hover:border-blue-400`
                }`}
              >
                <div className="text-2xl mb-2">{meta.preview}</div>
                <p className={`font-bold text-sm ${isActive ? "text-white" : colors.text}`}>{meta.name}</p>
                <p className={`text-xs mt-0.5 ${isActive ? "text-white/70" : colors.textSecondary}`}>{meta.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Theme */}
      <section className={`${colors.surface} border ${colors.border} rounded-xl p-4 ${colors.cardShadow}`}>
        <h3 className={`text-sm font-bold ${colors.text} mb-3 flex items-center gap-2`}><Palette size={14} /> Theme</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(themes) as ThemeName[]).map((t) => {
            const tc = themes[t];
            const active = theme === t;
            return (
              <button key={t} onClick={() => setTheme(t)}
                className={`relative p-3 rounded-xl border-2 transition-all duration-200 text-left ${active ? "border-blue-500 ring-2 ring-blue-500/20" : `${colors.border} hover:border-blue-300`}`}
              >
                <div className="flex gap-1 mb-1.5">
                  <div className={`w-3 h-3 rounded-full ${tc.primary}`} />
                  <div className={`w-3 h-3 rounded-full ${tc.accent}`} />
                  <div className={`w-3 h-3 rounded-full ${tc.sidebarBg}`} />
                </div>
                <p className={`text-xs font-medium ${colors.text}`}>{tc.name}</p>
                {active && (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check size={10} className="text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Tab Manager */}
      <section className={`${colors.surface} border ${colors.border} rounded-xl p-4 ${colors.cardShadow}`}>
        <h3 className={`text-sm font-bold ${colors.text} mb-3 flex items-center gap-2`}><Layout size={14} /> Tabs (drag to reorder)</h3>
        <div className="space-y-1.5 mb-3">
          {safeTabs.map((tab, idx) => {
            const Icon = typeof tab.icon === "string" ? null : (tabIcons[tab.id] || tab.icon);
            return (
              <div
                key={tab.id}
                draggable
                onDragStart={() => onTabDragStart(idx)}
                onDragOver={(e) => onTabDragOver(e, idx)}
                onDrop={() => onTabDrop(idx)}
                onDragEnd={onTabDragEnd}
                className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  dragOverTabIdx === idx ? "bg-blue-100 border border-blue-300" : colors.surfaceAlt
                } ${dragTabIdx === idx ? "opacity-40" : ""}`}
              >
                <div className="flex items-center gap-2 text-sm">
                  <GripVertical size={12} className={`cursor-grab ${colors.textSecondary}`} />
                  {Icon ? <Icon size={14} className={colors.textSecondary} /> : <span>{String(tab.icon)}</span>}
                  <span className={colors.text}>{tab.label}</span>
                </div>
                {!["expenses", "settings"].includes(tab.id) && (
                  <button onClick={() => setDeleteTabConfirm(tab.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={12} /></button>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex gap-2">
          <input type="text" value={newTabLabel} onChange={(e) => setNewTabLabel(e.target.value)} placeholder="New tab name"
            className={`flex-1 px-3 py-1.5 rounded-lg border ${colors.border} ${colors.inputBg} ${colors.text} text-sm outline-none`}
            onKeyDown={(e) => e.key === "Enter" && handleAddTab()} />
          <button onClick={handleAddTab}
            className={`px-3 py-1.5 rounded-lg ${colors.primary} text-white text-sm font-medium flex items-center gap-1`}>
            <Plus size={14} /> Add
          </button>
        </div>
      </section>

      {/* Templates */}
      <section className={`${colors.surface} border ${colors.border} rounded-xl p-4 ${colors.cardShadow}`}>
        <h3 className={`text-sm font-bold ${colors.text} mb-3`}>Templates</h3>
        <div className="flex gap-2 mb-3">
          <button onClick={onExportTemplate}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${colors.primary} text-white text-sm font-medium`}>
            <Download size={14} /> Export
          </button>
        </div>

        {/* Drag & drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("ring-2", "ring-blue-400"); }}
          onDragLeave={(e) => e.currentTarget.classList.remove("ring-2", "ring-blue-400")}
          onDrop={handleFileDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed ${colors.border} rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 transition-colors mb-3`}
        >
          <Upload size={24} className={`mx-auto mb-2 ${colors.textSecondary}`} />
          <p className={`text-sm ${colors.textSecondary}`}>Drop a template JSON file here or click to browse</p>
          <input ref={fileRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
        </div>

        {/* Or paste JSON */}
        <div className="space-y-2">
          <textarea rows={3} value={importText} onChange={(e) => setImportText(e.target.value)}
            placeholder="Or paste template JSON here..."
            className={`w-full px-3 py-2 rounded-lg border ${colors.border} ${colors.inputBg} ${colors.text} text-xs outline-none font-mono resize-none`} />
          {importError && <p className="text-xs text-red-500">{importError}</p>}
          <button onClick={() => { onImportTemplate(importText); setImportText(""); }}
            disabled={!importText.trim()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${colors.accent} text-white text-sm font-medium disabled:opacity-40`}>
            <Upload size={14} /> Import
          </button>
        </div>
      </section>

      {/* Delete tab confirmation */}
      <ConfirmModal
        open={deleteTabConfirm !== null}
        title="Remove Tab"
        message={`Remove the "${safeTabs.find(t => t.id === deleteTabConfirm)?.label || ""}" tab? This won't delete any data.`}
        confirmLabel="Remove"
        danger
        onConfirm={() => deleteTabConfirm && handleRemoveTab(deleteTabConfirm)}
        onCancel={() => setDeleteTabConfirm(null)}
      />
    </div>
  );
}
