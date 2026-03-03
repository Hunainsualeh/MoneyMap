"use client";

import React, { useMemo } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { ExpenseRow, BudgetRow } from "@/lib/firestore";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Calendar, DollarSign } from "lucide-react";

interface GraphsTabProps {
  expenses: ExpenseRow[];
  budgets: BudgetRow[];
  monthlySalary: number;
}

function BarViz({ label, value, max, color, percent }: { label: string; value: number; max: number; color: string; percent: number }) {
  const { colors } = useTheme();
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className={colors.textSecondary}>{label}</span>
        <span className={`${colors.text} font-medium`}>{percent.toFixed(1)}%</span>
      </div>
      <div className={`h-3 rounded-full ${colors.surfaceAlt} overflow-hidden`}>
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <p className={`text-xs ${colors.textSecondary}`}>PKR {value.toLocaleString()}</p>
    </div>
  );
}

export default function GraphsTab({ expenses, budgets, monthlySalary }: GraphsTabProps) {
  const { colors } = useTheme();

  const stats = useMemo(() => {
    const totalIncome = expenses.filter(e => e.type === "Income").reduce((s, e) => s + e.amount, 0);
    const totalExpense = expenses.filter(e => e.type === "Expense").reduce((s, e) => s + e.amount, 0);
    const totalBudgeted = budgets.reduce((s, b) => s + b.budgeted, 0);
    const totalActual = budgets.reduce((s, b) => s + b.actual, 0);

    const totalAvailable = monthlySalary + totalIncome;
    const remaining = totalAvailable - totalExpense;
    const spentPercent = totalAvailable > 0 ? (totalExpense / totalAvailable) * 100 : 0;
    const savedPercent = totalAvailable > 0 ? (remaining / totalAvailable) * 100 : 0;

    // Category breakdown
    const byCat: Record<string, number> = {};
    expenses.filter(e => e.type === "Expense").forEach(e => {
      byCat[e.category] = (byCat[e.category] || 0) + e.amount;
    });
    const categories = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    const maxCat = categories.length > 0 ? categories[0][1] : 1;

    // Monthly breakdown
    const byMonth: Record<string, { income: number; expense: number }> = {};
    expenses.forEach(e => {
      const m = e.month || e.date?.slice(0, 7) || "Unknown";
      if (!byMonth[m]) byMonth[m] = { income: 0, expense: 0 };
      if (e.type === "Income") byMonth[m].income += e.amount;
      else byMonth[m].expense += e.amount;
    });
    const months = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0]));

    // Daily (last 7 days)
    const today = new Date();
    const dailyExpenses: { label: string; amount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString("en", { weekday: "short" });
      const dayTotal = expenses.filter(e => e.type === "Expense" && e.date === ds).reduce((s, e) => s + e.amount, 0);
      dailyExpenses.push({ label: dayLabel, amount: dayTotal });
    }
    const maxDaily = Math.max(...dailyExpenses.map(d => d.amount), 1);

    // Weekly
    const weekTotal = dailyExpenses.reduce((s, d) => s + d.amount, 0);

    return {
      totalIncome, totalExpense, totalBudgeted, totalActual,
      totalAvailable, remaining, spentPercent, savedPercent,
      categories, maxCat, months, dailyExpenses, maxDaily, weekTotal,
    };
  }, [expenses, budgets, monthlySalary]);

  const catColors = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-pink-500", "bg-teal-500", "bg-orange-500", "bg-red-500"];

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Income", value: stats.totalIncome, icon: TrendingUp, color: colors.income, sub: `+ Salary: PKR ${monthlySalary.toLocaleString()}` },
          { label: "Total Expenses", value: stats.totalExpense, icon: TrendingDown, color: colors.expense, sub: `${stats.spentPercent.toFixed(1)}% of available` },
          { label: "Remaining", value: stats.remaining, icon: Wallet, color: stats.remaining >= 0 ? colors.income : colors.expense, sub: `${stats.savedPercent.toFixed(1)}% saved` },
          { label: "This Week", value: stats.weekTotal, icon: Calendar, color: colors.expense, sub: `Daily avg: PKR ${Math.round(stats.weekTotal / 7).toLocaleString()}` },
        ].map((card, i) => (
          <div key={i} className={`${colors.surface} border ${colors.border} rounded-xl p-4 ${colors.cardShadow}`}>
            <div className="flex items-center gap-2 mb-2">
              <card.icon size={16} className={card.color} />
              <span className={`text-xs font-medium ${colors.textSecondary}`}>{card.label}</span>
            </div>
            <p className={`text-xl font-bold ${card.color}`}>PKR {card.value.toLocaleString()}</p>
            <p className={`text-[10px] mt-1 ${colors.textSecondary}`}>{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Spending (last 7 days) */}
        <div className={`${colors.surface} border ${colors.border} rounded-xl p-4 ${colors.cardShadow}`}>
          <h3 className={`text-sm font-bold ${colors.text} mb-3 flex items-center gap-2`}>
            <Calendar size={14} /> Last 7 Days
          </h3>
          <div className="flex items-end gap-2 h-32">
            {stats.dailyExpenses.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className={`text-[9px] ${colors.textSecondary}`}>
                  {d.amount > 0 ? `${Math.round(d.amount / 1000)}k` : ""}
                </span>
                <div className={`w-full rounded-t-md ${d.amount > 0 ? "bg-blue-500" : colors.surfaceAlt} transition-all duration-500`}
                  style={{ height: `${(d.amount / stats.maxDaily) * 100}%`, minHeight: d.amount > 0 ? 4 : 2 }}
                />
                <span className={`text-[9px] ${colors.textSecondary}`}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Cash Flow */}
        <div className={`${colors.surface} border ${colors.border} rounded-xl p-4 ${colors.cardShadow}`}>
          <h3 className={`text-sm font-bold ${colors.text} mb-3 flex items-center gap-2`}>
            <DollarSign size={14} /> Monthly Cash Flow
          </h3>
          {stats.months.length === 0 ? (
            <p className={`text-xs ${colors.textSecondary} text-center py-8`}>No data yet</p>
          ) : (
            <div className="space-y-3">
              {stats.months.slice(-4).map(([month, { income, expense }]) => {
                const max = Math.max(income, expense, 1);
                return (
                  <div key={month} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={colors.textSecondary}>{month}</span>
                      <span className={`font-medium ${income - expense >= 0 ? colors.income : colors.expense}`}>
                        {income - expense >= 0 ? <ArrowUpRight size={10} className="inline" /> : <ArrowDownRight size={10} className="inline" />}
                        {" PKR "}{Math.abs(income - expense).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <div className="flex-1 h-2 rounded-full bg-emerald-500/20 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(income / max) * 100}%` }} />
                      </div>
                      <div className="flex-1 h-2 rounded-full bg-red-500/20 overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${(expense / max) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className={`${colors.surface} border ${colors.border} rounded-xl p-4 ${colors.cardShadow}`}>
        <h3 className={`text-sm font-bold ${colors.text} mb-3`}>Category Breakdown</h3>
        {stats.categories.length === 0 ? (
          <p className={`text-xs ${colors.textSecondary} text-center py-6`}>No expense data</p>
        ) : (
          <div className="space-y-3">
            {stats.categories.map(([cat, amount], i) => (
              <BarViz
                key={cat}
                label={cat}
                value={amount}
                max={stats.maxCat}
                color={catColors[i % catColors.length]}
                percent={stats.totalExpense > 0 ? (amount / stats.totalExpense) * 100 : 0}
              />
            ))}
          </div>
        )}
      </div>

      {/* Budget vs Actual */}
      {budgets.length > 0 && (
        <div className={`${colors.surface} border ${colors.border} rounded-xl p-4 ${colors.cardShadow}`}>
          <h3 className={`text-sm font-bold ${colors.text} mb-3`}>Budget vs Actual</h3>
          <div className="space-y-3">
            {budgets.map((b) => {
              const pct = b.budgeted > 0 ? (b.actual / b.budgeted) * 100 : 0;
              const over = pct > 100;
              return (
                <div key={b.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className={colors.textSecondary}>{b.category}</span>
                    <span className={`font-medium ${over ? colors.expense : colors.income}`}>
                      PKR {b.actual.toLocaleString()} / {b.budgeted.toLocaleString()} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className={`h-2.5 rounded-full ${colors.surfaceAlt} overflow-hidden`}>
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${over ? "bg-red-500" : "bg-emerald-500"}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  {over && (
                    <p className={`text-[10px] ${colors.expense}`}>Over budget by PKR {(b.actual - b.budgeted).toLocaleString()}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
