import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";

export async function loginSeller(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const sellerDoc = await getDoc(doc(db, "sellers", user.uid));

  if (!sellerDoc.exists()) {
    throw new Error("SELLER_PROFILE_MISSING");
  }

  if (!sellerDoc.data().approved) {
    throw new Error("SELLER_NOT_APPROVED");
  }

  return user;
}
