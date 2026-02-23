import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

// تحديث أو حذف منتج محدد
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  await adminDb.collection("products").doc(params.id).update(body);
  return Response.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await adminDb.collection("products").doc(params.id).delete();
  return Response.json({ success: true });
}
