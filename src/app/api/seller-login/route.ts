
import { NextRequest, NextResponse } from "next/server";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, query, collection, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/firebase";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  try {
    // يقبل فقط البريد الإلكتروني
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "SELLER_INVALID_EMAIL" }, { status: 401 });
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const sellerDoc = await getDoc(doc(db, "sellers", user.uid));

    if (!sellerDoc.exists()) {
      return NextResponse.json({ error: "SELLER_PROFILE_MISSING" }, { status: 401 });
    }

    const approved = !!sellerDoc.data().approved;

    const res = NextResponse.json({ success: true, approved });

    res.cookies.set("seller_approved", approved ? "true" : "false", {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    });

    return res;

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
