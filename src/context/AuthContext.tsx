"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  setPersistence,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  register: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let isMounted = true;

    const ensureProfile = async (currentUser: User) => {
      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      const fallbackName =
        currentUser.displayName ||
        (currentUser.email ? currentUser.email.split("@")[0] : "User");
      const newProfile: UserProfile = {
        uid: currentUser.uid,
        email: currentUser.email || "",
        name: fallbackName,
        phone: "",
        address: "",
        city: "",
        createdAt: new Date().toISOString(),
      };
      await setDoc(docRef, newProfile, { merge: true });
      return newProfile;
    };

    const initAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (error) {
        console.warn("Failed to set auth persistence:", error);
      }

      unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (!isMounted) return;
        setUser(currentUser);

        if (currentUser) {
          const profile = await ensureProfile(currentUser);
          if (isMounted) setUserProfile(profile);
        } else {
          setUserProfile(null);
        }
        if (isMounted) setLoading(false);
      });
    };

    initAuth();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const register = async (email: string, password: string, name: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const newProfile: UserProfile = {
      uid: result.user.uid,
      email,
      name,
      phone: "",
      address: "",
      city: "",
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "users", result.user.uid), newProfile);
    setUserProfile(newProfile);
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const docRef = doc(db, "users", user.uid);
    const updated = { ...userProfile, ...data } as UserProfile;
    await setDoc(docRef, updated, { merge: true });
    setUserProfile(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        register,
        login,
        resetPassword,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
