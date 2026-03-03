"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useDesign } from "@/contexts/DesignContext";
import ConfirmModal from "@/components/ConfirmModal";
import { ScheduledReminder } from "@/lib/firestore";
import {
  Plus, Trash2, Bell, BellOff, Clock, Calendar, X, Check,
  RefreshCcw, AlertCircle,
} from "lucide-react";

interface SchedulerTabProps {
  reminders: ScheduledReminder[];
  onRemindersChange: (reminders: ScheduledReminder[]) => void;
}

export default function SchedulerTab({ reminders, onRemindersChange }: SchedulerTabProps) {
  const { colors } = useTheme();
  const { design } = useDesign();
  const isNeo = design === "neobrutalist";
  const isGlass = design === "glass";
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newTime, setNewTime] = useState("09:00");
  const [newRecurring, setNewRecurring] = useState<"none" | "daily" | "weekly" | "monthly">("none");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "default";
  });
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const textCls = isGlass ? "text-white" : colors.text;
  const textSecCls = isGlass ? "text-white/60" : colors.textSecondary;
  const cardCls = isNeo
    ? `${colors.surface} border-3 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,0.25)]`
    : isGlass
    ? `backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl`
    : `${colors.surface} border ${colors.border} rounded-xl ${colors.cardShadow}`;
  const btnCls = isNeo
    ? `font-bold border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none`
    : `rounded-xl`;
  const inputCls = `w-full px-3 py-2 text-sm ${isNeo ? 'border-2 border-black' : `rounded-lg border ${colors.border}`} ${isGlass ? 'bg-white/10 text-white' : `${colors.inputBg} ${textCls}`} outline-none`;

  const requestNotifPermission = async () => {
    if ("Notification" in window) {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
    }
  };

  /* Check reminders every minute */
  const checkReminders = useCallback(() => {
    const now = new Date();
    const nowDate = now.toISOString().slice(0, 10);
    const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    let updated = false;
    const newReminders = reminders.map((r) => {
      if (r.notified) return r;
      if (r.date === nowDate && r.time === nowTime) {
        // Fire notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(`MoneyMap Reminder: ${r.title}`, {
            body: r.description || "Time for your scheduled reminder!",
            icon: "/icon-192.png",
          });
        }
        updated = true;

        // Handle recurring
        if (r.recurring !== "none") {
          const d = new Date(r.date);
          if (r.recurring === "daily") d.setDate(d.getDate() + 1);
          else if (r.recurring === "weekly") d.setDate(d.getDate() + 7);
          else if (r.recurring === "monthly") d.setMonth(d.getMonth() + 1);
          return { ...r, date: d.toISOString().slice(0, 10) };
        }
        return { ...r, notified: true };
      }
      return r;
    });

    if (updated) onRemindersChange(newReminders);
  }, [reminders, onRemindersChange]);

  useEffect(() => {
    checkIntervalRef.current = setInterval(checkReminders, 60000);
    checkReminders(); // check immediately
    return () => { if (checkIntervalRef.current) clearInterval(checkIntervalRef.current); };
  }, [checkReminders]);

  const addReminder = () => {
    if (!newTitle.trim()) return;
    const reminder: ScheduledReminder = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      description: newDesc.trim(),
      date: newDate,
      time: newTime,
      recurring: newRecurring,
      notified: false,
      createdAt: new Date().toISOString(),
    };
    onRemindersChange([...reminders, reminder]);
    setNewTitle("");
    setNewDesc("");
    setNewDate(new Date().toISOString().slice(0, 10));
    setNewTime("09:00");
    setNewRecurring("none");
    setShowAdd(false);
  };

  const deleteReminder = (id: string) => {
    onRemindersChange(reminders.filter(r => r.id !== id));
    setDeleteId(null);
  };

  const toggleNotified = (id: string) => {
    onRemindersChange(reminders.map(r => r.id === id ? { ...r, notified: !r.notified } : r));
  };

  /* Sorting: upcoming first, past/notified last */
  const sorted = [...reminders].sort((a, b) => {
    if (a.notified !== b.notified) return a.notified ? 1 : -1;
    const da = new Date(`${a.date}T${a.time}`);
    const db = new Date(`${b.date}T${b.time}`);
    return da.getTime() - db.getTime();
  });

  const upcoming = sorted.filter(r => !r.notified);
  const past = sorted.filter(r => r.notified);

  const recurringLabel = { none: "Once", daily: "Daily", weekly: "Weekly", monthly: "Monthly" };


  const isOverdue = (r: ScheduledReminder) => {
    const dt = new Date(`${r.date}T${r.time}`);
    return !r.notified && dt < new Date();
  };

  return (
    <div className="animate-fade-up space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className={`text-lg font-bold ${textCls}`}>
          Scheduler & Reminders <span className={`text-sm font-normal ${textSecCls}`}>({reminders.length})</span>
        </h2>
        <div className="flex items-center gap-2">
          {notifPermission !== "granted" && (
            <button
              onClick={requestNotifPermission}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm ${btnCls} text-amber-700 bg-amber-100`}
            >
              <AlertCircle size={14} /> Enable Notifications
            </button>
          )}
          <button
            onClick={() => setShowAdd(!showAdd)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm text-white ${colors.primary} ${btnCls} hover:opacity-90`}
          >
            {showAdd ? <X size={14} /> : <Plus size={14} />}
            {showAdd ? "Cancel" : "Add Reminder"}
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className={`${cardCls} p-4 animate-fade-up`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={`block text-xs font-medium ${textSecCls} mb-1`}>Title</label>
              <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Reminder title..." className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={`block text-xs font-medium ${textSecCls} mb-1`}>Description</label>
              <input type="text" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Details (optional)..." className={inputCls} />
            </div>
            <div>
              <label className={`block text-xs font-medium ${textSecCls} mb-1`}>Date</label>
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={`block text-xs font-medium ${textSecCls} mb-1`}>Time</label>
              <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={`block text-xs font-medium ${textSecCls} mb-1`}>Recurring</label>
              <select value={newRecurring} onChange={(e) => setNewRecurring(e.target.value as typeof newRecurring)} className={inputCls}>
                <option value="none">Once</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          <button onClick={addReminder} className={`mt-3 flex items-center gap-1.5 px-4 py-2 text-sm text-white ${colors.accent} ${btnCls}`}>
            <Plus size={14} /> Create Reminder
          </button>
        </div>
      )}

      {/* Upcoming reminders */}
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <h3 className={`text-sm font-bold ${textCls} uppercase tracking-wider`}>Upcoming</h3>
          {upcoming.map((r) => (
            <div key={r.id} className={`${cardCls} p-4 flex items-start gap-3 ${isOverdue(r) ? 'ring-2 ring-red-400' : ''}`}>
              <div className={`p-2 ${isNeo ? 'border-2 border-black bg-amber-100' : 'rounded-xl bg-amber-50'}`}>
                <Bell size={18} className="text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className={`font-bold ${textCls} truncate`}>{r.title}</h4>
                  {isOverdue(r) && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-bold">OVERDUE</span>}
                  {r.recurring !== "none" && (
                    <span className={`flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 ${isNeo ? 'border border-black' : 'rounded'} bg-blue-50 text-blue-700 font-medium`}>
                      <RefreshCcw size={8} /> {recurringLabel[r.recurring]}
                    </span>
                  )}
                </div>
                {r.description && <p className={`text-sm ${textSecCls} mt-0.5`}>{r.description}</p>}
                <div className={`flex items-center gap-3 mt-1.5 text-xs ${textSecCls}`}>
                  <span className="flex items-center gap-1"><Calendar size={10} /> {r.date}</span>
                  <span className="flex items-center gap-1"><Clock size={10} /> {r.time}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleNotified(r.id)} className={`p-1.5 ${isNeo ? 'border border-black' : 'rounded-lg'} hover:bg-emerald-50 text-emerald-600`} title="Mark done">
                  <Check size={14} />
                </button>
                <button onClick={() => setDeleteId(r.id)} className={`p-1.5 ${isNeo ? 'border border-black' : 'rounded-lg'} hover:bg-red-50 text-red-500`} title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Past/completed reminders */}
      {past.length > 0 && (
        <div className="space-y-2">
          <h3 className={`text-sm font-bold ${textSecCls} uppercase tracking-wider`}>Completed</h3>
          {past.map((r) => (
            <div key={r.id} className={`${cardCls} p-4 flex items-start gap-3 opacity-60`}>
              <div className={`p-2 ${isNeo ? 'border-2 border-black bg-gray-100' : 'rounded-xl bg-gray-50'}`}>
                <BellOff size={18} className="text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`font-medium ${textCls} truncate line-through`}>{r.title}</h4>
                <div className={`flex items-center gap-3 mt-1 text-xs ${textSecCls}`}>
                  <span className="flex items-center gap-1"><Calendar size={10} /> {r.date}</span>
                  <span className="flex items-center gap-1"><Clock size={10} /> {r.time}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleNotified(r.id)} className={`p-1.5 ${isNeo ? 'border border-black' : 'rounded-lg'} hover:bg-amber-50 text-amber-600`} title="Reactivate">
                  <RefreshCcw size={14} />
                </button>
                <button onClick={() => setDeleteId(r.id)} className={`p-1.5 ${isNeo ? 'border border-black' : 'rounded-lg'} hover:bg-red-50 text-red-500`}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {reminders.length === 0 && !showAdd && (
        <div className={`text-center py-12 ${textSecCls}`}>
          <Bell size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No reminders yet. Create one to get started.</p>
        </div>
      )}

      <ConfirmModal
        open={deleteId !== null}
        title="Delete Reminder"
        message="Are you sure you want to delete this reminder?"
        confirmLabel="Delete"
        danger
        onConfirm={() => { if (deleteId) deleteReminder(deleteId); }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
