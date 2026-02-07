"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  createUserWithEmailAndPassword,
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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (!currentUser) {
        setUserProfile(null);
        return;
      }

      const fallbackName =
        currentUser.displayName ||
        currentUser.email?.split("@")[0] ||
        "Customer";
      const fallbackProfile: UserProfile = {
        uid: currentUser.uid,
        email: currentUser.email || "",
        name: fallbackName,
        phone: "",
        address: "",
        city: "",
        createdAt: new Date().toISOString(),
      };

      (async () => {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            setUserProfile(fallbackProfile);
            await setDoc(docRef, fallbackProfile, { merge: true });
          }
        } catch (error) {
          console.error("Failed to load user profile", error);
          setUserProfile(fallbackProfile);
        }
      })();
    });

    return unsubscribe;
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
    const result = await signInWithEmailAndPassword(auth, email, password);
    setUser(result.user);
    const fallbackName =
      result.user.displayName ||
      result.user.email?.split("@")[0] ||
      "Customer";
    const fallbackProfile: UserProfile = {
      uid: result.user.uid,
      email: result.user.email || "",
      name: fallbackName,
      phone: "",
      address: "",
      city: "",
      createdAt: new Date().toISOString(),
    };
    setUserProfile((prev) => prev ?? fallbackProfile);
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
    const fallbackProfile: UserProfile = {
      uid: user.uid,
      email: user.email || "",
      name: user.displayName || user.email?.split("@")[0] || "Customer",
      phone: "",
      address: "",
      city: "",
      createdAt: new Date().toISOString(),
    };
    const updated = { ...(userProfile || fallbackProfile), ...data } as UserProfile;
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
