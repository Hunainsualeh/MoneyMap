import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export interface ExpenseRow {
  id: string;
  date: string;
  description: string;
  category: string;
  type: "Expense" | "Income";
  amount: number;
  status: "Pending" | "Paid";
  month: string;
  note?: string;
}

export interface BudgetRow {
  id: string;
  category: string;
  budgeted: number;
  actual: number;
  notes: string;
}

export interface TodoRow {
  id: string;
  done: boolean;
  task: string;
  dueDate: string;
  priority: "High" | "Medium" | "Low";
}

export interface NoteTodo {
  id: string;
  text: string;
  done: boolean;
}

export interface NoteItem {
  id: string;
  text: string;
  color: string;
  createdAt: string;
  updatedAt?: string;
  folderId?: string;
  images?: string[];
  voiceNotes?: string[];
  todos?: NoteTodo[];
  locked?: boolean;
  lockPin?: string;
}

export interface NoteFolder {
  id: string;
  name: string;
  color: string;
  locked?: boolean;
  lockPin?: string;
  createdAt: string;
}

export interface ScheduledReminder {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  recurring: "none" | "daily" | "weekly" | "monthly";
  notified: boolean;
  createdAt: string;
}

export interface UserData {
  expenses: ExpenseRow[];
  budgets: BudgetRow[];
  todos: TodoRow[];
  notes: NoteItem[];
  categories: string[];
  initialBalance: number;
  monthlySalary: number;
  noteFolders?: NoteFolder[];
  scheduledReminders?: ScheduledReminder[];
  theme?: string;
  design?: string;
}

const getUserDocRef = (uid: string) => doc(db, "users", uid);

export async function loadUserData(uid: string): Promise<UserData | null> {
  try {
    const snap = await getDoc(getUserDocRef(uid));
    if (snap.exists()) {
      return snap.data() as UserData;
    }
    return null;
  } catch (err) {
    console.warn("loadUserData error (possibly offline):", err);
    return null;
  }
}

export async function saveUserData(uid: string, data: UserData): Promise<void> {
  try {
    await setDoc(getUserDocRef(uid), data, { merge: true });
  } catch (err) {
    console.warn("saveUserData error (possibly offline, will sync later):", err);
  }
}
