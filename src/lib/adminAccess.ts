"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/context/AuthContext";
import { isAdminUser } from "@/lib/admin";

export type AdminPermission =
  | "owner"
  | "products"
  | "orders"
  | "inventory"
  | "coupons"
  | "customers"
  | "shipping"
  | "pages"
  | "marketing"
  | "banners"
  | "sellers"
  | "withdrawals"
  | "roles";

export const ADMIN_PERMISSION_OPTIONS: Exclude<AdminPermission, "owner">[] = [
  "products",
  "orders",
  "inventory",
  "coupons",
  "customers",
  "shipping",
  "pages",
  "marketing",
  "banners",
  "sellers",
  "withdrawals",
  "roles",
];

interface AdminRoleDoc {
  roles?: AdminPermission[];
}

export const useAdminAccess = (userProfile: UserProfile | null) => {
  const [roles, setRoles] = useState<AdminPermission[]>([]);
  const [loading, setLoading] = useState(true);

  const email = userProfile?.email?.toLowerCase() || "";
  const isOwner = Boolean(userProfile && isAdminUser(userProfile));

  useEffect(() => {
    let isMounted = true;

    const loadRoles = async () => {
      if (!email) {
        if (isMounted) {
          setRoles([]);
          setLoading(false);
        }
        return;
      }

      if (isOwner) {
        if (isMounted) {
          setRoles(["owner"]);
          setLoading(false);
        }
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, "adminRoles", email));
        const data = snapshot.exists() ? (snapshot.data() as AdminRoleDoc) : null;
        if (isMounted) {
          setRoles(Array.isArray(data?.roles) ? data?.roles || [] : []);
        }
      } catch (error) {
        console.error("Failed to load admin roles", error);
        if (isMounted) setRoles([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    setLoading(true);
    loadRoles();

    return () => {
      isMounted = false;
    };
  }, [email, isOwner]);

  const roleSet = useMemo(() => new Set(roles), [roles]);
  const hasPermission = (permission: AdminPermission) =>
    isOwner || roleSet.has("owner") || roleSet.has(permission);

  return {
    isOwner,
    roles,
    loading,
    canAccess: isOwner || roles.length > 0,
    hasPermission,
  };
};
