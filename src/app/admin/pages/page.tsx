"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { isAdminUser } from "@/lib/admin";
import { translations } from "@/i18n/translations";
import type { TopBarPageKey } from "@/components/TopBarPage";

interface PageForm {
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  cta: string;
  ctaAr: string;
  ctaUrl: string;
  image: string;
}

const emptyForm: PageForm = {
  title: "",
  titleAr: "",
  subtitle: "",
  subtitleAr: "",
  cta: "",
  ctaAr: "",
  ctaUrl: "",
  image: "",
};

const pageKeys: TopBarPageKey[] = [
  "explore",
  "abayas",
  "fabrics",
  "delivery",
  "categories",
  "coloredAbayas",
  "eveningAbayas",
  "formalAbayas",
  "dresses",
];

export default function AdminPagesPage() {
  const { lang, t } = useLanguage();
  const { user, userProfile, loading: authLoading } = useAuth();
  const isAdmin = isAdminUser(userProfile);
  const [pages, setPages] = useState<Record<TopBarPageKey, PageForm>>(() => ({
    explore: { ...emptyForm },
    abayas: { ...emptyForm },
    fabrics: { ...emptyForm },
    delivery: { ...emptyForm },
    categories: { ...emptyForm },
    coloredAbayas: { ...emptyForm },
    eveningAbayas: { ...emptyForm },
    formalAbayas: { ...emptyForm },
    dresses: { ...emptyForm },
  }));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      try {
        const entries = await Promise.all(
          pageKeys.map(async (key) => {
            const snapshot = await getDoc(doc(db, "pages", key));
            return [key, snapshot.exists() ? (snapshot.data() as Partial<PageForm>) : {}] as const;
          })
        );
        setPages((prev) => {
          const next = { ...prev };
          entries.forEach(([key, data]) => {
            next[key] = { ...emptyForm, ...data } as PageForm;
          });
          return next;
        });
      } catch (error) {
        console.error("Failed to load top bar pages", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAdmin]);

  const handleChange = (key: TopBarPageKey, field: keyof PageForm, value: string) => {
    setPages((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await Promise.all(
        pageKeys.map((key) =>
          setDoc(doc(db, "pages", key), {
            ...pages[key],
            updatedAt: new Date().toISOString(),
          })
        )
      );
    } catch (error) {
      console.error("Failed to save top bar pages", error);
    } finally {
      setSaving(false);
    }
  };

  const placeholders = useMemo(
    () => ({
      en: translations.en.topPages,
      ar: translations.ar.topPages,
    }),
    []
  );

  if (authLoading) {
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

  if (!isAdmin) {
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
            {t.adminPages.backToAdmin}
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mt-4">{t.adminPages.title}</h1>
          <p className="text-gray-600 mt-2">{t.adminPages.subtitle}</p>
        </div>

        <form
          onSubmit={handleSave}
          className="bg-white rounded-3xl shadow-xl p-6 border border-[#efe7da] space-y-8"
        >
          {pageKeys.map((key) => (
            <div key={key} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {t.adminPages.pageLabel}: {t.topPages[key].title}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={pages[key].title}
                  onChange={(event) => handleChange(key, "title", event.target.value)}
                  className="w-full border border-[#efe7da] rounded-full px-4 py-3"
                  placeholder={placeholders.en[key].title}
                />
                <input
                  value={pages[key].titleAr}
                  onChange={(event) => handleChange(key, "titleAr", event.target.value)}
                  className="w-full border border-[#efe7da] rounded-full px-4 py-3"
                  placeholder={placeholders.ar[key].title}
                />
                <input
                  value={pages[key].subtitle}
                  onChange={(event) => handleChange(key, "subtitle", event.target.value)}
                  className="w-full border border-[#efe7da] rounded-full px-4 py-3 md:col-span-2"
                  placeholder={placeholders.en[key].subtitle}
                />
                <input
                  value={pages[key].subtitleAr}
                  onChange={(event) => handleChange(key, "subtitleAr", event.target.value)}
                  className="w-full border border-[#efe7da] rounded-full px-4 py-3 md:col-span-2"
                  placeholder={placeholders.ar[key].subtitle}
                />
                <input
                  value={pages[key].cta}
                  onChange={(event) => handleChange(key, "cta", event.target.value)}
                  className="w-full border border-[#efe7da] rounded-full px-4 py-3"
                  placeholder={placeholders.en[key].cta}
                />
                <input
                  value={pages[key].ctaAr}
                  onChange={(event) => handleChange(key, "ctaAr", event.target.value)}
                  className="w-full border border-[#efe7da] rounded-full px-4 py-3"
                  placeholder={placeholders.ar[key].cta}
                />
                <input
                  value={pages[key].ctaUrl}
                  onChange={(event) => handleChange(key, "ctaUrl", event.target.value)}
                  className="w-full border border-[#efe7da] rounded-full px-4 py-3"
                  placeholder={t.adminPages.ctaUrl}
                />
                <input
                  value={pages[key].image}
                  onChange={(event) => handleChange(key, "image", event.target.value)}
                  className="w-full border border-[#efe7da] rounded-full px-4 py-3"
                  placeholder={t.adminPages.imageUrl}
                />
              </div>
            </div>
          ))}

          <button
            type="submit"
            disabled={saving}
            className={`w-full px-6 py-3 rounded-full font-semibold transition ${
              saving ? "bg-gray-300" : "bg-[#c7a86a] text-black hover:bg-[#b59659]"
            }`}
          >
            {saving ? t.adminPages.saving : t.adminPages.save}
          </button>
        </form>
      </div>
    </div>
  );
}
