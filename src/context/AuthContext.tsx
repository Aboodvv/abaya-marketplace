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
  hasSession: boolean;
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
  const [hasSession, setHasSession] = useState(false);
  const authBootTimeoutMs = 1500;
  const debugAuth = process.env.NEXT_PUBLIC_DEBUG_AUTH === "1";
  const bootStart = debugAuth ? performance.now() : 0;

  type AuthSession = {
    uid: string;
    email: string;
    displayName?: string | null;
  };

  const buildFallbackProfile = (currentUser: User) => {
    const fallbackName =
      currentUser.displayName ||
      (currentUser.email ? currentUser.email.split("@")[0] : "User");

    return {
      uid: currentUser.uid,
      email: currentUser.email || "",
      name: fallbackName,
      phone: "",
      address: "",
      city: "",
      createdAt: new Date().toISOString(),
    } satisfies UserProfile;
  };

  const isSellerAccount = (currentUser: User) =>
    (currentUser.email || "").toLowerCase().endsWith("@seller.local");

  const getProfileCacheKey = (uid: string) => `profile:${uid}`;
  const getSessionCacheKey = () => "auth:session";

  const readCachedSession = () => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(getSessionCacheKey());
      if (!raw) return null;
      return JSON.parse(raw) as AuthSession;
    } catch (error) {
      console.warn("Failed to read cached session:", error);
      return null;
    }
  };

  const writeCachedSession = (currentUser: User) => {
    if (typeof window === "undefined") return;
    try {
      const session: AuthSession = {
        uid: currentUser.uid,
        email: currentUser.email || "",
        displayName: currentUser.displayName || null,
      };
      localStorage.setItem(getSessionCacheKey(), JSON.stringify(session));
      setHasSession(true);
    } catch (error) {
      console.warn("Failed to cache session:", error);
    }
  };

  const clearCachedSession = () => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(getSessionCacheKey());
      setHasSession(false);
    } catch (error) {
      console.warn("Failed to clear cached session:", error);
    }
  };

  const readCachedProfile = (uid: string) => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(getProfileCacheKey(uid));
      if (!raw) return null;
      return JSON.parse(raw) as UserProfile;
    } catch (error) {
      console.warn("Failed to read cached profile:", error);
      return null;
    }
  };

  const writeCachedProfile = (profile: UserProfile) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(getProfileCacheKey(profile.uid), JSON.stringify(profile));
    } catch (error) {
      console.warn("Failed to cache profile:", error);
    }
  };

  const clearCachedProfile = (uid: string) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(getProfileCacheKey(uid));
    } catch (error) {
      console.warn("Failed to clear cached profile:", error);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let isMounted = true;

    const bootstrapSession = () => {
      const session = readCachedSession();
      if (!session) return;

      const sessionUser = {
        uid: session.uid,
        email: session.email,
        displayName: session.displayName || null,
      } as User;

      setUser(sessionUser);
      const cachedProfile = readCachedProfile(session.uid);
      if (cachedProfile) setUserProfile(cachedProfile);
      setHasSession(true);
      setLoading(false);
    };

    const ensureProfile = async (currentUser: User) => {
      const fallbackProfile = buildFallbackProfile(currentUser);

      if (debugAuth) {
        console.debug("[auth] ensureProfile:start", {
          uid: currentUser.uid,
          t: Math.round(performance.now() - bootStart),
        });
      }

      try {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          if (debugAuth) {
            console.debug("[auth] ensureProfile:hit", {
              uid: currentUser.uid,
              t: Math.round(performance.now() - bootStart),
            });
          }
          return docSnap.data() as UserProfile;
        }
        await setDoc(docRef, fallbackProfile, { merge: true });
        if (debugAuth) {
          console.debug("[auth] ensureProfile:created", {
            uid: currentUser.uid,
            t: Math.round(performance.now() - bootStart),
          });
        }
        return fallbackProfile;
      } catch (error) {
        console.warn("Failed to load user profile, using fallback:", error);
        return fallbackProfile;
      }
    };

    const loadProfile = async (currentUser: User) => {
      const fallbackProfile = buildFallbackProfile(currentUser);

      if (isMounted) setUserProfile(fallbackProfile);
      writeCachedProfile(fallbackProfile);

      if (isSellerAccount(currentUser)) {
        return;
      }

      if (debugAuth) {
        console.debug("[auth] loadProfile:start", {
          uid: currentUser.uid,
          t: Math.round(performance.now() - bootStart),
        });
      }

      try {
        const profile = await Promise.race([
          ensureProfile(currentUser),
          new Promise<UserProfile>((resolve) =>
            setTimeout(() => resolve(fallbackProfile), 3000)
          ),
        ]);
        if (isMounted) setUserProfile(profile);
        writeCachedProfile(profile);
        if (debugAuth) {
          console.debug("[auth] loadProfile:done", {
            uid: currentUser.uid,
            t: Math.round(performance.now() - bootStart),
          });
        }
      } catch (error) {
        console.warn("Failed to load user profile:", error);
        if (isMounted) setUserProfile(fallbackProfile);
      }
    };

    const initAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (error) {
        console.warn("Failed to set auth persistence:", error);
      }

      const bootTimeout = window.setTimeout(() => {
        if (isMounted) setLoading(false);
        if (debugAuth) {
          console.debug("[auth] boot:timeout", {
            t: Math.round(performance.now() - bootStart),
          });
        }
      }, authBootTimeoutMs);

      unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (!isMounted) return;
        window.clearTimeout(bootTimeout);
        setUser(currentUser);

        if (debugAuth) {
          console.debug("[auth] onAuthStateChanged", {
            hasUser: Boolean(currentUser),
            t: Math.round(performance.now() - bootStart),
          });
        }

        if (currentUser) {
          setHasSession(true);
          writeCachedSession(currentUser);
          const cachedProfile = readCachedProfile(currentUser.uid);
          if (cachedProfile && isMounted) setUserProfile(cachedProfile);
          if (isMounted) setLoading(false);
          void loadProfile(currentUser);
        } else {
          setUserProfile(null);
          clearCachedSession();
          if (isMounted) setLoading(false);
        }
      });
    };

    bootstrapSession();
    initAuth();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const register = async (email: string, password: string, name: string) => {
    await setPersistence(auth, browserLocalPersistence);
    if (debugAuth) console.debug("[auth] register:start");
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
    setUser(result.user);
    setHasSession(true);
    setLoading(false);
    writeCachedSession(result.user);
    await setDoc(doc(db, "users", result.user.uid), newProfile);
    setUserProfile(newProfile);
    writeCachedProfile(newProfile);
    if (debugAuth) console.debug("[auth] register:done");
  };

  const login = async (email: string, password: string) => {
    await setPersistence(auth, browserLocalPersistence);
    if (debugAuth) console.debug("[auth] login:start");
    const result = await signInWithEmailAndPassword(auth, email, password);
    setUser(result.user);
    setHasSession(true);
    writeCachedSession(result.user);
    const cachedProfile = readCachedProfile(result.user.uid);
    const fallbackProfile = buildFallbackProfile(result.user);
    setUserProfile(cachedProfile ?? fallbackProfile);
    writeCachedProfile(cachedProfile ?? fallbackProfile);
    setLoading(false);
    if (debugAuth) console.debug("[auth] login:done");
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    if (user) {
      clearCachedProfile(user.uid);
    }
    clearCachedSession();
    await signOut(auth);
    setUserProfile(null);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const docRef = doc(db, "users", user.uid);
    const updated = { ...userProfile, ...data } as UserProfile;
    await setDoc(docRef, updated, { merge: true });
    setUserProfile(updated);
    writeCachedProfile(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        hasSession,
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
