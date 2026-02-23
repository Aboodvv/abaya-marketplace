import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

// GET: جلب بيانات البانرات
export async function GET() {
  const doc = await adminDb.collection("settings").doc("homeAds").get();
  return Response.json(doc.exists ? doc.data() : {});
}

// POST: تحديث بيانات البانرات
export async function POST(req: NextRequest) {
  const data = await req.json();
  await adminDb.collection("settings").doc("homeAds").set(data, { merge: true });
  return Response.json({ success: true });
}
