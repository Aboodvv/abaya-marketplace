import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

// GET: جلب جميع الطلبات
export async function GET() {
  const snap = await adminDb.collection("orders").orderBy("createdAt", "desc").get();
  const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return Response.json(data);
}

// PATCH: تحديث حالة الطلب
export async function PATCH(req: NextRequest) {
  const { id, ...rest } = await req.json();
  await adminDb.collection("orders").doc(id).update(rest);
  return Response.json({ success: true });
}
