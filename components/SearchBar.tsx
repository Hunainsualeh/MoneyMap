"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useDesign } from "@/contexts/DesignContext";
import { ExpenseRow, BudgetRow, TodoRow, NoteItem } from "@/lib/firestore";
import {
  Search, X, Wallet, Layout, CheckSquare, StickyNote,
} from "lucide-react";

interface SearchBarProps {
  expenses: ExpenseRow[];
  budgets: BudgetRow[];
  todos: TodoRow[];
  notes: NoteItem[];
  onNavigate: (tab: string) => void;
}

interface SearchResult {
  type: "expense" | "budget" | "todo" | "note";
  id: string;
  title: string;
  subtitle: string;
  tab: string;
}

export default function SearchBar({ expenses, budgets, todos, notes, onNavigate }: SearchBarProps) {
  const { colors } = useTheme();
  const { design } = useDesign();
  const isNeo = design === "neobrutalist";
  const isGlass = design === "glass";
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textCls = isGlass ? "text-white" : colors.text;
  const textSecCls = isGlass ? "text-white/60" : colors.textSecondary;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard shortcut: Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const res: SearchResult[] = [];

    expenses.forEach((e) => {
      if (e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) || e.note?.toLowerCase().includes(q)) {
        res.push({ type: "expense", id: e.id, title: e.description || e.category, subtitle: `PKR ${e.amount.toLocaleString()} · ${e.type} · ${e.status}`, tab: "expenses" });
      }
    });
    budgets.forEach((b) => {
      if (b.category.toLowerCase().includes(q) || b.notes.toLowerCase().includes(q)) {
        res.push({ type: "budget", id: b.id, title: b.category, subtitle: `Budgeted: PKR ${b.budgeted.toLocaleString()} · Actual: PKR ${b.actual.toLocaleString()}`, tab: "budgets" });
      }
    });
    todos.forEach((t) => {
      if (t.task.toLowerCase().includes(q)) {
        res.push({ type: "todo", id: t.id, title: t.task, subtitle: `${t.priority} · ${t.done ? "Done" : "Pending"} · ${t.dueDate}`, tab: "todos" });
      }
    });
    notes.forEach((n) => {
      if (n.text.toLowerCase().includes(q)) {
        res.push({ type: "note", id: n.id, title: n.text.slice(0, 60) + (n.text.length > 60 ? "..." : ""), subtitle: new Date(n.createdAt).toLocaleDateString(), tab: "notes" });
      }
    });

    return res.slice(0, 20);
  }, [query, expenses, budgets, todos, notes]);

  const iconMap = {
    expense: <Wallet size={14} />,
    budget: <Layout size={14} />,
    todo: <CheckSquare size={14} />,
    note: <StickyNote size={14} />,
  };

  const colorMap = {
    expense: "text-blue-500",
    budget: "text-purple-500",
    todo: "text-amber-500",
    note: "text-emerald-500",
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer ${
          isNeo ? 'border-2 border-black shadow-[2px_2px_0px] font-bold' : isGlass ? 'bg-white/10 border border-white/20 rounded-xl' : `border ${colors.border} rounded-xl`
        } ${isGlass ? '' : colors.inputBg} transition-colors`}
        onClick={() => setOpen(true)}
      >
        <Search size={14} className={textSecCls} />
        {open ? (
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search everything..."
            className={`bg-transparent text-sm ${textCls} outline-none w-40 sm:w-56`}
            autoFocus
          />
        ) : (
          <span className={`text-sm ${textSecCls}`}>Search <kbd className={`ml-1 px-1 py-0.5 text-[10px] ${isNeo ? 'border border-black' : 'rounded border'} ${textSecCls}`}>Ctrl+K</kbd></span>
        )}
        {open && query && (
          <button onClick={() => { setQuery(""); }} className={textSecCls}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {open && query.trim() && (
        <div className={`absolute top-full mt-1 left-0 right-0 w-80 sm:w-96 z-50 max-h-[60vh] overflow-y-auto ${
          isNeo ? 'bg-white border-2 border-black shadow-[4px_4px_0px]' : isGlass ? 'backdrop-blur-2xl bg-black/60 border border-white/20 rounded-xl' : `${colors.surface} border ${colors.border} rounded-xl ${colors.cardShadow}`
        }`}>
          {results.length === 0 ? (
            <div className={`p-4 text-center text-sm ${textSecCls}`}>No results found.</div>
          ) : (
            results.map((r) => (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => { onNavigate(r.tab); setOpen(false); setQuery(""); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:${isGlass ? 'bg-white/10' : isNeo ? 'bg-black/5' : colors.surfaceAlt} transition-colors ${isNeo ? 'border-b border-black/10 last:border-0' : ''}`}
              >
                <span className={colorMap[r.type]}>{iconMap[r.type]}</span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${isGlass ? 'text-white' : 'text-gray-900'} truncate`}>{r.title}</p>
                  <p className={`text-xs ${isGlass ? 'text-white/50' : 'text-gray-500'} truncate`}>{r.subtitle}</p>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 ${isNeo ? 'border border-black font-bold uppercase' : 'rounded'} ${
                  isGlass ? 'bg-white/10 text-white/60' : 'bg-gray-100 text-gray-500'
                }`}>{r.tab}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
