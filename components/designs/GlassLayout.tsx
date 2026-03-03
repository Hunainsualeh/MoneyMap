"use client";

import React, { useState, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import ConfirmModal from "@/components/ConfirmModal";
import type { DesignLayoutProps } from "./NeobrutalistLayout";
import {
  Download, Upload, LogOut, Cloud, CloudOff, User, ChevronDown,
  Wallet, TrendingUp, TrendingDown,
} from "lucide-react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function GlassLayout({
  tabs,
  activeTab,
  switchTab,
  selectedMonth,
  setSelectedMonth,
  totalIncome,
  totalExpense,
  paidExpense,
  pendingExpense,
  balance,
  monthlySalary,
  synced,
  userName,
  userEmail,
  onSignOut,
  exportTemplate,
  importTemplate,
  tabTransition,
  children,
}: DesignLayoutProps) {
  const { colors } = useTheme();
  const [showProfile, setShowProfile] = useState(false);
  const [signOutConfirm, setSignOutConfirm] = useState(false);
  const [sideOpen, setSideOpen] = useState(true);
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

  const glass = "backdrop-blur-xl bg-white/10 border border-white/20";
  const glassDark = "backdrop-blur-xl bg-black/20 border border-white/10";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative">
      {/* Glass overlay tint */}
      <div className="absolute inset-0 bg-black/10" />

      <div className="relative z-10 flex min-h-screen">
        {/* Glass Sidebar */}
        <aside className={`${sideOpen ? "w-64" : "w-16"} hidden md:flex flex-col ${glassDark} transition-all duration-300 h-screen sticky top-0`}>
          <div className={`p-4 border-b border-white/10`}>
            {sideOpen ? (
              <div>
                <h1 className="text-lg font-bold text-white">MoneyMap</h1>
                <p className="text-xs text-white/60">{userName || "User"}</p>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold mx-auto">
                {userName?.[0]?.toUpperCase() || "M"}
              </div>
            )}
          </div>

          {/* Balance card */}
          {sideOpen && (
            <div className="mx-3 mt-3 p-3 rounded-xl bg-white/10 border border-white/10">
              <p className="text-[10px] uppercase tracking-wider text-white/50">Balance</p>
              <p className={`text-xl font-bold mt-0.5 ${balance >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                PKR {balance.toLocaleString()}
              </p>
              {monthlySalary > 0 && (
                <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${totalExpense / (monthlySalary + totalIncome || 1) > 0.8 ? "bg-red-400" : "bg-emerald-400"}`}
                    style={{ width: `${Math.min(100, Math.round((totalExpense / (monthlySalary + totalIncome || 1)) * 100))}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-2 mt-3 space-y-0.5 overflow-y-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => switchTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "text-white/60 hover:bg-white/10 hover:text-white"
                  } ${sideOpen ? "" : "justify-center"}`}
                  title={sideOpen ? undefined : tab.label}
                >
                  {typeof tab.icon === "string" ? <span>{tab.icon}</span> : (() => { const Icon = tab.icon as React.ComponentType<{className?: string; size?: number}>; return <Icon size={18} className="flex-shrink-0" />; })()}
                  {sideOpen && <span className="truncate">{tab.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          {sideOpen && (
            <div className="p-3 mx-3 mb-2 rounded-xl bg-white/10 border border-white/10 space-y-1">
              <div className="flex justify-between text-xs text-white/70">
                <span>Income</span>
                <span className="text-emerald-300">PKR {totalIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-white/70">
                <span>Expenses</span>
                <span className="text-red-300">PKR {totalExpense.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="px-2 pb-3">
            <button
              onClick={() => setSignOutConfirm(true)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/20 transition-colors ${sideOpen ? "" : "justify-center"}`}
            >
              <LogOut size={18} className="flex-shrink-0" />
              {sideOpen && <span>Sign Out</span>}
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 md:p-6 pt-14 md:pt-6">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h1 className="text-xl font-bold text-white">
              {tabs.find(t => t.id === activeTab)?.label ?? activeTab}
            </h1>
            <div className="flex items-center gap-3">
              {activeTab === "expenses" && (
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm outline-none backdrop-blur-sm"
                >
                  {MONTHS.map(m => <option key={m} value={m} className="text-black">{m}</option>)}
                </select>
              )}
              <span className="flex items-center gap-1.5 text-xs text-white/60">
                {synced ? <Cloud size={14} className="text-emerald-300" /> : <CloudOff size={14} className="text-amber-300" />}
                {synced ? "Synced" : "Saving..."}
              </span>
            </div>
          </div>

          {/* Summary cards in glass */}
          {(activeTab === "expenses" || activeTab === "graphs") && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: "Income", value: totalIncome, icon: TrendingUp, color: "text-emerald-300" },
                { label: "Expenses", value: totalExpense, icon: TrendingDown, color: "text-red-300" },
                { label: "Balance", value: balance, icon: Wallet, color: balance >= 0 ? "text-emerald-300" : "text-red-300" },
                { label: "Salary", value: monthlySalary, icon: Wallet, color: "text-blue-300" },
              ].map((card, i) => (
                <div key={i} className={`${glass} rounded-xl p-3`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <card.icon size={14} className={card.color} />
                    <span className="text-[10px] uppercase tracking-wider text-white/50 font-medium">{card.label}</span>
                  </div>
                  <p className={`text-lg font-bold ${card.color}`}>PKR {card.value.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tab content */}
          <div className={`transition-all duration-200 ${tabTransition ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
            {children}
          </div>
        </main>
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
