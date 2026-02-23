import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

// GET: جلب جميع المنتجات
export async function GET() {
  const snap = await adminDb.collection("products").get();
  const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return Response.json(data);
}

// POST: إضافة منتج جديد
export async function POST(req: NextRequest) {
  const body = await req.json();
  const docRef = await adminDb.collection("products").add({
    ...body,
    createdAt: new Date().toISOString(),
  });
  return Response.json({ id: docRef.id });
}
