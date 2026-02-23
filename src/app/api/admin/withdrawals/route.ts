import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

// GET: جلب جميع طلبات السحب
export async function GET() {
  const snap = await adminDb.collection("withdrawals").get();
  const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return Response.json(data);
}

// PATCH: تحديث حالة السحب
export async function PATCH(req: NextRequest) {
  const { id, ...rest } = await req.json();
  await adminDb.collection("withdrawals").doc(id).update(rest);
  return Response.json({ success: true });
}
