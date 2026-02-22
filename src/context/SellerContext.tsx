"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc, query, where, collection, getDocs } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";

export interface SellerProfile {
  uid: string;
  name: string;
  email: string;
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
    email: string;
    phone: string;
    storeName: string;
    storeCategory: string;
    documentFile: File;
    username: string;
    password: string;
  }) => Promise<void>;
  loginSeller: (identifier: string, password: string) => Promise<void>;
  logoutSeller: () => Promise<void>;
}

const SellerContext = createContext<SellerContextType | undefined>(undefined);

const normalizeUsername = (username: string) =>
  username.trim().toLowerCase().replace(/\s+/g, "");
const toSellerEmail = (username: string) => `${normalizeUsername(username)}@seller.local`;
const usernamePattern = /^[a-z0-9._-]+$/i;
const isSellerApproved = (profile: SellerProfile | null | undefined) =>
  profile?.approved === true || profile?.approvalStatus === "approved";

const normalizeIdentifierToUsername = (identifier: string) => {
  const normalized = identifier.trim().toLowerCase();
  if (!normalized) return "";
  if (normalized.includes("@")) {
    return normalized.split("@")[0].replace(/[^a-z0-9._-]/g, "");
  }
  return normalizeUsername(normalized);
};

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
    email: string;
    phone: string;
    storeName: string;
    storeCategory: string;
    documentFile: File;
    username: string;
    password: string;
  }) => {
    const email = toSellerEmail(data.username);
    const result = await createUserWithEmailAndPassword(auth, email, data.password);
    const normalizedEmail = data.email.trim().toLowerCase();
    const documentPath = `seller-accounts/${result.user.uid}/document-${Date.now()}-${data.documentFile.name}`;
    const documentRef = ref(storage, documentPath);
    await uploadBytes(documentRef, data.documentFile);
    const documentUrl = await getDownloadURL(documentRef);
    const profile: SellerProfile = {
      uid: result.user.uid,
      name: data.name,
      email: normalizedEmail,
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
    await signOut(auth);
    setSellerProfile(null);
  };

  const loginSeller = async (email: string, password: string) => {
    let user: import("firebase/auth").User | null = null;
    let docSnap: any = null;
    // يقبل فقط البريد الإلكتروني
    if (!email || typeof email !== "string" || !email.includes("@")) {
      throw new Error("SELLER_INVALID_EMAIL");
    }
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      user = result.user;
      const docRef = doc(db, "sellers", user.uid);
      docSnap = await getDoc(docRef);
    } catch (e) {
      await signOut(auth);
      setSellerProfile(null);
      throw new Error("SELLER_PROFILE_MISSING");
    }
    if (!docSnap || !docSnap.exists()) {
      await signOut(auth);
      setSellerProfile(null);
      throw new Error("SELLER_PROFILE_MISSING");
    }
    const profile = docSnap.data() as SellerProfile;
    if (!isSellerApproved(profile)) {
      await signOut(auth);
      setSellerProfile(null);
      throw new Error("SELLER_NOT_APPROVED");
    }
    setSellerProfile(profile);
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
