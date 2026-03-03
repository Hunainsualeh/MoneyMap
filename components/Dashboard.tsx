"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  loadUserData,
  saveUserData,
  UserData,
  ExpenseRow,
  BudgetRow,
  TodoRow,
  NoteItem,
  NoteFolder,
  ScheduledReminder,
} from "@/lib/firestore";
import { useDesign } from "@/contexts/DesignContext";
import AuthScreen from "@/components/AuthScreen";
import Sidebar, { TabItem, defaultTabs } from "@/components/Sidebar";
import Sheet, { ColumnDef } from "@/components/Sheet";
import GraphsTab from "@/components/GraphsTab";
import SettingsPanel from "@/components/SettingsPanel";
import CategoriesManager from "@/components/CategoriesManager";
import ConfirmModal from "@/components/ConfirmModal";
import WidgetManager from "@/components/widgets/WidgetManager";
import WidgetTab from "@/components/widgets/WidgetTab";
import NotesTab from "@/components/NotesTab";
import SearchBar from "@/components/SearchBar";
import SchedulerTab from "@/components/SchedulerTab";
import NeobrutalistLayout from "@/components/designs/NeobrutalistLayout";
import MinimalLayout from "@/components/designs/MinimalLayout";
import GlassLayout from "@/components/designs/GlassLayout";
import {
  StickyNote,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Wallet,
  CloudOff,
  Cloud,
} from "lucide-react";

/* ─── Default categories ─── */
const DEFAULT_CATEGORIES = ["Food", "Transport", "Rent", "Utilities", "Shopping", "Health", "Education", "Entertainment", "Family", "Appliance", "Festival", "Misc", "Other"];

/* ─── Cache helpers (per-user) ─── */
function getCacheKey(uid: string) { return `moneymap_cache_${uid}`; }
function loadCache(uid: string): Partial<UserData> | null {
  try { const raw = localStorage.getItem(getCacheKey(uid)); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function writeCache(uid: string, data: UserData) {
  try { localStorage.setItem(getCacheKey(uid), JSON.stringify(data)); } catch { /* noop */ }
}

/* ─── Month list ─── */
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getCurrentMonth() {
  return MONTHS[new Date().getMonth()];
}

/* ─── Dashboard Component ─── */
export default function Dashboard() {
  const { user, loading, signIn, signUp, signInWithGoogle, signOut } = useAuth();
  const { colors } = useTheme();
  const { design } = useDesign();

  /* Data State */
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [budgets, setBudgets] = useState<BudgetRow[]>([]);
  const [todos, setTodos] = useState<TodoRow[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [noteFolders, setNoteFolders] = useState<NoteFolder[]>([]);
  const [scheduledReminders, setScheduledReminders] = useState<ScheduledReminder[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [initialBalance, setInitialBalance] = useState(0);
  const [monthlySalary, setMonthlySalary] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [synced, setSynced] = useState(true);

  /* UI State */
  const [activeTab, setActiveTab] = useState("expenses");
  const [tabs, setTabs] = useState<TabItem[]>(defaultTabs);
  const [tabTransition, setTabTransition] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [signOutConfirm, setSignOutConfirm] = useState(false);

  /* Debounced save */
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef({ expenses, budgets, todos, notes, noteFolders, scheduledReminders, categories, initialBalance, monthlySalary });

  useEffect(() => {
    dataRef.current = { expenses, budgets, todos, notes, noteFolders, scheduledReminders, categories, initialBalance, monthlySalary };
  }, [expenses, budgets, todos, notes, noteFolders, scheduledReminders, categories, initialBalance, monthlySalary]);

  const debouncedSave = useCallback(() => {
    if (!user) return;
    setSynced(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const d = dataRef.current;
      const payload: UserData = {
        expenses: d.expenses,
        budgets: d.budgets,
        todos: d.todos,
        notes: d.notes,
        noteFolders: d.noteFolders,
        scheduledReminders: d.scheduledReminders,
        categories: d.categories,
        initialBalance: d.initialBalance,
        monthlySalary: d.monthlySalary,
      };
      writeCache(user!.uid, payload);
      await saveUserData(user!.uid, payload);
      setSynced(true);
    }, 1200);
  }, [user]);

  /* Reset state when user changes (account isolation) */
  useEffect(() => {
    // Clear all data state whenever user changes
    setExpenses([]);
    setBudgets([]);
    setTodos([]);
    setNotes([]);
    setNoteFolders([]);
    setScheduledReminders([]);
    setCategories(DEFAULT_CATEGORIES);
    setInitialBalance(0);
    setMonthlySalary(0);
    setDataLoaded(false);
    setTabs(defaultTabs);
    setActiveTab("expenses");
  }, [user?.uid]);

  /* Load data */
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      const cached = loadCache(user!.uid);
      if (cached && !cancelled) {
        if (cached.expenses) setExpenses(cached.expenses);
        if (cached.budgets) setBudgets(cached.budgets);
        if (cached.todos) setTodos(cached.todos);
        if (cached.notes) setNotes(cached.notes);
        if (cached.noteFolders) setNoteFolders(cached.noteFolders);
        if (cached.scheduledReminders) setScheduledReminders(cached.scheduledReminders);
        if (cached.categories?.length) setCategories(cached.categories);
        if (cached.initialBalance !== undefined) setInitialBalance(cached.initialBalance);
        if (cached.monthlySalary !== undefined) setMonthlySalary(cached.monthlySalary);
      }
      const data = await loadUserData(user!.uid);
      if (data && !cancelled) {
        setExpenses(data.expenses || []);
        setBudgets(data.budgets || []);
        setTodos(data.todos || []);
        setNotes(data.notes || []);
        setNoteFolders(data.noteFolders || []);
        setScheduledReminders(data.scheduledReminders || []);
        if (data.categories?.length) setCategories(data.categories);
        setInitialBalance(data.initialBalance || 0);
        setMonthlySalary(data.monthlySalary || 0);
        writeCache(user!.uid, data);
      }
      if (!cancelled) setDataLoaded(true);
    }
    load();
    return () => { cancelled = true; };
  }, [user?.uid]);

  /* ─── Dynamic auto-computed totals ─── */
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const m = e.month || "";
      // Month field could be "2026-03" or "March"
      if (MONTHS.includes(m)) return m === selectedMonth;
      // Support YYYY-MM format  
      const mIdx = MONTHS.indexOf(selectedMonth);
      if (m.includes("-")) {
        const monthNum = parseInt(m.split("-")[1], 10);
        return monthNum === mIdx + 1;
      }
      return true;
    });
  }, [expenses, selectedMonth]);

  const totalIncome = useMemo(() => filteredExpenses.filter(e => e.type === "Income").reduce((s, e) => s + e.amount, 0), [filteredExpenses]);
  const totalExpense = useMemo(() => filteredExpenses.filter(e => e.type === "Expense").reduce((s, e) => s + e.amount, 0), [filteredExpenses]);
  const paidExpense = useMemo(() => filteredExpenses.filter(e => e.type === "Expense" && e.status === "Paid").reduce((s, e) => s + e.amount, 0), [filteredExpenses]);
  const pendingExpense = useMemo(() => filteredExpenses.filter(e => e.type === "Expense" && e.status === "Pending").reduce((s, e) => s + e.amount, 0), [filteredExpenses]);
  const balance = monthlySalary + totalIncome - totalExpense;

  /* Overall totals (all months) */
  const allTimeIncome = useMemo(() => expenses.filter(e => e.type === "Income").reduce((s, e) => s + e.amount, 0), [expenses]);
  const allTimeExpense = useMemo(() => expenses.filter(e => e.type === "Expense").reduce((s, e) => s + e.amount, 0), [expenses]);

  /* Column definitions — category options are DYNAMIC from categories state */
  const expenseCols: ColumnDef<ExpenseRow>[] = useMemo(() => [
    { key: "id", label: "ID" },
    { key: "month", label: "Month", type: "select" as const, options: MONTHS },
    { key: "date", label: "Date", type: "date" as const },
    { key: "description", label: "Description", type: "text" as const },
    { key: "category", label: "Category", type: "select" as const, options: categories },
    { key: "type", label: "Type", type: "select" as const, options: ["Expense", "Income"] },
    { key: "amount", label: "Amount (PKR)", type: "number" as const },
    { key: "status", label: "Status", type: "toggle" as const, options: ["Pending", "Paid"],
      render: (val: unknown) => {
        const v = String(val);
        return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{v}</span>;
      }
    },
    { key: "note", label: "Note", type: "text" as const },
  ], [categories]);

  const budgetCols: ColumnDef<BudgetRow>[] = useMemo(() => [
    { key: "id", label: "ID" },
    { key: "category", label: "Category", type: "select" as const, options: categories },
    { key: "budgeted", label: "Budgeted", type: "number" as const },
    { key: "actual", label: "Actual", type: "number" as const },
    { key: "notes", label: "Notes", type: "text" as const },
  ], [categories]);

  const todoCols: ColumnDef<TodoRow>[] = [
    { key: "id", label: "ID" },
    { key: "done", label: "Done", type: "checkbox" },
    { key: "task", label: "Task", type: "text" },
    { key: "dueDate", label: "Due Date", type: "date" },
    { key: "priority", label: "Priority", type: "select", options: ["High", "Medium", "Low"] },
  ];

  /* CRUD helpers */
  const addExpense = (item: ExpenseRow) => { setExpenses(p => [...p, item]); debouncedSave(); };
  const editExpense = (item: ExpenseRow) => { setExpenses(p => p.map(e => e.id === item.id ? item : e)); debouncedSave(); };
  const delExpense = (id: string) => { setExpenses(p => p.filter(e => e.id !== id)); debouncedSave(); };

  const addBudget = (item: BudgetRow) => { setBudgets(p => [...p, item]); debouncedSave(); };
  const editBudget = (item: BudgetRow) => { setBudgets(p => p.map(b => b.id === item.id ? item : b)); debouncedSave(); };
  const delBudget = (id: string) => { setBudgets(p => p.filter(b => b.id !== id)); debouncedSave(); };

  const addTodo = (item: TodoRow) => { setTodos(p => [...p, item]); debouncedSave(); };
  const editTodo = (item: TodoRow) => { setTodos(p => p.map(t => t.id === item.id ? item : t)); debouncedSave(); };
  const delTodo = (id: string) => { setTodos(p => p.filter(t => t.id !== id)); debouncedSave(); };

  const addNote = (item: NoteItem) => { setNotes(p => [...p, item]); debouncedSave(); };
  const editNote = (item: NoteItem) => { setNotes(p => p.map(n => n.id === item.id ? item : n)); debouncedSave(); };
  const delNote = (id: string) => { setNotes(p => p.filter(n => n.id !== id)); debouncedSave(); };

  const handleCategoriesChange = (cats: string[]) => { setCategories(cats); debouncedSave(); };
  const handleFoldersChange = (f: NoteFolder[]) => { setNoteFolders(f); debouncedSave(); };
  const handleRemindersChange = (r: ScheduledReminder[]) => { setScheduledReminders(r); debouncedSave(); };

  /* Tab switching with transition */
  const switchTab = (tabId: string) => {
    setTabTransition(true);
    setTimeout(() => { setActiveTab(tabId); setTabTransition(false); }, 150);
  };

  /* Template export/import */
  const exportTemplate = () => {
    const tpl = { _moneymap_template: true, version: 2, expenses, budgets, todos, notes, noteFolders, scheduledReminders, categories, monthlySalary };
    const blob = new Blob([JSON.stringify(tpl, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `moneymap_template_${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const importTemplate = (json: string) => {
    try {
      const parsed = JSON.parse(json);
      if (!parsed._moneymap_template) { alert("Invalid template format"); return; }
      if (parsed.expenses) setExpenses(parsed.expenses);
      if (parsed.budgets) setBudgets(parsed.budgets);
      if (parsed.todos) setTodos(parsed.todos);
      if (parsed.notes) setNotes(parsed.notes);
      if (parsed.noteFolders) setNoteFolders(parsed.noteFolders);
      if (parsed.scheduledReminders) setScheduledReminders(parsed.scheduledReminders);
      if (parsed.categories?.length) setCategories(parsed.categories);
      if (parsed.monthlySalary !== undefined) setMonthlySalary(parsed.monthlySalary);
      debouncedSave();
    } catch { alert("Failed to parse template JSON"); }
  };

  /* Default item factories */
  const defaultExpense = (): ExpenseRow => ({
    id: "", date: new Date().toISOString().slice(0, 10), description: "", category: categories[0] || "Other",
    type: "Expense", amount: 0, status: "Pending", month: getCurrentMonth(), note: "",
  });
  const defaultBudget = (): BudgetRow => ({ id: "", category: categories[0] || "", budgeted: 0, actual: 0, notes: "" });
  const defaultTodoItem = (): TodoRow => ({ id: "", done: false, task: "", dueDate: new Date().toISOString().slice(0, 10), priority: "Medium" });

  /* Handle sign out with confirmation */
  const handleSignOutConfirm = async () => {
    setSignOutConfirm(false);
    await signOut();
  };

  /* Loading / Auth */
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${colors.bg}`}>
        <div className="text-center">
          <div className="mm-spinner mx-auto mb-3" />
          <p className={`text-sm ${colors.textSecondary}`}>Loading...</p>
        </div>
      </div>
    );
  }
  if (!user) return <AuthScreen onSignIn={signIn} onSignUp={signUp} onGoogle={signInWithGoogle} />;

  /* Tab content */
  function renderTabContent() {
    /* Design-aware card class for summary cards */
    const summaryCard = design === "neobrutalist"
      ? `${colors.surface} border-2 ${colors.border} shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] p-3`
      : design === "glass"
      ? `backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-3`
      : `${colors.surface} border ${colors.border} rounded-xl p-3 ${colors.cardShadow}`;
    const scText = design === "glass" ? "text-white" : colors.text;
    const scTextSec = design === "glass" ? "text-white/60" : colors.textSecondary;
    const scIncome = design === "glass" ? "text-emerald-300" : colors.income;
    const scExpense = design === "glass" ? "text-red-300" : colors.expense;

    switch (activeTab) {
      case "expenses":
        return (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className={summaryCard}>
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp size={14} className={scIncome} />
                  <span className={`text-[10px] uppercase tracking-wider ${scTextSec} font-medium`}>Income</span>
                </div>
                <p className={`text-lg font-bold ${scIncome}`}>PKR {totalIncome.toLocaleString()}</p>
              </div>
              <div className={summaryCard}>
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingDown size={14} className={scExpense} />
                  <span className={`text-[10px] uppercase tracking-wider ${scTextSec} font-medium`}>Expenses</span>
                </div>
                <p className={`text-lg font-bold ${scExpense}`}>PKR {totalExpense.toLocaleString()}</p>
                <div className={`text-[10px] ${scTextSec} mt-0.5`}>
                  Paid: PKR {paidExpense.toLocaleString()} &middot; Pending: PKR {pendingExpense.toLocaleString()}
                </div>
              </div>
              <div className={summaryCard}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Wallet size={14} className={balance >= 0 ? scIncome : scExpense} />
                  <span className={`text-[10px] uppercase tracking-wider ${scTextSec} font-medium`}>Balance</span>
                </div>
                <p className={`text-lg font-bold ${balance >= 0 ? scIncome : scExpense}`}>PKR {balance.toLocaleString()}</p>
                {monthlySalary > 0 && (
                  <div className={`text-[10px] ${scTextSec} mt-0.5`}>
                    {Math.round((totalExpense / (monthlySalary + totalIncome || 1)) * 100)}% spent
                  </div>
                )}
              </div>
              <div className={summaryCard}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Wallet size={14} className={scText} />
                  <span className={`text-[10px] uppercase tracking-wider ${scTextSec} font-medium`}>Salary</span>
                </div>
                <p className={`text-lg font-bold ${scText}`}>PKR {monthlySalary.toLocaleString()}</p>
                <div className={`text-[10px] ${scTextSec} mt-0.5`}>
                  Remaining: PKR {(monthlySalary - totalExpense + totalIncome).toLocaleString()}
                </div>
              </div>
            </div>

            <Sheet
              title="Expenses & Earnings"
              columns={expenseCols}
              data={filteredExpenses}
              onAdd={addExpense}
              onEdit={editExpense}
              onDelete={delExpense}
              defaultItem={defaultExpense}
            />
          </div>
        );
      case "budgets":
        return (
          <Sheet
            title="Monthly Budget"
            columns={budgetCols}
            data={budgets}
            onAdd={addBudget}
            onEdit={editBudget}
            onDelete={delBudget}
            defaultItem={defaultBudget}
          />
        );
      case "graphs":
        return <GraphsTab expenses={expenses} budgets={budgets} monthlySalary={monthlySalary} />;
      case "notes":
        return (
          <NotesTab
            notes={notes}
            folders={noteFolders}
            onAddNote={addNote}
            onEditNote={editNote}
            onDeleteNote={delNote}
            onFoldersChange={handleFoldersChange}
          />
        );
      case "todos":
        return (
          <Sheet
            title="To-Do List"
            columns={todoCols}
            data={todos}
            onAdd={addTodo}
            onEdit={editTodo}
            onDelete={delTodo}
            defaultItem={defaultTodoItem}
            currency=""
          />
        );
      case "categories":
        return <CategoriesManager categories={categories} onCategoriesChange={handleCategoriesChange} />;
      case "scheduler":
        return <SchedulerTab reminders={scheduledReminders} onRemindersChange={handleRemindersChange} />;
      case "widgets":
        return user ? <WidgetTab userId={user.uid} /> : null;
      case "settings":
        return (
          <SettingsPanel
            tabs={tabs}
            onTabsChange={setTabs}
            onExportTemplate={exportTemplate}
            onImportTemplate={importTemplate}
            monthlySalary={monthlySalary}
            onSalaryChange={(v) => { setMonthlySalary(v); debouncedSave(); }}
          />
        );
      default:
        return (
          <div className={`text-center py-16 ${colors.textSecondary}`}>
            <StickyNote size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Custom tab: {activeTab}</p>
            <p className="text-xs mt-1">Content coming soon</p>
          </div>
        );
    }
  }

  /* ─── Layout props for alternative designs ─── */
  const layoutProps = {
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
    initialBalance,
    setInitialBalance: (v: number) => { setInitialBalance(v); debouncedSave(); },
    synced,
    userName: user.displayName || "User",
    userEmail: user.email || "",
    onSignOut: () => setSignOutConfirm(true),
    exportTemplate,
    importTemplate,
    tabTransition,
  };

  /* Render content wrapped inside the selected design layout */
  const tabContent = (
    <div className={`transition-all duration-200 ${tabTransition ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
      {renderTabContent()}
    </div>
  );

  if (design === "neobrutalist") {
    return (
      <>
        <NeobrutalistLayout {...layoutProps}>{tabContent}</NeobrutalistLayout>
        <WidgetManager />
        <ConfirmModal
          open={signOutConfirm}
          title="Sign Out"
          message="Are you sure you want to sign out? Any unsaved changes will be lost."
          confirmLabel="Sign Out"
          danger
          onConfirm={handleSignOutConfirm}
          onCancel={() => setSignOutConfirm(false)}
        />
      </>
    );
  }

  if (design === "minimal") {
    return (
      <>
        <MinimalLayout {...layoutProps}>{tabContent}</MinimalLayout>
        <WidgetManager />
        <ConfirmModal
          open={signOutConfirm}
          title="Sign Out"
          message="Are you sure you want to sign out? Any unsaved changes will be lost."
          confirmLabel="Sign Out"
          danger
          onConfirm={handleSignOutConfirm}
          onCancel={() => setSignOutConfirm(false)}
        />
      </>
    );
  }

  if (design === "glass") {
    return (
      <>
        <GlassLayout {...layoutProps}>{tabContent}</GlassLayout>
        <WidgetManager />
        <ConfirmModal
          open={signOutConfirm}
          title="Sign Out"
          message="Are you sure you want to sign out? Any unsaved changes will be lost."
          confirmLabel="Sign Out"
          danger
          onConfirm={handleSignOutConfirm}
          onCancel={() => setSignOutConfirm(false)}
        />
      </>
    );
  }

  /* Modern (default) layout */
  return (
    <div className={`flex min-h-screen ${colors.bg}`}>
      <Sidebar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={switchTab}
        onSignOut={() => setSignOutConfirm(true)}
        userDisplayName={user.displayName || undefined}
        userEmail={user.email || undefined}
        monthlySalary={monthlySalary}
        totalIncome={allTimeIncome}
        totalExpense={allTimeExpense}
      />

      <main className="flex-1 min-w-0 p-4 md:p-6 pt-14 md:pt-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h1 className={`text-xl font-bold ${colors.text}`}>
            {(tabs.find(t => t.id === activeTab)?.label) ?? activeTab}
          </h1>
          <div className="flex items-center gap-3">
            {/* Search */}
            <SearchBar expenses={expenses} budgets={budgets} todos={todos} notes={notes} onNavigate={switchTab} />
            {/* Month filter (for expenses) */}
            {activeTab === "expenses" && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={`px-3 py-1.5 rounded-xl border ${colors.border} ${colors.inputBg} ${colors.text} text-sm outline-none`}
              >
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            )}
            {/* Sync indicator */}
            <div className={`flex items-center gap-1.5 text-xs ${colors.textSecondary}`}>
              {synced ? <Cloud size={14} className="text-emerald-500" /> : <CloudOff size={14} className="text-amber-500" />}
              {synced ? "Synced" : "Saving..."}
            </div>
          </div>
        </div>

        {/* Tab content */}
        {tabContent}
      </main>

      <WidgetManager />

      {/* Sign out confirmation */}
      <ConfirmModal
        open={signOutConfirm}
        title="Sign Out"
        message="Are you sure you want to sign out? Any unsaved changes will be lost."
        confirmLabel="Sign Out"
        danger
        onConfirm={handleSignOutConfirm}
        onCancel={() => setSignOutConfirm(false)}
      />
    </div>
  );
}
