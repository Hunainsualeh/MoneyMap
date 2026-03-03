"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import DraggableWidget from "./DraggableWidget";
import { CheckSquare, Calendar, StickyNote, Grid3X3, Plus, X, Check } from "lucide-react";

interface WidgetTodo { id: string; text: string; done: boolean; }
interface WidgetNote { id: string; text: string; color: string; }
type WidgetType = "todo" | "calendar" | "sticky";

const WIDGET_META: Record<WidgetType, { label: string }> = {
  todo: { label: "Quick Todo" },
  calendar: { label: "Calendar" },
  sticky: { label: "Sticky Notes" },
};

export default function WidgetManager() {
  const { colors } = useTheme();
  const [openWidgets, setOpenWidgets] = useState<WidgetType[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [mounted, setMounted] = useState(false);

  /* Widget data */
  const [widgetTodos, setWidgetTodos] = useState<WidgetTodo[]>([]);
  const [widgetNotes, setWidgetNotes] = useState<WidgetNote[]>([]);
  const [newTodoText, setNewTodoText] = useState("");
  const [newNoteText, setNewNoteText] = useState("");

  /* Load from localStorage after mount */
  useEffect(() => {
    setMounted(true);
    try {
      const savedW = localStorage.getItem("moneymap_open_widgets");
      if (savedW) setOpenWidgets(JSON.parse(savedW));
      const savedT = localStorage.getItem("moneymap_widget_todos");
      if (savedT) setWidgetTodos(JSON.parse(savedT));
      const savedN = localStorage.getItem("moneymap_widget_notes");
      if (savedN) setWidgetNotes(JSON.parse(savedN));
    } catch { /* noop */ }
  }, []);

  /* Save to localStorage */
  useEffect(() => { if (mounted) localStorage.setItem("moneymap_open_widgets", JSON.stringify(openWidgets)); }, [openWidgets, mounted]);
  useEffect(() => { if (mounted) localStorage.setItem("moneymap_widget_todos", JSON.stringify(widgetTodos)); }, [widgetTodos, mounted]);
  useEffect(() => { if (mounted) localStorage.setItem("moneymap_widget_notes", JSON.stringify(widgetNotes)); }, [widgetNotes, mounted]);

  const toggleWidget = (type: WidgetType) => {
    setOpenWidgets(prev => prev.includes(type) ? prev.filter(w => w !== type) : [...prev, type]);
    setShowPicker(false);
  };

  const closeWidget = (type: WidgetType) => setOpenWidgets(prev => prev.filter(w => w !== type));

  /* Todo handlers */
  const addTodo = () => { if (!newTodoText.trim()) return; setWidgetTodos(p => [...p, { id: crypto.randomUUID(), text: newTodoText.trim(), done: false }]); setNewTodoText(""); };
  const toggleTodo = (id: string) => setWidgetTodos(p => p.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTodo = (id: string) => setWidgetTodos(p => p.filter(t => t.id !== id));

  /* Note handlers */
  const addNote = () => {
    if (!newNoteText.trim()) return;
    const noteColors = ["bg-yellow-100", "bg-blue-100", "bg-pink-100", "bg-green-100", "bg-purple-100"];
    setWidgetNotes(p => [...p, { id: crypto.randomUUID(), text: newNoteText.trim(), color: noteColors[p.length % noteColors.length] }]);
    setNewNoteText("");
  };
  const deleteNote = (id: string) => setWidgetNotes(p => p.filter(n => n.id !== id));

  /* Calendar */
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthName = now.toLocaleString("default", { month: "long", year: "numeric" });

  if (!mounted) return null;

  return (
    <>
      {/* Widget picker button */}
      <div className="fixed bottom-6 right-6 z-[95]">
        {showPicker && (
          <div className={`absolute bottom-14 right-0 ${colors.surface} border ${colors.border} rounded-xl ${colors.shadow} p-2 min-w-[180px] animate-scale-in`} style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            {(Object.keys(WIDGET_META) as WidgetType[]).map(type => (
              <button
                key={type}
                onClick={() => toggleWidget(type)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  openWidgets.includes(type) ? `${colors.primary} text-white` : `${colors.text} ${colors.sidebarHover}`
                }`}
              >
                {type === "todo" ? <CheckSquare size={14} /> : type === "calendar" ? <Calendar size={14} /> : <StickyNote size={14} />}
                <span className="font-medium">{WIDGET_META[type].label}</span>
                {openWidgets.includes(type) && <Check size={12} className="ml-auto" />}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setShowPicker(!showPicker)}
          className={`w-12 h-12 rounded-full ${colors.primary} text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform`}
          title="Widgets"
        >
          {showPicker ? <X size={20} /> : <Grid3X3 size={20} />}
        </button>
      </div>

      {/* Todo Widget */}
      {openWidgets.includes("todo") && (
        <DraggableWidget
          id="widget-todo"
          title="Quick Todo"
          icon={<CheckSquare size={12} className="text-blue-500" />}
          onClose={() => closeWidget("todo")}
          defaultPosition={{ x: 380, y: 80 }}
          width={260}
        >
          <div className="space-y-2">
            <div className="flex gap-1">
              <input
                type="text"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTodo()}
                placeholder="Add task..."
                className={`flex-1 px-2 py-1.5 text-xs rounded-lg border ${colors.border} ${colors.inputBg} ${colors.text} outline-none`}
              />
              <button onClick={addTodo} className={`px-2 py-1.5 rounded-lg ${colors.accent} text-white`}>
                <Plus size={12} />
              </button>
            </div>
            {widgetTodos.length === 0 ? (
              <p className={`text-[10px] text-center py-4 ${colors.textSecondary}`}>No tasks yet</p>
            ) : (
              <div className="space-y-1 max-h-[220px] overflow-y-auto">
                {widgetTodos.map(todo => (
                  <div key={todo.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${colors.surfaceAlt} group`}>
                    <input type="checkbox" checked={todo.done} onChange={() => toggleTodo(todo.id)} className="w-3.5 h-3.5 rounded accent-emerald-500" />
                    <span className={`flex-1 text-xs ${todo.done ? `line-through ${colors.textSecondary}` : colors.text}`}>{todo.text}</span>
                    <button onClick={() => deleteTodo(todo.id)} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 text-red-400">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DraggableWidget>
      )}

      {/* Calendar Widget */}
      {openWidgets.includes("calendar") && (
        <DraggableWidget
          id="widget-calendar"
          title="Calendar"
          icon={<Calendar size={12} className="text-blue-500" />}
          onClose={() => closeWidget("calendar")}
          defaultPosition={{ x: 400, y: 200 }}
          width={260}
        >
          <div>
            <p className={`text-xs font-bold ${colors.text} text-center mb-2`}>{monthName}</p>
            <div className="grid grid-cols-7 gap-0.5 text-center">
              {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                <div key={d} className={`text-[9px] font-bold ${colors.textSecondary} py-1`}>{d}</div>
              ))}
              {Array.from({ length: firstDay }, (_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const isToday = day === now.getDate();
                return (
                  <div
                    key={day}
                    className={`text-[10px] py-1 rounded ${
                      isToday ? `${colors.primary} text-white font-bold` : `${colors.text} hover:${colors.surfaceAlt}`
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
        </DraggableWidget>
      )}

      {/* Sticky Notes Widget */}
      {openWidgets.includes("sticky") && (
        <DraggableWidget
          id="widget-sticky"
          title="Sticky Notes"
          icon={<StickyNote size={12} className="text-yellow-500" />}
          onClose={() => closeWidget("sticky")}
          defaultPosition={{ x: 420, y: 320 }}
          width={260}
        >
          <div className="space-y-2">
            <div className="flex gap-1">
              <input
                type="text"
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addNote()}
                placeholder="Write a note..."
                className={`flex-1 px-2 py-1.5 text-xs rounded-lg border ${colors.border} ${colors.inputBg} ${colors.text} outline-none`}
              />
              <button onClick={addNote} className={`px-2 py-1.5 rounded-lg ${colors.accent} text-white`}>
                <Plus size={12} />
              </button>
            </div>
            {widgetNotes.length === 0 ? (
              <p className={`text-[10px] text-center py-4 ${colors.textSecondary}`}>No notes yet</p>
            ) : (
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                {widgetNotes.map(note => (
                  <div key={note.id} className={`${note.color} p-2.5 rounded-lg text-xs text-gray-800 relative group`}>
                    <p>{note.text}</p>
                    <button onClick={() => deleteNote(note.id)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 text-gray-500">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DraggableWidget>
      )}
    </>
  );
}
