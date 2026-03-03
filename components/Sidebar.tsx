"use client";

import React, { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Wallet,
  Layout,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  StickyNote,
  CheckSquare,
  Menu,
  X,
  LucideIcon,
  Tag,
  LogOut,
  Grid3X3,
  CalendarClock,
} from "lucide-react";

export type TabId = "expenses" | "budgets" | "graphs" | "notes" | "todos" | "categories" | "settings" | "scheduler";

export interface TabItem {
  id: TabId | string;
  label: string;
  icon: LucideIcon | string;
}

export const defaultTabs: TabItem[] = [
  { id: "expenses", label: "Expenses", icon: Wallet },
  { id: "budgets", label: "Budgets", icon: Layout },
  { id: "graphs", label: "Graphs", icon: BarChart3 },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "todos", label: "Todos", icon: CheckSquare },
  { id: "scheduler", label: "Scheduler", icon: CalendarClock },
  { id: "widgets", label: "Widgets", icon: Grid3X3 },
  { id: "categories", label: "Categories", icon: Tag },
  { id: "settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onSignOut: () => void;
  userDisplayName?: string;
  userEmail?: string;
  monthlySalary: number;
  totalIncome: number;
  totalExpense: number;
}

function getIcon(icon: LucideIcon | string, className: string) {
  if (typeof icon === "string") {
    return <span className={className}>{icon}</span>;
  }
  const Icon = icon;
  return <Icon className={className} />;
}

export default function Sidebar({
  tabs,
  activeTab,
  onTabChange,
  onSignOut,
  userDisplayName,
  monthlySalary,
  totalIncome,
  totalExpense,
}: SidebarProps) {
  const { colors } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const safeBalance = monthlySalary + totalIncome - totalExpense;
  const spentPercent = monthlySalary > 0 ? Math.min(100, Math.round((totalExpense / (monthlySalary + totalIncome)) * 100)) : 0;

  const safeTabs = Array.isArray(tabs) ? tabs : defaultTabs;

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`p-4 border-b ${colors.border}`}>
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="min-w-0">
              <h1 className={`text-lg font-bold ${colors.text} truncate`}>MoneyMap</h1>
              {userDisplayName && (
                <p className={`text-xs ${colors.textSecondary} truncate`}>{userDisplayName}</p>
              )}
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`hidden md:flex p-1.5 rounded-lg ${colors.sidebarHover} ${colors.sidebarText} transition-colors flex-shrink-0`}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className={`md:hidden p-1.5 rounded-lg ${colors.sidebarText}`}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Balance Card */}
      {!collapsed && (
        <div className={`mx-3 mt-3 p-3 rounded-xl ${colors.surfaceAlt} ${colors.border} border`}>
          <p className={`text-[10px] uppercase tracking-wider ${colors.textSecondary} font-medium`}>Balance</p>
          <p className={`text-xl font-bold ${safeBalance >= 0 ? colors.income : colors.expense} mt-0.5`}>
            PKR {safeBalance.toLocaleString()}
          </p>
          {monthlySalary > 0 && (
            <div className="mt-2">
              <div className={`flex justify-between text-[10px] ${colors.textSecondary} mb-1`}>
                <span>Spent</span>
                <span>{spentPercent}%</span>
              </div>
              <div className={`h-1.5 rounded-full ${colors.surfaceAlt} overflow-hidden`}>
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    spentPercent > 80 ? "bg-red-500" : spentPercent > 50 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${spentPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 mt-3 space-y-0.5 overflow-y-auto">
        {safeTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                onTabChange(tab.id);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? `${colors.sidebarActive} ${colors.text}`
                  : `${colors.sidebarText} ${colors.sidebarHover}`
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? tab.label : undefined}
            >
              {getIcon(tab.icon, `w-[18px] h-[18px] flex-shrink-0 ${isActive ? colors.text : ""}`)}
              {!collapsed && <span className="truncate">{tab.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer summary */}
      {!collapsed && (
        <div className={`p-3 mx-3 mb-2 rounded-xl border ${colors.border} ${colors.surface} space-y-1`}>
          <div className="flex justify-between text-xs">
            <span className={colors.textSecondary}>Income</span>
            <span className={`font-medium ${colors.income}`}>PKR {totalIncome.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className={colors.textSecondary}>Expenses</span>
            <span className={`font-medium ${colors.expense}`}>PKR {totalExpense.toLocaleString()}</span>
          </div>
          {monthlySalary > 0 && (
            <div className="flex justify-between text-xs">
              <span className={colors.textSecondary}>Salary</span>
              <span className={`font-medium ${colors.text}`}>PKR {monthlySalary.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Sign Out */}
      <div className={`px-2 pb-3`}>
        <button
          onClick={onSignOut}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors ${collapsed ? "justify-center" : ""}`}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className={`md:hidden fixed top-3 left-3 z-50 p-2 rounded-xl ${colors.surface} ${colors.border} border ${colors.shadow}`}
        aria-label="Open menu"
      >
        <Menu size={20} className={colors.text} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className={`relative w-64 h-full ${colors.sidebarBg} ${colors.shadow} z-50 animate-slide-in-left`}>
            {navContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col ${colors.sidebarBg} border-r ${colors.border} transition-all duration-300 h-screen sticky top-0 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {navContent}
      </aside>
    </>
  );
}
