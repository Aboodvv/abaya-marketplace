"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useAdminAccess } from "@/lib/adminAccess";

interface ShippingSettings {
  enabled: boolean;
  flatRate: number;
  freeThreshold: number;
  estimatedDays: string;
  note: string;
}

const emptySettings: ShippingSettings = {
  enabled: true,
  flatRate: 25,
  freeThreshold: 299,
  estimatedDays: "1-3",
  note: "",
};

export default function AdminShippingPage() {
  const { lang, t } = useLanguage();
  const { user, userProfile, loading: authLoading } = useAuth();
  const { canAccess, loading: accessLoading, hasPermission } = useAdminAccess(userProfile);
  const canManageShipping = hasPermission("shipping");

  const [form, setForm] = useState<ShippingSettings>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!canAccess || !canManageShipping) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/shipping");
        const data = await res.json();
        setForm({ ...emptySettings, ...data });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [canAccess, canManageShipping]);

  const handleChange = (field: keyof ShippingSettings, value: string | boolean) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    await fetch("/api/admin/shipping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        flatRate: Number(form.flatRate),
        freeThreshold: Number(form.freeThreshold),
        updatedAt: new Date().toISOString(),
      }),
    });
    setSaving(false);
  };

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

  if (!canAccess || !canManageShipping) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center">
        <p className="text-gray-600">{t.common.loading}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ef] py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-sm uppercase tracking-[0.3em] text-[#c7a86a] hover:underline"
          >
            {t.adminShipping.backToAdmin}
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mt-4">{t.adminShipping.title}</h1>
          <p className="text-gray-600 mt-2">{t.adminShipping.subtitle}</p>
        </div>

        <form
          onSubmit={handleSave}
          className="bg-white rounded-3xl shadow-xl p-6 border border-[#efe7da] space-y-4"
        >
          <label className="flex items-center gap-2 text-gray-700">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(event) => handleChange("enabled", event.target.checked)}
            />
            {t.adminShipping.enabled}
          </label>
          <input
            value={form.flatRate}
            onChange={(event) => handleChange("flatRate", event.target.value)}
            type="number"
            min="0"
            step="0.01"
            className="border border-[#efe7da] rounded-full px-4 py-3"
            placeholder={t.adminShipping.flatRate}
          />
          <input
            value={form.freeThreshold}
            onChange={(event) => handleChange("freeThreshold", event.target.value)}
            type="number"
            min="0"
            step="0.01"
            className="border border-[#efe7da] rounded-full px-4 py-3"
            placeholder={t.adminShipping.freeThreshold}
          />
          <input
            value={form.estimatedDays}
            onChange={(event) => handleChange("estimatedDays", event.target.value)}
            className="border border-[#efe7da] rounded-full px-4 py-3"
            placeholder={t.adminShipping.estimatedDays}
          />
          <textarea
            value={form.note}
            onChange={(event) => handleChange("note", event.target.value)}
            className="border border-[#efe7da] rounded-3xl px-4 py-3"
            placeholder={t.adminShipping.note}
            rows={3}
          />
          <button
            type="submit"
            disabled={saving}
            className={`px-6 py-3 rounded-full font-semibold ${
              saving ? "bg-gray-300" : "bg-[#c7a86a] text-black hover:bg-[#b59659]"
            }`}
          >
            {saving ? t.adminShipping.saving : t.adminShipping.save}
          </button>
        </form>
      </div>
    </div>
  );
}
