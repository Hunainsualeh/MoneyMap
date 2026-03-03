"use client";

import React, { useState, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { TabItem } from "@/components/Sidebar";
import ConfirmModal from "@/components/ConfirmModal";
import type { DesignLayoutProps } from "./NeobrutalistLayout";
import {
  Download, Upload, FileJson, LogOut, Cloud, CloudOff, User, ChevronDown,
} from "lucide-react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function MinimalLayout({
  tabs,
  activeTab,
  switchTab,
  selectedMonth,
  setSelectedMonth,
  totalIncome,
  totalExpense,
  balance,
  monthlySalary,
  synced,
  userName,
  onSignOut,
  exportTemplate,
  importTemplate,
  tabTransition,
  children,
}: DesignLayoutProps) {
  const { colors } = useTheme();
  const [showProfile, setShowProfile] = useState(false);
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

  return (
    <div className={`min-h-screen ${colors.bg}`}>
      {/* Clean top bar */}
      <header className={`${colors.surface} border-b ${colors.border} sticky top-0 z-30`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Top row */}
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <h1 className={`text-lg font-bold ${colors.text} tracking-tight`}>MoneyMap</h1>
              <div className="hidden md:flex items-center gap-4 text-xs">
                <span className={colors.income}>↑ PKR {totalIncome.toLocaleString()}</span>
                <span className={colors.expense}>↓ PKR {totalExpense.toLocaleString()}</span>
                <span className={`font-bold ${balance >= 0 ? colors.income : colors.expense}`}>= PKR {balance.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {activeTab === "expenses" && (
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className={`px-2 py-1 text-xs rounded border ${colors.border} ${colors.inputBg} ${colors.text} outline-none`}
                >
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              )}
              <span className={`text-xs ${colors.textSecondary} flex items-center gap-1`}>
                {synced ? <Cloud size={12} className="text-emerald-500" /> : <CloudOff size={12} className="text-amber-500" />}
              </span>
              <button onClick={exportTemplate} className={`text-xs ${colors.textSecondary} hover:${colors.text}`} title="Export">
                <Download size={14} />
              </button>
              <button onClick={() => fileInputRef.current?.click()} className={`text-xs ${colors.textSecondary} hover:${colors.text}`} title="Import">
                <Upload size={14} />
              </button>
              <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportFile} className="hidden" />

              {/* Profile */}
              <div className="relative">
                <button onClick={() => setShowProfile(!showProfile)} className={`flex items-center gap-1 px-2 py-1 rounded-lg ${colors.sidebarHover} ${colors.text}`}>
                  <div className={`w-6 h-6 rounded-full ${colors.primary} flex items-center justify-center text-white text-[10px] font-bold`}>
                    {userName?.[0]?.toUpperCase() || "?"}
                  </div>
                  <ChevronDown size={12} />
                </button>
                {showProfile && (
                  <div className={`absolute right-0 top-full mt-1 ${colors.surface} border ${colors.border} rounded-lg ${colors.shadow} p-3 min-w-[180px] z-50`}>
                    <p className={`text-sm font-medium ${colors.text} truncate`}>{userName || "User"}</p>
                    <hr className={`my-2 ${colors.border}`} />
                    <button onClick={() => { setShowProfile(false); setSignOutConfirm(true); }}
                      className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 w-full">
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tab row with underline style */}
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? `${colors.text} border-current`
                    : `${colors.textSecondary} border-transparent hover:${colors.text} hover:border-current/30`
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className={`transition-all duration-200 ${tabTransition ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
          {children}
        </div>
      </main>

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
