"use client";

import React, { useState, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { TabItem } from "@/components/Sidebar";
import ConfirmModal from "@/components/ConfirmModal";
import {
  Plus, Download, Save, Upload, FileJson, LogOut, Cloud, CloudOff, User,
} from "lucide-react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export interface DesignLayoutProps {
  tabs: TabItem[];
  activeTab: string;
  switchTab: (tab: string) => void;
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  totalIncome: number;
  totalExpense: number;
  paidExpense: number;
  pendingExpense: number;
  balance: number;
  monthlySalary: number;
  initialBalance: number;
  setInitialBalance: (v: number) => void;
  synced: boolean;
  userName: string;
  userEmail: string;
  onSignOut: () => void;
  exportTemplate: () => void;
  importTemplate: (json: string) => void;
  tabTransition: boolean;
  children: React.ReactNode;
}

export default function NeobrutalistLayout({
  tabs,
  activeTab,
  switchTab,
  selectedMonth,
  setSelectedMonth,
  totalIncome,
  totalExpense,
  balance,
  monthlySalary,
  initialBalance,
  setInitialBalance,
  synced,
  userName,
  onSignOut,
  exportTemplate,
  importTemplate,
  tabTransition,
  children,
}: DesignLayoutProps) {
  const { colors } = useTheme();
  const [editingBalance, setEditingBalance] = useState(false);
  const [signOutConfirm, setSignOutConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) importTemplate(text);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Neobrutalist border/shadow: thick borders + sharp offset shadow
  const nbCard = `${colors.surface} border-2 ${colors.border} shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)]`;
  const nbBtn = `font-bold active:translate-y-0.5 active:translate-x-0.5 transition-transform`;

  return (
    <div className={`min-h-screen ${colors.bg} ${colors.text} p-4 md:p-8 font-sans selection:bg-emerald-200`}>
      <div className="w-full space-y-6">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className={`text-4xl font-black tracking-tight ${colors.text} uppercase`}>MoneyMap</h1>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={`${colors.primary} text-white font-bold px-3 py-1 outline-none cursor-pointer border-2 ${colors.border} shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)]`}
              >
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <div className="h-4 w-px bg-current opacity-20 hidden sm:block" />
              <p className={`${colors.textSecondary} font-medium flex items-center gap-2 text-sm`}>
                {synced ? <Cloud size={16} className="text-emerald-500" /> : <CloudOff size={16} className="text-amber-500" />}
                {synced ? "Synced" : "Saving..."}
              </p>
              <div className="h-4 w-px bg-current opacity-20 hidden sm:block" />
              <button onClick={exportTemplate} className={`text-sm font-bold ${colors.textSecondary} hover:opacity-70 flex items-center gap-1 ${nbBtn}`}>
                <FileJson size={16} /> Export
              </button>
              <button onClick={() => fileInputRef.current?.click()} className={`text-sm font-bold ${colors.textSecondary} hover:opacity-70 flex items-center gap-1 ${nbBtn}`}>
                <Upload size={16} /> Import
              </button>
              <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportFile} className="hidden" />
              <div className="h-4 w-px bg-current opacity-20 hidden sm:block" />
              <button onClick={() => setSignOutConfirm(true)} className={`text-sm font-bold text-red-500 hover:text-red-700 flex items-center gap-1 ${nbBtn}`}>
                <LogOut size={16} /> Sign Out
              </button>
              <span className={`hidden md:flex items-center gap-1 text-sm ${colors.textSecondary}`}>
                <User size={14} /> {userName || "User"}
              </span>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="flex gap-3 flex-wrap">
            <div className={`${nbCard} p-3 hidden sm:block`}>
              <div className={`text-xs font-bold ${colors.textSecondary} uppercase`}>Income</div>
              <div className={`text-xl font-black ${colors.income}`}>PKR {totalIncome.toLocaleString()}</div>
            </div>
            <div className={`${nbCard} p-3 hidden sm:block`}>
              <div className={`text-xs font-bold ${colors.textSecondary} uppercase`}>Expenses</div>
              <div className={`text-xl font-black ${colors.expense}`}>PKR {totalExpense.toLocaleString()}</div>
            </div>
            <div className={`${colors.primary} text-white border-2 ${colors.border} p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] relative group min-w-[140px]`}>
              <div className="text-xs font-bold text-white/70 uppercase mb-1">Balance</div>
              {editingBalance ? (
                <input
                  type="number"
                  autoFocus
                  onBlur={() => setEditingBalance(false)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingBalance(false)}
                  onChange={(e) => setInitialBalance(Number(e.target.value))}
                  value={initialBalance}
                  className="w-full text-xl font-black bg-transparent text-white outline-none border-b-2 border-white/50"
                />
              ) : (
                <div
                  onClick={() => setEditingBalance(true)}
                  className={`text-xl font-black cursor-pointer hover:opacity-80 transition-opacity ${balance >= 0 ? "text-emerald-300" : "text-red-300"}`}
                  title="Click to edit initial balance"
                >
                  PKR {balance.toLocaleString()}
                </div>
              )}
              <div className="absolute -top-3 -right-3 bg-amber-400 text-slate-900 text-[10px] font-bold px-2 py-0.5 hidden group-hover:block border-2 border-current shadow-[2px_2px_0px] z-10 pointer-events-none whitespace-nowrap">
                Click to Edit
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex gap-2 overflow-x-auto pb-2 border-b-4 ${colors.border}`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`px-6 py-3 font-bold text-base whitespace-nowrap transition-colors border-2 border-b-0 border-transparent rounded-t-lg ${nbBtn} ${
                activeTab === tab.id
                  ? `${colors.primary} text-white ${colors.border} shadow-[4px_0px_0px_0px_rgba(0,0,0,0.1)]`
                  : `${colors.surfaceAlt} ${colors.textSecondary} hover:${colors.text}`
              }`}
            >
              {typeof tab.icon === "string" ? tab.icon : ""} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={`transition-all duration-200 ${tabTransition ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
          {children}
        </div>
      </div>

      <ConfirmModal
        open={signOutConfirm}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign Out"
        danger
        onConfirm={() => { setSignOutConfirm(false); onSignOut(); }}
        onCancel={() => setSignOutConfirm(false)}
      />
    </div>
  );
}
