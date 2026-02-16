import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/firebase";

export async function registerSeller(email: string, password: string, username: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await setDoc(doc(db, "sellers", user.uid), {
    email,
    username,
    approved: false,
    approvalStatus: "pending",
    createdAt: serverTimestamp(),
  });

  return user;
}
