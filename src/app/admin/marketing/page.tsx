"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useAdminAccess } from "@/lib/adminAccess";

interface MarketingPhraseForm {
  text: string;
  textAr: string;
}

interface MarketingForm {
  headline: string;
  headlineAr: string;
  subtitle: string;
  subtitleAr: string;
  cta: string;
  ctaAr: string;
  ctaUrl: string;
  phrases: MarketingPhraseForm[];
}

const emptyPhrases: MarketingPhraseForm[] = [
  { text: "", textAr: "" },
  { text: "", textAr: "" },
  { text: "", textAr: "" },
];

const emptyForm: MarketingForm = {
  headline: "",
  headlineAr: "",
  subtitle: "",
  subtitleAr: "",
  cta: "",
  ctaAr: "",
  ctaUrl: "",
  phrases: emptyPhrases,
};

export default function AdminMarketingPage() {
  const { lang, t } = useLanguage();
  const { user, userProfile, loading: authLoading } = useAuth();
  const { canAccess, loading: accessLoading, hasPermission } = useAdminAccess(userProfile);
  const canManageMarketing = hasPermission("marketing");
  const [form, setForm] = useState<MarketingForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!canAccess || !canManageMarketing) return;
    const load = async () => {
      try {
        const snapshot = await getDoc(doc(db, "settings", "marketingTool"));
        if (snapshot.exists()) {
          const data = snapshot.data() as Partial<MarketingForm>;
          setForm({
            ...emptyForm,
            ...data,
            phrases: data.phrases?.length ? data.phrases : emptyPhrases,
          });
        }
      } catch (error) {
        console.error("Failed to load marketing tool", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [canAccess, canManageMarketing]);

  const handleChange = (field: keyof MarketingForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePhraseChange = (index: number, field: keyof MarketingPhraseForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      phrases: prev.phrases.map((phrase, idx) =>
        idx === index ? { ...phrase, [field]: value } : phrase
      ),
    }));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "marketingTool"), {
        ...form,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to save marketing tool", error);
    } finally {
      setSaving(false);
    }
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

  if (!canAccess || !canManageMarketing) {
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-sm uppercase tracking-[0.3em] text-[#c7a86a] hover:underline"
          >
            {t.adminMarketing.backToAdmin}
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mt-4">{t.adminMarketing.title}</h1>
          <p className="text-gray-600 mt-2">{t.adminMarketing.subtitle}</p>
        </div>

        <form
          onSubmit={handleSave}
          className="bg-white rounded-3xl shadow-xl p-6 border border-[#efe7da] space-y-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              value={form.headline}
              onChange={(event) => handleChange("headline", event.target.value)}
              className="w-full border border-[#efe7da] rounded-full px-4 py-3"
              placeholder={t.adminMarketing.headlineEn}
            />
            <input
              value={form.headlineAr}
              onChange={(event) => handleChange("headlineAr", event.target.value)}
              className="w-full border border-[#efe7da] rounded-full px-4 py-3"
              placeholder={t.adminMarketing.headlineAr}
            />
            <input
              value={form.subtitle}
              onChange={(event) => handleChange("subtitle", event.target.value)}
              className="w-full border border-[#efe7da] rounded-full px-4 py-3 md:col-span-2"
              placeholder={t.adminMarketing.subtitleEn}
            />
            <input
              value={form.subtitleAr}
              onChange={(event) => handleChange("subtitleAr", event.target.value)}
              className="w-full border border-[#efe7da] rounded-full px-4 py-3 md:col-span-2"
              placeholder={t.adminMarketing.subtitleAr}
            />
            <input
              value={form.cta}
              onChange={(event) => handleChange("cta", event.target.value)}
              className="w-full border border-[#efe7da] rounded-full px-4 py-3"
              placeholder={t.adminMarketing.ctaEn}
            />
            <input
              value={form.ctaAr}
              onChange={(event) => handleChange("ctaAr", event.target.value)}
              className="w-full border border-[#efe7da] rounded-full px-4 py-3"
              placeholder={t.adminMarketing.ctaAr}
            />
            <input
              value={form.ctaUrl}
              onChange={(event) => handleChange("ctaUrl", event.target.value)}
              className="w-full border border-[#efe7da] rounded-full px-4 py-3 md:col-span-2"
              placeholder={t.adminMarketing.ctaUrl}
            />
          </div>

          <div className="space-y-4">
            {form.phrases.map((phrase, index) => (
              <div key={`phrase-${index}`} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={phrase.text}
                  onChange={(event) => handlePhraseChange(index, "text", event.target.value)}
                  className="w-full border border-[#efe7da] rounded-full px-4 py-3"
                  placeholder={`${t.adminMarketing.phraseEn} #${index + 1}`}
                />
                <input
                  value={phrase.textAr}
                  onChange={(event) => handlePhraseChange(index, "textAr", event.target.value)}
                  className="w-full border border-[#efe7da] rounded-full px-4 py-3"
                  placeholder={`${t.adminMarketing.phraseAr} #${index + 1}`}
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={saving}
            className={`w-full px-6 py-3 rounded-full font-semibold transition ${
              saving ? "bg-gray-300" : "bg-[#c7a86a] text-black hover:bg-[#b59659]"
            }`}
          >
            {saving ? t.adminMarketing.saving : t.adminMarketing.save}
          </button>
        </form>
      </div>
    </div>
  );
}
