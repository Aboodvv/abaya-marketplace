"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useAdminAccess } from "@/lib/adminAccess";

interface CouponUsageEntry {
  id: string;
  couponId: string;
  userId: string;
  usageCount: number;
  updatedAt?: string;
}

interface CouponEntry {
  id: string;
  code: string;
}

interface UserEntry {
  id: string;
  email?: string;
  name?: string;
}

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export default function AdminCouponsUsagePage() {
  const { lang, t } = useLanguage();
  const { user, userProfile, loading: authLoading } = useAuth();
  const { canAccess, loading: accessLoading, hasPermission } = useAdminAccess(userProfile);
  const canManageCoupons = hasPermission("coupons");

  const [entries, setEntries] = useState<CouponUsageEntry[]>([]);
  const [coupons, setCoupons] = useState<Record<string, CouponEntry>>({});
  const [users, setUsers] = useState<Record<string, UserEntry>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!canAccess || !canManageCoupons) return;
    const load = async () => {
      setLoading(true);
      const [usageSnap, couponsSnap, usersSnap] = await Promise.all([
        getDocs(query(collection(db, "couponUsage"), orderBy("updatedAt", "desc"))),
        getDocs(collection(db, "coupons")),
        getDocs(collection(db, "users")),
      ]);

      const usageList = usageSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<CouponUsageEntry, "id">),
      }));
      const couponMap: Record<string, CouponEntry> = {};
      couponsSnap.docs.forEach((docSnap) => {
        const data = docSnap.data() as CouponEntry;
        couponMap[docSnap.id] = { id: docSnap.id, code: data.code };
      });
      const userMap: Record<string, UserEntry> = {};
      usersSnap.docs.forEach((docSnap) => {
        const data = docSnap.data() as UserEntry;
        userMap[docSnap.id] = { id: docSnap.id, email: data.email, name: data.name };
      });

      setEntries(usageList);
      setCoupons(couponMap);
      setUsers(userMap);
      setLoading(false);
    };

    load();
  }, [canAccess, canManageCoupons]);

  if (authLoading || accessLoading) {
    return (
      <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center">
        <p className="text-gray-600">{t.common.loading}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#efe7da] text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {lang === "ar" ? "تسجيل الدخول مطلوب" : "Login required"}
          </h1>
          <p className="text-gray-600 mb-6">
            {lang === "ar" ? "يجب تسجيل الدخول للوصول للإدارة." : "Please log in to access admin."}
          </p>
          <Link
            href="/login"
            className="inline-flex px-6 py-3 rounded-full bg-[#c7a86a] text-black font-semibold"
          >
            {t.nav.login}
          </Link>
        </div>
      </div>
    );
  }

  if (!canAccess || !canManageCoupons) {
    return (
      <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#efe7da] text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {lang === "ar" ? "غير مصرح" : "Access denied"}
          </h1>
          <p className="text-gray-600 mb-6">
            {lang === "ar"
              ? "ليس لديك صلاحية للوصول إلى لوحة الإدارة."
              : "You do not have permission to access the admin panel."}
          </p>
        </div>
      </div>
    );
  }

  const filteredEntries = entries.filter((entry) => {
    const queryText = search.trim().toLowerCase();
    if (!queryText) return true;
    const couponCode = coupons[entry.couponId]?.code?.toLowerCase() || "";
    const user = users[entry.userId];
    const email = user?.email?.toLowerCase() || "";
    const name = user?.name?.toLowerCase() || "";
    return (
      entry.couponId.toLowerCase().includes(queryText) ||
      entry.userId.toLowerCase().includes(queryText) ||
      couponCode.includes(queryText) ||
      email.includes(queryText) ||
      name.includes(queryText)
    );
  });

  return (
    <div className="min-h-screen bg-[#f7f4ef] py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-sm uppercase tracking-[0.3em] text-[#c7a86a] hover:underline"
          >
            {t.adminCoupons.backToAdmin}
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mt-4">
            {t.adminCoupons.usageReport}
          </h1>
          <p className="text-gray-600 mt-2">{t.adminCoupons.usageReportSubtitle}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-[#efe7da] mb-6">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t.adminCoupons.usageReportSearch}
            className="border border-[#efe7da] rounded-full px-4 py-2 w-full md:w-96"
          />
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-[#efe7da]">
          {loading ? (
            <p className="text-gray-600">{t.common.loading}</p>
          ) : filteredEntries.length === 0 ? (
            <p className="text-gray-600">{t.adminCoupons.usageReportEmpty}</p>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map((entry) => {
                const coupon = coupons[entry.couponId];
                const user = users[entry.userId];
                return (
                  <div
                    key={entry.id}
                    className="border border-[#efe7da] rounded-3xl p-4 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm text-gray-500">{t.adminCoupons.code}</p>
                      <p className="font-semibold text-gray-900">
                        {coupon?.code || entry.couponId}
                      </p>
                      <p className="text-xs text-gray-500">{entry.couponId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t.adminCoupons.usageReportUser}</p>
                      <p className="font-semibold text-gray-900">{user?.name || entry.userId}</p>
                      <p className="text-xs text-gray-500">{user?.email || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t.adminCoupons.usageReportCount}</p>
                      <p className="font-semibold text-gray-900">{entry.usageCount || 0}</p>
                      <p className="text-xs text-gray-500">
                        {t.adminCoupons.usageReportUpdated}: {formatDate(entry.updatedAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
