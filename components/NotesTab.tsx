"use client";

import React, { useState, useRef, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useDesign } from "@/contexts/DesignContext";
import ConfirmModal from "@/components/ConfirmModal";
import { NoteItem, NoteFolder, NoteTodo } from "@/lib/firestore";
import {
  Plus, Trash2, X, FolderOpen, Folder, Lock, Unlock, Search,
  Mic, MicOff, Image as ImageIcon, CheckSquare, Square, Maximize2,
  ChevronLeft, FolderPlus,
} from "lucide-react";

const NOTE_COLORS = [
  "bg-yellow-100", "bg-blue-100", "bg-pink-100", "bg-green-100",
  "bg-purple-100", "bg-orange-100", "bg-red-100", "bg-teal-100",
];
const FOLDER_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-orange-500",
  "bg-pink-500", "bg-teal-500", "bg-amber-500", "bg-red-500",
];

interface NotesTabProps {
  notes: NoteItem[];
  folders: NoteFolder[];
  onAddNote: (note: NoteItem) => void;
  onEditNote: (note: NoteItem) => void;
  onDeleteNote: (id: string) => void;
  onFoldersChange: (folders: NoteFolder[]) => void;
}

export default function NotesTab({
  notes,
  folders,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onFoldersChange,
}: NotesTabProps) {
  const { colors } = useTheme();
  const { design } = useDesign();
  const isNeo = design === "neobrutalist";
  const isGlass = design === "glass";

  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [fullscreenNote, setFullscreenNote] = useState<NoteItem | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);
  const [lockFolderPin, setLockFolderPin] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteFolderConfirm, setDeleteFolderConfirm] = useState<string | null>(null);
  const [unlockPrompt, setUnlockPrompt] = useState<string | null>(null);
  const [unlockPin, setUnlockPin] = useState("");
  const [unlockError, setUnlockError] = useState(false);
  const [unlockedFolders, setUnlockedFolders] = useState<Set<string>>(new Set());
  const [newNoteText, setNewNoteText] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);

  /* Design-aware classes */
  /* Unused for now but available for future card wrapping */
  const btnCls = isNeo
    ? `font-bold border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none`
    : `rounded-xl`;
  const textCls = isGlass ? "text-white" : colors.text;
  const textSecCls = isGlass ? "text-white/60" : colors.textSecondary;

  /* Filter notes by folder and search */
  const filteredNotes = notes.filter((n) => {
    const inFolder = activeFolderId ? n.folderId === activeFolderId : !n.folderId;
    const matchesSearch = !searchQuery || n.text.toLowerCase().includes(searchQuery.toLowerCase());
    return inFolder && matchesSearch;
  });

  /* Folder actions */
  const addFolder = () => {
    if (!newFolderName.trim()) return;
    const folder: NoteFolder = {
      id: crypto.randomUUID(),
      name: newFolderName.trim(),
      color: newFolderColor,
      locked: !!lockFolderPin,
      lockPin: lockFolderPin || undefined,
      createdAt: new Date().toISOString(),
    };
    onFoldersChange([...folders, folder]);
    setNewFolderName("");
    setLockFolderPin("");
    setShowNewFolder(false);
  };

  const deleteFolder = (folderId: string) => {
    // Move notes in this folder to root
    notes.filter(n => n.folderId === folderId).forEach(n => {
      onEditNote({ ...n, folderId: undefined });
    });
    onFoldersChange(folders.filter(f => f.id !== folderId));
    if (activeFolderId === folderId) setActiveFolderId(null);
    setDeleteFolderConfirm(null);
  };

  const handleFolderClick = (folder: NoteFolder) => {
    if (folder.locked && !unlockedFolders.has(folder.id)) {
      setUnlockPrompt(folder.id);
      setUnlockPin("");
      setUnlockError(false);
      return;
    }
    setActiveFolderId(folder.id);
  };

  const tryUnlock = () => {
    if (!unlockPrompt) return;
    const folder = folders.find(f => f.id === unlockPrompt);
    if (folder && folder.lockPin === unlockPin) {
      setUnlockedFolders(prev => new Set(prev).add(folder.id));
      setActiveFolderId(folder.id);
      setUnlockPrompt(null);
      setUnlockPin("");
    } else {
      setUnlockError(true);
    }
  };

  /* Note actions */
  const addNote = () => {
    if (!newNoteText.trim()) return;
    const note: NoteItem = {
      id: crypto.randomUUID(),
      text: newNoteText.trim(),
      color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      folderId: activeFolderId || undefined,
      todos: [],
      images: [],
      voiceNotes: [],
    };
    onAddNote(note);
    setNewNoteText("");
  };

  /* Image upload */
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetId) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const note = notes.find(n => n.id === uploadTargetId);
      if (note) {
        onEditNote({ ...note, images: [...(note.images || []), base64], updatedAt: new Date().toISOString() });
      }
      if (fullscreenNote && fullscreenNote.id === uploadTargetId) {
        setFullscreenNote(prev => prev ? { ...prev, images: [...(prev.images || []), base64] } : null);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
    setUploadTargetId(null);
  }, [uploadTargetId, notes, fullscreenNote, onEditNote]);

  /* Voice recording */
  const startRecording = async (noteId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          const note = notes.find(n => n.id === noteId);
          if (note) {
            onEditNote({ ...note, voiceNotes: [...(note.voiceNotes || []), base64], updatedAt: new Date().toISOString() });
          }
          if (fullscreenNote && fullscreenNote.id === noteId) {
            setFullscreenNote(prev => prev ? { ...prev, voiceNotes: [...(prev.voiceNotes || []), base64] } : null);
          }
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  /* Todo management within a note */
  const addTodoToNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const todo: NoteTodo = { id: crypto.randomUUID(), text: "", done: false };
    const updated = { ...note, todos: [...(note.todos || []), todo], updatedAt: new Date().toISOString() };
    onEditNote(updated);
    if (fullscreenNote?.id === noteId) setFullscreenNote(updated);
  };

  const editTodoInNote = (noteId: string, todoId: string, changes: Partial<NoteTodo>) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const updated = {
      ...note,
      todos: (note.todos || []).map(t => t.id === todoId ? { ...t, ...changes } : t),
      updatedAt: new Date().toISOString(),
    };
    onEditNote(updated);
    if (fullscreenNote?.id === noteId) setFullscreenNote(updated);
  };

  const deleteTodoInNote = (noteId: string, todoId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const updated = {
      ...note,
      todos: (note.todos || []).filter(t => t.id !== todoId),
      updatedAt: new Date().toISOString(),
    };
    onEditNote(updated);
    if (fullscreenNote?.id === noteId) setFullscreenNote(updated);
  };

  const removeImage = (noteId: string, imgIdx: number) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const updated = { ...note, images: (note.images || []).filter((_, i) => i !== imgIdx), updatedAt: new Date().toISOString() };
    onEditNote(updated);
    if (fullscreenNote?.id === noteId) setFullscreenNote(updated);
  };

  const removeVoice = (noteId: string, vIdx: number) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const updated = { ...note, voiceNotes: (note.voiceNotes || []).filter((_, i) => i !== vIdx), updatedAt: new Date().toISOString() };
    onEditNote(updated);
    if (fullscreenNote?.id === noteId) setFullscreenNote(updated);
  };

  /* Lock/unlock a note */
  const toggleNoteLock = (note: NoteItem) => {
    if (note.locked) {
      onEditNote({ ...note, locked: false, lockPin: undefined, updatedAt: new Date().toISOString() });
    } else {
      const pin = prompt("Set a PIN for this note:");
      if (pin) {
        onEditNote({ ...note, locked: true, lockPin: pin, updatedAt: new Date().toISOString() });
      }
    }
  };

  /* Render a note card (compact view) */
  const renderNoteCard = (note: NoteItem) => {
    const isLocked = note.locked;
    const todoCount = (note.todos || []).length;
    const todoDone = (note.todos || []).filter(t => t.done).length;
    const imageCount = (note.images || []).length;
    const voiceCount = (note.voiceNotes || []).length;

    return (
      <div
        key={note.id}
        className={`${note.color} ${isNeo ? 'border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]' : 'rounded-xl border border-black/5'} p-4 relative group min-h-[120px] transition-transform hover:scale-[1.01]`}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            {isLocked && <Lock size={12} className="text-gray-500" />}
            <span className="text-[9px] text-gray-500">{new Date(note.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setFullscreenNote(note)} className="p-1 rounded hover:bg-black/10 text-gray-600" title="Full screen">
              <Maximize2 size={12} />
            </button>
            <button onClick={() => toggleNoteLock(note)} className="p-1 rounded hover:bg-black/10 text-gray-600" title={isLocked ? "Unlock" : "Lock"}>
              {isLocked ? <Unlock size={12} /> : <Lock size={12} />}
            </button>
            <button onClick={() => { setUploadTargetId(note.id); fileInputRef.current?.click(); }} className="p-1 rounded hover:bg-black/10 text-gray-600" title="Add image">
              <ImageIcon size={12} />
            </button>
            {isRecording ? (
              <button onClick={stopRecording} className="p-1 rounded hover:bg-red-200 text-red-600" title="Stop recording">
                <MicOff size={12} />
              </button>
            ) : (
              <button onClick={() => startRecording(note.id)} className="p-1 rounded hover:bg-black/10 text-gray-600" title="Record voice">
                <Mic size={12} />
              </button>
            )}
            <button onClick={() => setDeleteConfirm(note.id)} className="p-1 rounded hover:bg-black/10 text-gray-600" title="Delete">
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Note text */}
        <textarea
          defaultValue={note.text}
          onBlur={(e) => {
            if (e.target.value !== note.text) onEditNote({ ...note, text: e.target.value, updatedAt: new Date().toISOString() });
          }}
          className={`w-full bg-transparent text-sm text-gray-800 outline-none resize-none min-h-[50px] ${isNeo ? 'font-medium' : ''}`}
        />

        {/* Images preview */}
        {imageCount > 0 && (
          <div className="flex gap-1 flex-wrap mt-2">
            {(note.images || []).slice(0, 3).map((img, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={img} alt="" className={`w-10 h-10 object-cover ${isNeo ? 'border border-black' : 'rounded'}`} />
            ))}
            {imageCount > 3 && <span className="text-[10px] text-gray-500 self-end">+{imageCount - 3}</span>}
          </div>
        )}

        {/* Compact todo progress */}
        {todoCount > 0 && (
          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-600">
            <CheckSquare size={10} />
            <span>{todoDone}/{todoCount} done</span>
          </div>
        )}

        {/* Voice badge */}
        {voiceCount > 0 && (
          <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-600">
            <Mic size={10} />
            <span>{voiceCount} recording{voiceCount > 1 ? "s" : ""}</span>
          </div>
        )}
      </div>
    );
  };

  /* Render fullscreen note editor */
  const renderFullscreenEditor = () => {
    if (!fullscreenNote) return null;
    const note = notes.find(n => n.id === fullscreenNote.id) || fullscreenNote;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
        <div className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto ${note.color} ${isNeo ? 'border-3 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)]' : 'rounded-2xl border border-black/10'} p-6`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setFullscreenNote(null)} className="p-1.5 rounded-lg hover:bg-black/10 text-gray-700">
                <ChevronLeft size={20} />
              </button>
              <span className="text-xs text-gray-500">{new Date(note.createdAt).toLocaleString()}</span>
              {note.updatedAt && (
                <span className="text-xs text-gray-400">· edited {new Date(note.updatedAt).toLocaleString()}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setUploadTargetId(note.id); fileInputRef.current?.click(); }} className={`flex items-center gap-1 px-2 py-1 text-xs ${isNeo ? 'border-2 border-black shadow-[2px_2px_0px] font-bold' : 'rounded-lg'} bg-white/60 text-gray-700 hover:bg-white/80`}>
                <ImageIcon size={12} /> Image
              </button>
              {isRecording ? (
                <button onClick={stopRecording} className={`flex items-center gap-1 px-2 py-1 text-xs ${isNeo ? 'border-2 border-black shadow-[2px_2px_0px] font-bold' : 'rounded-lg'} bg-red-100 text-red-700`}>
                  <MicOff size={12} /> Stop
                </button>
              ) : (
                <button onClick={() => startRecording(note.id)} className={`flex items-center gap-1 px-2 py-1 text-xs ${isNeo ? 'border-2 border-black shadow-[2px_2px_0px] font-bold' : 'rounded-lg'} bg-white/60 text-gray-700 hover:bg-white/80`}>
                  <Mic size={12} /> Record
                </button>
              )}
              <button onClick={() => addTodoToNote(note.id)} className={`flex items-center gap-1 px-2 py-1 text-xs ${isNeo ? 'border-2 border-black shadow-[2px_2px_0px] font-bold' : 'rounded-lg'} bg-white/60 text-gray-700 hover:bg-white/80`}>
                <CheckSquare size={12} /> Todo
              </button>
              <button onClick={() => toggleNoteLock(note)} className={`p-1 ${isNeo ? 'border-2 border-black shadow-[2px_2px_0px]' : 'rounded-lg'} hover:bg-black/10 text-gray-600`} title={note.locked ? "Unlock" : "Lock"}>
                {note.locked ? <Unlock size={14} /> : <Lock size={14} />}
              </button>
              <button onClick={() => setFullscreenNote(null)} className="p-1.5 rounded-lg hover:bg-black/10 text-gray-700">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Note text editor */}
          <textarea
            defaultValue={note.text}
            onBlur={(e) => {
              if (e.target.value !== note.text) {
                const updated = { ...note, text: e.target.value, updatedAt: new Date().toISOString() };
                onEditNote(updated);
                setFullscreenNote(updated);
              }
            }}
            className={`w-full bg-transparent text-gray-800 outline-none resize-none min-h-[200px] text-base leading-relaxed ${isNeo ? 'font-medium' : ''}`}
            placeholder="Start writing..."
          />

          {/* Images */}
          {(note.images || []).length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-bold text-gray-600 mb-2 uppercase">Images</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(note.images || []).map((img, i) => (
                  <div key={i} className="relative group/img">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className={`w-full h-32 object-cover ${isNeo ? 'border-2 border-black' : 'rounded-lg'}`} />
                    <button
                      onClick={() => removeImage(note.id, i)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Voice Notes */}
          {(note.voiceNotes || []).length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-bold text-gray-600 mb-2 uppercase">Voice Notes</h4>
              <div className="space-y-2">
                {(note.voiceNotes || []).map((voice, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <audio controls src={voice} className="flex-1 h-8" />
                    <button onClick={() => removeVoice(note.id, i)} className="p-1 text-red-500 hover:bg-red-100 rounded">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Todos */}
          {(note.todos || []).length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-bold text-gray-600 mb-2 uppercase">Checklist</h4>
              <div className="space-y-1.5">
                {(note.todos || []).map((todo) => (
                  <div key={todo.id} className="flex items-center gap-2">
                    <button onClick={() => editTodoInNote(note.id, todo.id, { done: !todo.done })}>
                      {todo.done ? <CheckSquare size={16} className="text-emerald-600" /> : <Square size={16} className="text-gray-400" />}
                    </button>
                    <input
                      type="text"
                      defaultValue={todo.text}
                      placeholder="Todo item..."
                      onBlur={(e) => editTodoInNote(note.id, todo.id, { text: e.target.value })}
                      className={`flex-1 bg-transparent text-sm text-gray-800 outline-none ${todo.done ? "line-through opacity-50" : ""}`}
                    />
                    <button onClick={() => deleteTodoInNote(note.id, todo.id)} className="p-0.5 text-gray-400 hover:text-red-500">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-up space-y-4">
      {/* Top bar: search + add folder */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className={`flex-1 flex items-center gap-2 px-3 py-2 ${isNeo ? 'border-2 border-black shadow-[3px_3px_0px]' : `rounded-xl border ${colors.border}`} ${isGlass ? 'bg-white/10' : colors.inputBg}`}>
          <Search size={16} className={textSecCls} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className={`flex-1 bg-transparent text-sm ${textCls} outline-none`}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className={`${textSecCls} hover:opacity-70`}>
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewFolder(true)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm ${btnCls} ${isGlass ? 'bg-white/10 text-white' : `${colors.surfaceAlt} ${textCls}`}`}
          >
            <FolderPlus size={14} /> New Folder
          </button>
        </div>
      </div>

      {/* Folders row */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveFolderId(null)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm whitespace-nowrap ${isNeo ? 'border-2 border-black font-bold' : 'rounded-lg'} transition-colors ${
            activeFolderId === null
              ? `${colors.primary} text-white`
              : `${isGlass ? 'bg-white/10 text-white' : `${colors.surfaceAlt} ${textCls}`}`
          }`}
        >
          <FolderOpen size={14} /> All Notes
        </button>
        {folders.map((folder) => (
          <div key={folder.id} className="relative group/folder flex-shrink-0">
            <button
              onClick={() => handleFolderClick(folder)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm whitespace-nowrap ${isNeo ? 'border-2 border-black font-bold' : 'rounded-lg'} transition-colors ${
                activeFolderId === folder.id
                  ? `${folder.color} text-white`
                  : `${isGlass ? 'bg-white/10 text-white' : `${colors.surfaceAlt} ${textCls}`}`
              }`}
            >
              {folder.locked && !unlockedFolders.has(folder.id) ? <Lock size={12} /> : <Folder size={14} />}
              {folder.name}
            </button>
            <button
              onClick={() => setDeleteFolderConfirm(folder.id)}
              className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover/folder:opacity-100 transition-opacity"
            >
              <X size={8} />
            </button>
          </div>
        ))}
      </div>

      {/* New folder form */}
      {showNewFolder && (
        <div className={`${isNeo ? 'border-2 border-black shadow-[4px_4px_0px] bg-white' : isGlass ? 'backdrop-blur-xl bg-white/10 rounded-xl border border-white/20' : `${colors.surface} rounded-xl border ${colors.border}`} p-4 animate-fade-up`}>
          <h3 className={`text-sm font-bold ${isNeo ? 'text-black' : textCls} mb-3`}>New Folder</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name..."
              className={`w-full px-3 py-2 text-sm ${isNeo ? 'border-2 border-black' : `rounded-lg border ${colors.border}`} ${colors.inputBg} ${textCls} outline-none`}
            />
            <div>
              <label className={`block text-xs ${textSecCls} mb-1`}>Color</label>
              <div className="flex gap-2">
                {FOLDER_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewFolderColor(c)}
                    className={`w-6 h-6 ${c} ${isNeo ? 'border-2 border-black' : 'rounded-full'} ${newFolderColor === c ? 'ring-2 ring-offset-1 ring-black' : ''}`}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className={`block text-xs ${textSecCls} mb-1`}>Lock with PIN (optional)</label>
              <input
                type="password"
                value={lockFolderPin}
                onChange={(e) => setLockFolderPin(e.target.value)}
                placeholder="Leave empty = no lock"
                className={`w-full px-3 py-2 text-sm ${isNeo ? 'border-2 border-black' : `rounded-lg border ${colors.border}`} ${colors.inputBg} ${textCls} outline-none`}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={addFolder} className={`px-4 py-2 text-sm text-white ${colors.primary} ${btnCls}`}>Create</button>
              <button onClick={() => setShowNewFolder(false)} className={`px-4 py-2 text-sm ${textCls} ${isNeo ? 'border-2 border-black' : `rounded-xl border ${colors.border}`}`}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add note input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newNoteText}
          onChange={(e) => setNewNoteText(e.target.value)}
          placeholder="Write a new note..."
          className={`flex-1 px-3 py-2 ${isNeo ? 'border-2 border-black shadow-[2px_2px_0px] font-medium' : `rounded-xl border ${colors.border}`} ${isGlass ? 'bg-white/10 text-white' : `${colors.inputBg} ${textCls}`} text-sm outline-none`}
          onKeyDown={(e) => { if (e.key === "Enter") addNote(); }}
        />
        <button onClick={addNote} className={`p-2 ${colors.primary} text-white ${btnCls}`}>
          <Plus size={16} />
        </button>
      </div>

      {/* Notes grid */}
      {filteredNotes.length === 0 ? (
        <div className={`text-center py-12 ${textSecCls} text-sm`}>
          {searchQuery ? "No notes match your search." : "No notes yet. Start typing above."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredNotes.map(renderNoteCard)}
        </div>
      )}

      {/* Hidden file input for image uploads */}
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />

      {/* Fullscreen note editor overlay */}
      {renderFullscreenEditor()}

      {/* Unlock folder prompt */}
      {unlockPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-sm ${isNeo ? 'bg-white border-3 border-black shadow-[6px_6px_0px]' : `${colors.surface} rounded-2xl border ${colors.border}`} p-6`}>
            <div className="flex items-center gap-2 mb-4">
              <Lock size={20} className={textCls} />
              <h3 className={`font-bold ${textCls}`}>Folder Locked</h3>
            </div>
            <p className={`text-sm ${textSecCls} mb-4`}>Enter the PIN to access this folder.</p>
            <input
              type="password"
              value={unlockPin}
              onChange={(e) => { setUnlockPin(e.target.value); setUnlockError(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") tryUnlock(); }}
              placeholder="Enter PIN..."
              className={`w-full px-3 py-2 text-sm ${isNeo ? 'border-2 border-black' : `rounded-lg border ${colors.border}`} ${colors.inputBg} ${textCls} outline-none mb-2`}
              autoFocus
            />
            {unlockError && <p className="text-red-500 text-xs mb-2">Incorrect PIN. Try again.</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={tryUnlock} className={`flex-1 px-4 py-2 text-sm text-white ${colors.primary} ${btnCls}`}>Unlock</button>
              <button onClick={() => { setUnlockPrompt(null); setUnlockPin(""); }} className={`flex-1 px-4 py-2 text-sm ${textCls} ${isNeo ? 'border-2 border-black' : `rounded-xl border ${colors.border}`}`}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete note */}
      <ConfirmModal
        open={deleteConfirm !== null}
        title="Delete Note"
        message="Are you sure you want to delete this note?"
        confirmLabel="Delete"
        danger
        onConfirm={() => { if (deleteConfirm) { onDeleteNote(deleteConfirm); setDeleteConfirm(null); } }}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* Confirm delete folder */}
      <ConfirmModal
        open={deleteFolderConfirm !== null}
        title="Delete Folder"
        message="Are you sure? Notes in this folder will be moved to All Notes."
        confirmLabel="Delete"
        danger
        onConfirm={() => { if (deleteFolderConfirm) deleteFolder(deleteFolderConfirm); }}
        onCancel={() => setDeleteFolderConfirm(null)}
      />
    </div>
  );
}
