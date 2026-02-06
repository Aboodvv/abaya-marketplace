"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";

export interface SellerProfile {
  uid: string;
  name: string;
  phone: string;
  storeName: string;
  storeCategory: string;
  documentUrl: string;
  username: string;
  createdAt: string;
  approvalStatus?: "pending" | "approved" | "rejected";
  approved?: boolean;
  approvedAt?: string | null;
}

interface SellerContextType {
  sellerUser: User | null;
  sellerProfile: SellerProfile | null;
  loading: boolean;
  registerSeller: (data: {
    name: string;
    phone: string;
    storeName: string;
    storeCategory: string;
    documentFile: File;
    username: string;
    password: string;
  }) => Promise<void>;
  loginSeller: (username: string, password: string) => Promise<void>;
  logoutSeller: () => Promise<void>;
}

const SellerContext = createContext<SellerContextType | undefined>(undefined);

const normalizeUsername = (username: string) =>
  username.trim().toLowerCase().replace(/\s+/g, "");
const toSellerEmail = (username: string) => `${normalizeUsername(username)}@seller.local`;

export const SellerProvider = ({ children }: { children: React.ReactNode }) => {
  const [sellerUser, setSellerUser] = useState<User | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setSellerUser(currentUser);

      if (currentUser) {
        const docRef = doc(db, "sellers", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSellerProfile(docSnap.data() as SellerProfile);
        } else {
          setSellerProfile(null);
        }
      } else {
        setSellerProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const registerSeller = async (data: {
    name: string;
    phone: string;
    storeName: string;
    storeCategory: string;
    documentFile: File;
    username: string;
    password: string;
  }) => {
    const email = toSellerEmail(data.username);
    const result = await createUserWithEmailAndPassword(auth, email, data.password);
    const documentPath = `seller-accounts/${result.user.uid}/document-${Date.now()}-${data.documentFile.name}`;
    const documentRef = ref(storage, documentPath);
    await uploadBytes(documentRef, data.documentFile);
    const documentUrl = await getDownloadURL(documentRef);
    const profile: SellerProfile = {
      uid: result.user.uid,
      name: data.name,
      phone: data.phone,
      storeName: data.storeName,
      storeCategory: data.storeCategory,
      documentUrl,
      username: data.username,
      createdAt: new Date().toISOString(),
      approvalStatus: "pending",
      approved: false,
    };
    await setDoc(doc(db, "sellers", result.user.uid), profile);
    setSellerProfile(profile);
    const profileBlob = new Blob([JSON.stringify(profile, null, 2)], {
      type: "application/json",
    });
    const profileRef = ref(storage, `seller-accounts/${result.user.uid}/profile.json`);
    void uploadBytes(profileRef, profileBlob).catch((error) => {
      console.error("Failed to upload seller profile backup", error);
    });
  };

  const loginSeller = async (username: string, password: string) => {
    const email = toSellerEmail(username);
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logoutSeller = async () => {
    await signOut(auth);
  };

  const value = useMemo(
    () => ({ sellerUser, sellerProfile, loading, registerSeller, loginSeller, logoutSeller }),
    [sellerUser, sellerProfile, loading]
  );

  return <SellerContext.Provider value={value}>{children}</SellerContext.Provider>;
};

export const useSeller = () => {
  const context = useContext(SellerContext);
  if (!context) {
    throw new Error("useSeller must be used within SellerProvider");
  }
  return context;
};
