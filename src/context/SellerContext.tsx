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
import { auth, db } from "@/lib/firebase";

export interface SellerProfile {
  uid: string;
  name: string;
  phone: string;
  storeName: string;
  storeCategory: string;
  documentUrl: string;
  username: string;
  createdAt: string;
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
    documentUrl: string;
    username: string;
    password: string;
  }) => Promise<void>;
  loginSeller: (username: string, password: string) => Promise<void>;
  logoutSeller: () => Promise<void>;
}

const SellerContext = createContext<SellerContextType | undefined>(undefined);

const toSellerEmail = (username: string) => `${username}@seller.local`;

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
    documentUrl: string;
    username: string;
    password: string;
  }) => {
    const email = toSellerEmail(data.username);
    const result = await createUserWithEmailAndPassword(auth, email, data.password);
    const profile: SellerProfile = {
      uid: result.user.uid,
      name: data.name,
      phone: data.phone,
      storeName: data.storeName,
      storeCategory: data.storeCategory,
      documentUrl: data.documentUrl,
      username: data.username,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "sellers", result.user.uid), profile);
    setSellerProfile(profile);
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
