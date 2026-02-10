"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useAdminAccess } from "@/lib/adminAccess";

interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  active: boolean;
  usageLimit?: number | null;
  usageLimitPerCustomer?: number | null;
  allowedProductIds?: string[] | null;
  allowedCategories?: string[] | null;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt?: string;
}

type CouponForm = {
  code: string;
  type: "percent" | "fixed";
  value: string;
  active: boolean;
  usageLimit: string;
  usageLimitPerCustomer: string;
  allowedProductIds: string;
  allowedCategories: string;
  startsAt: string;
  endsAt: string;
};

const emptyForm: CouponForm = {
  code: "",
  type: "percent",
  value: "0",
  active: true,
  usageLimit: "",
  usageLimitPerCustomer: "",
  allowedProductIds: "",
  allowedCategories: "",
  startsAt: "",
  endsAt: "",
};

const splitList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const toDateInput = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

export default function AdminCouponsPage() {
  const { lang, t } = useLanguage();
  const { user, userProfile, loading: authLoading } = useAuth();
  const { canAccess, loading: accessLoading, hasPermission } = useAdminAccess(userProfile);
  const canManageCoupons = hasPermission("coupons");

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CouponForm>({ ...emptyForm });

  const loadCoupons = async () => {
    setLoading(true);
    const snapshot = await getDocs(collection(db, "coupons"));
    const list = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<Coupon, "id">),
    }));
    setCoupons(list);
    setLoading(false);
  };

  useEffect(() => {
    if (!canAccess || !canManageCoupons) return;
    loadCoupons();
  }, [canAccess, canManageCoupons]);

  const handleChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value),
      active: Boolean(form.active),
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      usageLimitPerCustomer: form.usageLimitPerCustomer
        ? Number(form.usageLimitPerCustomer)
        : null,
      allowedProductIds: splitList(form.allowedProductIds),
      allowedCategories: splitList(form.allowedCategories).map((item) => item.toLowerCase()),
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      updatedAt: new Date().toISOString(),
    };

    if (editingId) {
      await updateDoc(doc(db, "coupons", editingId), payload);
    } else {
      await addDoc(collection(db, "coupons"), {
        ...payload,
        createdAt: new Date().toISOString(),
      });
    }

    await loadCoupons();
    resetForm();
    setSaving(false);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      active: coupon.active,
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "",
      usageLimitPerCustomer: coupon.usageLimitPerCustomer
        ? String(coupon.usageLimitPerCustomer)
        : "",
      allowedProductIds: coupon.allowedProductIds?.join(", ") || "",
      allowedCategories: coupon.allowedCategories?.join(", ") || "",
      startsAt: toDateInput(coupon.startsAt),
      endsAt: toDateInput(coupon.endsAt),
    });
  };

  const handleDelete = async (couponId: string) => {
    await deleteDoc(doc(db, "coupons", couponId));
    await loadCoupons();
  };

  const sortedCoupons = useMemo(
    () => coupons.sort((a, b) => a.code.localeCompare(b.code)),
    [coupons]
  );

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
          <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{t.adminCoupons.title}</h1>
              <p className="text-gray-600 mt-2">{t.adminCoupons.subtitle}</p>
            </div>
            <Link
              href="/admin/coupons-usage"
              className="inline-flex px-5 py-2 rounded-full bg-[#c7a86a] text-black font-semibold hover:bg-[#b59659] transition"
            >
              {t.adminCoupons.usageReport}
            </Link>
          </div>
        </div>

        <form
          onSubmit={handleSave}
          className="bg-white rounded-3xl shadow-xl p-6 border border-[#efe7da] space-y-4 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              value={form.code}
              onChange={(event) => handleChange("code", event.target.value)}
              className="border border-[#efe7da] rounded-full px-4 py-3"
              placeholder={t.adminCoupons.code}
              required
            />
            <select
              value={form.type}
              onChange={(event) => handleChange("type", event.target.value)}
              className="border border-[#efe7da] rounded-full px-4 py-3"
            >
              <option value="percent">{t.adminCoupons.percent}</option>
              <option value="fixed">{t.adminCoupons.fixed}</option>
            </select>
            <input
              value={form.value}
              onChange={(event) => handleChange("value", event.target.value)}
              type="number"
              min="0"
              step="0.01"
              className="border border-[#efe7da] rounded-full px-4 py-3"
              placeholder={t.adminCoupons.value}
              required
            />
            <input
              value={form.usageLimit}
              onChange={(event) => handleChange("usageLimit", event.target.value)}
              type="number"
              min="0"
              className="border border-[#efe7da] rounded-full px-4 py-3"
              placeholder={t.adminCoupons.usageLimit}
            />
            <input
              value={form.usageLimitPerCustomer}
              onChange={(event) => handleChange("usageLimitPerCustomer", event.target.value)}
              type="number"
              min="0"
              className="border border-[#efe7da] rounded-full px-4 py-3"
              placeholder={t.adminCoupons.usageLimitPerCustomer}
            />
            <input
              value={form.allowedCategories}
              onChange={(event) => handleChange("allowedCategories", event.target.value)}
              className="border border-[#efe7da] rounded-full px-4 py-3 md:col-span-2"
              placeholder={t.adminCoupons.allowedCategories}
            />
            <input
              value={form.allowedProductIds}
              onChange={(event) => handleChange("allowedProductIds", event.target.value)}
              className="border border-[#efe7da] rounded-full px-4 py-3 md:col-span-2"
              placeholder={t.adminCoupons.allowedProductIds}
            />
            <input
              value={form.startsAt}
              onChange={(event) => handleChange("startsAt", event.target.value)}
              type="date"
              className="border border-[#efe7da] rounded-full px-4 py-3"
            />
            <input
              value={form.endsAt}
              onChange={(event) => handleChange("endsAt", event.target.value)}
              type="date"
              className="border border-[#efe7da] rounded-full px-4 py-3"
            />
            <label className="flex items-center gap-2 text-gray-700">
              <input
                type="checkbox"
                checked={Boolean(form.active)}
                onChange={(event) => handleChange("active", event.target.checked)}
              />
              {t.adminCoupons.active}
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className={`px-6 py-3 rounded-full font-semibold ${
                saving ? "bg-gray-300" : "bg-[#c7a86a] text-black hover:bg-[#b59659]"
              }`}
            >
              {editingId ? t.adminCoupons.update : t.adminCoupons.save}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 rounded-full bg-[#f7f4ef] hover:bg-[#efe7da]"
              >
                {t.adminCoupons.cancel}
              </button>
            )}
          </div>
        </form>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-[#efe7da]">
          {loading ? (
            <p className="text-gray-600">{t.common.loading}</p>
          ) : sortedCoupons.length === 0 ? (
            <p className="text-gray-600">{t.adminCoupons.empty}</p>
          ) : (
            <div className="space-y-4">
              {sortedCoupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="border border-[#efe7da] rounded-3xl p-4 flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-sm text-gray-500">{t.adminCoupons.code}</p>
                    <p className="font-semibold text-gray-900">{coupon.code}</p>
                    <p className="text-sm text-gray-600">
                      {coupon.type === "percent"
                        ? `${coupon.value}%`
                        : `${coupon.value} ${t.adminCoupons.currency}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t.adminCoupons.status}</p>
                    <p className="font-semibold text-gray-900">
                      {coupon.active ? t.adminCoupons.active : t.adminCoupons.inactive}
                    </p>
                    <p className="text-sm text-gray-600">
                      {t.adminCoupons.usageLimit}: {coupon.usageLimit ?? "-"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {t.adminCoupons.usageLimitPerCustomer}: {coupon.usageLimitPerCustomer ?? "-"}
                    </p>
                    {(coupon.allowedCategories?.length || coupon.allowedProductIds?.length) && (
                      <p className="text-sm text-gray-600">
                        {t.adminCoupons.restrictions}
                      </p>
                    )}
                    {coupon.allowedCategories?.length ? (
                      <p className="text-xs text-gray-500">
                        {t.adminCoupons.allowedCategories}: {coupon.allowedCategories.join(", ")}
                      </p>
                    ) : null}
                    {coupon.allowedProductIds?.length ? (
                      <p className="text-xs text-gray-500">
                        {t.adminCoupons.allowedProductIds}: {coupon.allowedProductIds.join(", ")}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(coupon)}
                      className="px-4 py-2 rounded-full bg-[#111] text-white hover:bg-black"
                    >
                      {t.adminCoupons.edit}
                    </button>
                    <button
                      onClick={() => handleDelete(coupon.id)}
                      className="px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700"
                    >
                      {t.adminCoupons.delete}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
