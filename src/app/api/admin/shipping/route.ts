import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

// GET: جلب إعدادات الشحن
export async function GET() {
  const doc = await adminDb.collection("settings").doc("shipping").get();
  return Response.json(doc.exists ? doc.data() : {});
}

// POST: تحديث إعدادات الشحن
export async function POST(req: NextRequest) {
  const data = await req.json();
  await adminDb.collection("settings").doc("shipping").set(data, { merge: true });
  return Response.json({ success: true });
}
