"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useDesign } from "@/contexts/DesignContext";
import {
  Plus,
  X,
  Trash2,
  CheckSquare,
  Calendar,
  StickyNote,
  Clock,
  Target,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";

/* ─── Widget types & metadata ─── */
export type WidgetType = "quick-todo" | "calendar" | "sticky" | "pomodoro" | "goals";

interface WidgetMeta {
  label: string;
  description: string;
  icon: React.ReactNode;
}

const WIDGET_META: Record<WidgetType, WidgetMeta> = {
  "quick-todo": { label: "Quick Todo", description: "A fast task list for quick notes", icon: <CheckSquare size={16} /> },
  calendar: { label: "Calendar", description: "Mini calendar to see dates at a glance", icon: <Calendar size={16} /> },
  sticky: { label: "Sticky Notes", description: "Colorful sticky notes for reminders", icon: <StickyNote size={16} /> },
  pomodoro: { label: "Pomodoro Timer", description: "Focus timer with work/break intervals", icon: <Clock size={16} /> },
  goals: { label: "Savings Goals", description: "Track progress toward financial goals", icon: <Target size={16} /> },
};

const ALL_WIDGET_TYPES = Object.keys(WIDGET_META) as WidgetType[];

/* ─── Widget data types ─── */
interface WidgetTodo {
  id: string;
  text: string;
  done: boolean;
}
interface WidgetNote {
  id: string;
  text: string;
  color: string;
}
interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  saved: number;
}

/* ─── Placement type ─── */
type WidgetPlacement = "top" | "bottom";

interface WidgetInstance {
  type: WidgetType;
  placement: WidgetPlacement;
  order: number;
}

interface WidgetTabProps {
  userId: string;
}

export default function WidgetTab({ userId }: WidgetTabProps) {
  const { colors } = useTheme();
  const { design } = useDesign();
  const [mounted, setMounted] = useState(false);

  /* Active widgets and placement */
  const [widgets, setWidgets] = useState<WidgetInstance[]>([]);
  const [showAddPanel, setShowAddPanel] = useState(false);

  /* Widget data */
  const [widgetTodos, setWidgetTodos] = useState<WidgetTodo[]>([]);
  const [widgetNotes, setWidgetNotes] = useState<WidgetNote[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [newTodoText, setNewTodoText] = useState("");
  const [newNoteText, setNewNoteText] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<WidgetType | null>(null);

  /* Pomodoro */
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroIsBreak, setPomodoroIsBreak] = useState(false);

  const cacheKeyFn = useCallback((key: string) => `moneymap_widget_${userId}_${key}`, [userId]);

  /* Initialize from localStorage */
  const prevUserId = useRef(userId);
  if (prevUserId.current !== userId) {
    prevUserId.current = userId;
    try {
      const sw = localStorage.getItem(cacheKeyFn("instances"));
      if (sw) setWidgets(JSON.parse(sw)); else setWidgets([]);
      const st = localStorage.getItem(cacheKeyFn("todos"));
      if (st) setWidgetTodos(JSON.parse(st)); else setWidgetTodos([]);
      const sn = localStorage.getItem(cacheKeyFn("notes"));
      if (sn) setWidgetNotes(JSON.parse(sn)); else setWidgetNotes([]);
      const sg = localStorage.getItem(cacheKeyFn("goals"));
      if (sg) setGoals(JSON.parse(sg)); else setGoals([]);
    } catch { /* noop */ }
  }

  /* Load data on first mount */
  useEffect(() => {
    try {
      const sw = localStorage.getItem(cacheKeyFn("instances"));
      if (sw) setWidgets(JSON.parse(sw));
      const st = localStorage.getItem(cacheKeyFn("todos"));
      if (st) setWidgetTodos(JSON.parse(st));
      const sn = localStorage.getItem(cacheKeyFn("notes"));
      if (sn) setWidgetNotes(JSON.parse(sn));
      const sg = localStorage.getItem(cacheKeyFn("goals"));
      if (sg) setGoals(JSON.parse(sg));
    } catch { /* noop */ }
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Save data */
  const save = useCallback((key: string, data: unknown) => {
    if (mounted) {
      try { localStorage.setItem(cacheKeyFn(key), JSON.stringify(data)); } catch { /* noop */ }
    }
  }, [mounted, cacheKeyFn]);

  useEffect(() => { save("instances", widgets); }, [widgets, save]);
  useEffect(() => { save("todos", widgetTodos); }, [widgetTodos, save]);
  useEffect(() => { save("notes", widgetNotes); }, [widgetNotes, save]);
  useEffect(() => { save("goals", goals); }, [goals, save]);

  /* Pomodoro timer */
  useEffect(() => {
    if (!pomodoroRunning) return;
    const interval = setInterval(() => {
      setPomodoroTime(prev => {
        if (prev <= 1) {
          setPomodoroRunning(false);
          setPomodoroIsBreak(b => !b);
          return pomodoroIsBreak ? 25 * 60 : 5 * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pomodoroRunning, pomodoroIsBreak]);

  /* Helpers */
  const addWidget = (type: WidgetType) => {
    if (widgets.find(w => w.type === type)) return;
    setWidgets(prev => [...prev, { type, placement: "top", order: prev.length }]);
    setShowAddPanel(false);
  };

  const removeWidget = (type: WidgetType) => {
    setWidgets(prev => prev.filter(w => w.type !== type));
    setDeleteConfirm(null);
  };

  const changePlacement = (type: WidgetType, placement: WidgetPlacement) => {
    setWidgets(prev => prev.map(w => w.type === type ? { ...w, placement } : w));
  };

  const moveWidget = (type: WidgetType, direction: "up" | "down") => {
    setWidgets(prev => {
      const idx = prev.findIndex(w => w.type === type);
      if (idx < 0) return prev;
      const newIdx = direction === "up" ? Math.max(0, idx - 1) : Math.min(prev.length - 1, idx + 1);
      if (idx === newIdx) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(idx, 1);
      copy.splice(newIdx, 0, moved);
      return copy;
    });
  };

  /* Todo handlers */
  const addTodo = () => {
    if (!newTodoText.trim()) return;
    setWidgetTodos(p => [...p, { id: crypto.randomUUID(), text: newTodoText.trim(), done: false }]);
    setNewTodoText("");
  };
  const toggleTodo = (id: string) => setWidgetTodos(p => p.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTodo = (id: string) => setWidgetTodos(p => p.filter(t => t.id !== id));

  /* Note handlers */
  const noteColors = ["bg-yellow-100", "bg-blue-100", "bg-pink-100", "bg-green-100", "bg-purple-100"];
  const addNote = () => {
    if (!newNoteText.trim()) return;
    setWidgetNotes(p => [...p, { id: crypto.randomUUID(), text: newNoteText.trim(), color: noteColors[p.length % noteColors.length] }]);
    setNewNoteText("");
  };
  const deleteNote = (id: string) => setWidgetNotes(p => p.filter(n => n.id !== id));

  /* Goals handlers */
  const addGoal = () => {
    setGoals(p => [...p, { id: crypto.randomUUID(), name: "New Goal", target: 10000, saved: 0 }]);
  };
  const editGoal = (id: string, field: keyof SavingsGoal, value: string | number) => {
    setGoals(p => p.map(g => g.id === id ? { ...g, [field]: value } : g));
  };
  const deleteGoal = (id: string) => setGoals(p => p.filter(g => g.id !== id));

  /* Calendar */
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthName = now.toLocaleString("default", { month: "long", year: "numeric" });

  const availableToAdd = ALL_WIDGET_TYPES.filter(t => !widgets.find(w => w.type === t));

  /* ─── Design-aware card class ─── */
  const cardClass = design === "neobrutalist"
    ? `${colors.surface} border-2 ${colors.border} shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)]`
    : design === "glass"
    ? `backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl`
    : `${colors.surface} border ${colors.border} rounded-xl ${colors.cardShadow}`;

  const textClass = design === "glass" ? "text-white" : colors.text;
  const textSecClass = design === "glass" ? "text-white/60" : colors.textSecondary;

  if (!mounted) return null;

  /* ─── Render a single widget ─── */
  const renderWidget = (w: WidgetInstance) => {
    const meta = WIDGET_META[w.type];
    return (
      <div key={w.type} className={`${cardClass} p-4`}>
        {/* Widget header with placement controls */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={textClass}>{meta.icon}</span>
            <h3 className={`text-sm font-bold ${textClass}`}>{meta.label}</h3>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => moveWidget(w.type, "up")} className={`p-1 rounded ${colors.sidebarHover} ${textSecClass}`} title="Move up">
              <ChevronUp size={12} />
            </button>
            <button onClick={() => moveWidget(w.type, "down")} className={`p-1 rounded ${colors.sidebarHover} ${textSecClass}`} title="Move down">
              <ChevronDown size={12} />
            </button>
            <select
              value={w.placement}
              onChange={(e) => changePlacement(w.type, e.target.value as WidgetPlacement)}
              className={`text-xs px-2 py-1 rounded-lg border ${colors.border} ${colors.inputBg} ${textClass} outline-none`}
            >
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
            </select>
            <button onClick={() => setDeleteConfirm(w.type)} className="p-1 rounded hover:bg-red-100 text-red-500" title="Remove widget">
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Widget body */}
        {w.type === "quick-todo" && (
          <div className="space-y-2">
            <div className="flex gap-1">
              <input
                type="text"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTodo()}
                placeholder="Add task..."
                className={`flex-1 px-3 py-2 text-sm rounded-lg border ${colors.border} ${colors.inputBg} ${textClass} outline-none`}
              />
              <button onClick={addTodo} className={`px-3 py-2 rounded-lg ${colors.accent} text-white text-sm font-medium`}>
                <Plus size={14} />
              </button>
            </div>
            {widgetTodos.length === 0 ? (
              <p className={`text-sm text-center py-6 ${textSecClass}`}>No tasks yet. Add one above.</p>
            ) : (
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {widgetTodos.map(todo => (
                  <div key={todo.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${colors.surfaceAlt} group`}>
                    <input type="checkbox" checked={todo.done} onChange={() => toggleTodo(todo.id)} className="w-4 h-4 rounded accent-emerald-500" />
                    <span className={`flex-1 text-sm ${todo.done ? `line-through ${textSecClass}` : textClass}`}>{todo.text}</span>
                    <button onClick={() => deleteTodo(todo.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 text-red-400">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {w.type === "calendar" && (
          <div>
            <p className={`text-sm font-bold ${textClass} text-center mb-3`}>{monthName}</p>
            <div className="grid grid-cols-7 gap-1 text-center">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                <div key={d} className={`text-[10px] font-bold ${textSecClass} py-1`}>{d}</div>
              ))}
              {Array.from({ length: firstDay }, (_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const isToday = day === now.getDate();
                return (
                  <div
                    key={day}
                    className={`text-xs py-1.5 rounded-lg transition-colors ${
                      isToday ? `${colors.primary} text-white font-bold` : `${textClass} hover:${colors.surfaceAlt}`
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {w.type === "sticky" && (
          <div className="space-y-2">
            <div className="flex gap-1">
              <input
                type="text"
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addNote()}
                placeholder="Write a note..."
                className={`flex-1 px-3 py-2 text-sm rounded-lg border ${colors.border} ${colors.inputBg} ${textClass} outline-none`}
              />
              <button onClick={addNote} className={`px-3 py-2 rounded-lg ${colors.accent} text-white text-sm font-medium`}>
                <Plus size={14} />
              </button>
            </div>
            {widgetNotes.length === 0 ? (
              <p className={`text-sm text-center py-6 ${textSecClass}`}>No notes yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
                {widgetNotes.map(note => (
                  <div key={note.id} className={`${note.color} p-3 rounded-lg text-sm text-gray-800 relative group min-h-[60px]`}>
                    <p>{note.text}</p>
                    <button onClick={() => deleteNote(note.id)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 text-gray-500">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {w.type === "pomodoro" && (
          <div className="text-center space-y-3">
            <p className={`text-xs font-medium ${textSecClass} uppercase tracking-wider`}>
              {pomodoroIsBreak ? "Break Time" : "Focus Time"}
            </p>
            <p className={`text-4xl font-black ${textClass} tabular-nums`}>
              {String(Math.floor(pomodoroTime / 60)).padStart(2, "0")}:{String(pomodoroTime % 60).padStart(2, "0")}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setPomodoroRunning(!pomodoroRunning)}
                className={`px-4 py-2 rounded-lg ${pomodoroRunning ? "bg-red-500" : colors.primary} text-white text-sm font-medium`}
              >
                {pomodoroRunning ? "Pause" : "Start"}
              </button>
              <button
                onClick={() => { setPomodoroRunning(false); setPomodoroTime(25 * 60); setPomodoroIsBreak(false); }}
                className={`px-4 py-2 rounded-lg border ${colors.border} ${textClass} text-sm font-medium`}
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {w.type === "goals" && (
          <div className="space-y-3">
            {goals.length === 0 ? (
              <p className={`text-sm text-center py-6 ${textSecClass}`}>No goals yet.</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {goals.map(goal => (
                  <div key={goal.id} className={`p-3 rounded-lg ${colors.surfaceAlt} space-y-2`}>
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={goal.name}
                        onChange={(e) => editGoal(goal.id, "name", e.target.value)}
                        className={`flex-1 text-sm font-medium bg-transparent ${textClass} outline-none`}
                      />
                      <button onClick={() => deleteGoal(goal.id)} className="p-1 rounded hover:bg-red-100 text-red-400">
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <div>
                        <span className={textSecClass}>Saved: </span>
                        <input
                          type="number"
                          value={goal.saved}
                          onChange={(e) => editGoal(goal.id, "saved", parseFloat(e.target.value) || 0)}
                          className={`w-20 bg-transparent ${textClass} outline-none border-b ${colors.border}`}
                        />
                      </div>
                      <div>
                        <span className={textSecClass}>Target: </span>
                        <input
                          type="number"
                          value={goal.target}
                          onChange={(e) => editGoal(goal.id, "target", parseFloat(e.target.value) || 0)}
                          className={`w-20 bg-transparent ${textClass} outline-none border-b ${colors.border}`}
                        />
                      </div>
                    </div>
                    <div className={`h-2 rounded-full ${colors.surfaceAlt} overflow-hidden border ${colors.border}`}>
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${Math.min(100, (goal.saved / (goal.target || 1)) * 100)}%` }}
                      />
                    </div>
                    <p className={`text-[10px] ${textSecClass}`}>
                      {Math.round((goal.saved / (goal.target || 1)) * 100)}% complete — PKR {(goal.target - goal.saved).toLocaleString()} remaining
                    </p>
                  </div>
                ))}
              </div>
            )}
            <button onClick={addGoal} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg ${colors.accent} text-white text-sm font-medium w-full justify-center`}>
              <Plus size={14} /> Add Goal
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-fade-up w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-lg font-bold ${textClass}`}>Widgets</h2>
          <p className={`text-sm ${textSecClass}`}>Add and arrange widgets. Choose placement (top/bottom) and reorder them.</p>
        </div>
        <button
          onClick={() => setShowAddPanel(!showAddPanel)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl ${colors.primary} text-white text-sm font-medium hover:opacity-90 transition-opacity`}
        >
          {showAddPanel ? <X size={14} /> : <Plus size={14} />}
          {showAddPanel ? "Close" : "Add Widget"}
        </button>
      </div>

      {/* Add Widget Panel */}
      {showAddPanel && (
        <div className={`${cardClass} p-4`}>
          <h3 className={`text-sm font-bold ${textClass} mb-3`}>Available Widgets</h3>
          {availableToAdd.length === 0 ? (
            <p className={`text-sm ${textSecClass} text-center py-4`}>All widgets have been added!</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableToAdd.map(type => {
                const meta = WIDGET_META[type];
                return (
                  <button
                    key={type}
                    onClick={() => addWidget(type)}
                    className={`text-left p-4 rounded-xl border-2 ${colors.border} ${colors.surface} hover:border-blue-400 transition-all`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={textClass}>{meta.icon}</span>
                      <span className={`font-bold text-sm ${textClass}`}>{meta.label}</span>
                    </div>
                    <p className={`text-xs ${textSecClass}`}>{meta.description}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Active widgets */}
      {widgets.length === 0 ? (
        <div className={`${cardClass} p-12 text-center`}>
          <p className={`text-sm ${textSecClass} mb-2`}>No widgets added yet.</p>
          <p className={`text-xs ${textSecClass}`}>Click &quot;Add Widget&quot; above to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {widgets.map(w => renderWidget(w))}
        </div>
      )}

      <ConfirmModal
        open={deleteConfirm !== null}
        title="Remove Widget"
        message={`Remove the "${deleteConfirm ? WIDGET_META[deleteConfirm].label : ""}" widget? Widget data will be preserved.`}
        confirmLabel="Remove"
        danger
        onConfirm={() => deleteConfirm && removeWidget(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
