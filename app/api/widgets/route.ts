import { NextRequest, NextResponse } from "next/server";

// Widget data API - GET, POST, PUT, DELETE
// Stores widget state (todos, notes, positions) for a user

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

interface WidgetData {
  todos: WidgetTodo[];
  notes: WidgetNote[];
  positions: Record<string, { x: number; y: number; visible: boolean }>;
}

// GET /api/widgets?uid=xxx - Load widget data
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  if (!uid) {
    return NextResponse.json({ error: "Missing uid" }, { status: 400 });
  }

  try {
    const { doc, getDoc } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");

    const snap = await getDoc(doc(db, "widgets", uid));
    if (snap.exists()) {
      return NextResponse.json({ data: snap.data() as WidgetData });
    }
    return NextResponse.json({ data: { todos: [], notes: [], positions: {} } });
  } catch (error) {
    console.error("GET /api/widgets error:", error);
    return NextResponse.json({ error: "Failed to load widget data" }, { status: 500 });
  }
}

// POST /api/widgets - Save widget data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, data } = body;

    if (!uid || !data) {
      return NextResponse.json({ error: "Missing uid or data" }, { status: 400 });
    }

    const { doc, setDoc } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");

    await setDoc(doc(db, "widgets", uid), data, { merge: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/widgets error:", error);
    return NextResponse.json({ error: "Failed to save widget data" }, { status: 500 });
  }
}

// PATCH /api/widgets - Update specific widget item
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, collection, itemId, updates } = body;

    if (!uid || !collection || !itemId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { doc, getDoc, setDoc } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");

    const ref = doc(db, "widgets", uid);
    const snap = await getDoc(ref);
    const widgetData = snap.exists() ? (snap.data() as WidgetData) : { todos: [], notes: [], positions: {} };

    if (collection === "todos") {
      widgetData.todos = widgetData.todos.map(t =>
        t.id === itemId ? { ...t, ...updates } : t
      );
    } else if (collection === "notes") {
      widgetData.notes = widgetData.notes.map(n =>
        n.id === itemId ? { ...n, ...updates } : n
      );
    }

    await setDoc(ref, widgetData);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/widgets error:", error);
    return NextResponse.json({ error: "Failed to update widget" }, { status: 500 });
  }
}

// DELETE /api/widgets - Delete widget item
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, collection, itemId } = body;

    if (!uid || !collection || !itemId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { doc, getDoc, setDoc } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");

    const ref = doc(db, "widgets", uid);
    const snap = await getDoc(ref);
    const widgetData = snap.exists() ? (snap.data() as WidgetData) : { todos: [], notes: [], positions: {} };

    if (collection === "todos") {
      widgetData.todos = widgetData.todos.filter(t => t.id !== itemId);
    } else if (collection === "notes") {
      widgetData.notes = widgetData.notes.filter(n => n.id !== itemId);
    }

    await setDoc(ref, widgetData);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/widgets error:", error);
    return NextResponse.json({ error: "Failed to delete widget item" }, { status: 500 });
  }
}
