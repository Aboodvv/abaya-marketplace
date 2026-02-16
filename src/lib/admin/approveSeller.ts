import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";

export async function approveSeller(uid: string) {
  await updateDoc(doc(db, "sellers", uid), {
    approved: true,
    approvalStatus: "approved",
    approvedAt: serverTimestamp(),
  });
}
