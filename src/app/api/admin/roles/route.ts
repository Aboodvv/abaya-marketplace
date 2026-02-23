import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

// GET: جلب جميع الأدوار
export async function GET() {
  const snap = await adminDb.collection("adminRoles").get();
  const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return Response.json(data);
}

// POST: إضافة أو تحديث دور
export async function POST(req: NextRequest) {
  const { id, ...rest } = await req.json();
  await adminDb.collection("adminRoles").doc(id).set(rest, { merge: true });
  return Response.json({ success: true });
}

// DELETE: حذف دور
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await adminDb.collection("adminRoles").doc(id).delete();
  return Response.json({ success: true });
}
