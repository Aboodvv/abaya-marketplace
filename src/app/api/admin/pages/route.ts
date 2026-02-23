import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

const pageKeys = [
  "explore",
  "abayas",
  "fabrics",
  "delivery",
  "categories",
  "coloredAbayas",
  "eveningAbayas",
  "formalAbayas",
  "dresses",
];

// GET: جلب جميع الصفحات
export async function GET() {
  const entries = await Promise.all(
    pageKeys.map(async (key) => {
      const doc = await adminDb.collection("pages").doc(key).get();
      return [key, doc.exists ? doc.data() : {}];
    })
  );
  const result = Object.fromEntries(entries);
  return Response.json(result);
}

// POST: تحديث جميع الصفحات
export async function POST(req: NextRequest) {
  const data = await req.json();
  await Promise.all(
    pageKeys.map((key) =>
      adminDb.collection("pages").doc(key).set(data[key], { merge: true })
    )
  );
  return Response.json({ success: true });
}
