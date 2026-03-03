import { NextRequest, NextResponse } from "next/server";

// GET /api/data?uid=xxx - Load user data
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  if (!uid) {
    return NextResponse.json({ error: "Missing uid" }, { status: 400 });
  }

  try {
    // Dynamically import to avoid build issues with firebase-admin
    const { doc, getDoc } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");

    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      return NextResponse.json({ data: snap.data() });
    }
    return NextResponse.json({ data: null });
  } catch (error) {
    console.error("GET /api/data error:", error);
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }
}

// POST /api/data - Save user data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, data } = body;

    if (!uid || !data) {
      return NextResponse.json({ error: "Missing uid or data" }, { status: 400 });
    }

    const { doc, setDoc } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");

    await setDoc(doc(db, "users", uid), data, { merge: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/data error:", error);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}

// DELETE /api/data - Delete specific collection items
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, collection, itemId } = body;

    if (!uid || !collection || !itemId) {
      return NextResponse.json({ error: "Missing uid, collection, or itemId" }, { status: 400 });
    }

    const { doc, getDoc, setDoc } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");

    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const userData = snap.data();
      if (Array.isArray(userData[collection])) {
        userData[collection] = userData[collection].filter(
          (item: { id: string }) => item.id !== itemId
        );
        await setDoc(ref, userData);
        return NextResponse.json({ success: true, data: userData });
      }
    }

    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  } catch (error) {
    console.error("DELETE /api/data error:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}

// PATCH /api/data - Update specific item in a collection
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, collection, itemId, field, value } = body;

    if (!uid || !collection || !itemId || field === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { doc, getDoc, setDoc } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");

    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const userData = snap.data();
      if (Array.isArray(userData[collection])) {
        userData[collection] = userData[collection].map(
          (item: { id: string }) =>
            item.id === itemId ? { ...item, [field]: value } : item
        );
        await setDoc(ref, userData);
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  } catch (error) {
    console.error("PATCH /api/data error:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}
