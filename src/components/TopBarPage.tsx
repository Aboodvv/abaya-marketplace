"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLanguage } from "@/context/LanguageContext";

export type TopBarPageKey =
  | "explore"
  | "abayas"
  | "fabrics"
  | "delivery"
  | "categories"
  | "coloredAbayas"
  | "eveningAbayas"
  | "formalAbayas"
  | "dresses";

interface TopBarPageContent {
  title?: string;
  titleAr?: string;
  subtitle?: string;
  subtitleAr?: string;
  cta?: string;
  ctaAr?: string;
  ctaUrl?: string;
  image?: string;
}

export default function TopBarPage({ pageKey }: { pageKey: TopBarPageKey }) {
  const { lang, dir, t } = useLanguage();
  const [content, setContent] = useState<TopBarPageContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const snapshot = await getDoc(doc(db, "pages", pageKey));
        if (snapshot.exists()) {
          setContent(snapshot.data() as TopBarPageContent);
        }
      } catch (error) {
        console.error("Failed to load page content", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [pageKey]);

  const viewModel = useMemo(() => {
    const fallback = t.topPages[pageKey];
    return {
      title: lang === "ar" ? content?.titleAr || fallback.title : content?.title || fallback.title,
      subtitle:
        lang === "ar"
          ? content?.subtitleAr || fallback.subtitle
          : content?.subtitle || fallback.subtitle,
      cta: lang === "ar" ? content?.ctaAr || fallback.cta : content?.cta || fallback.cta,
      ctaUrl: content?.ctaUrl || "/products",
      image: content?.image || "",
    };
  }, [content, lang, pageKey, t.topPages]);

  return (
    <div className="min-h-screen bg-[#f7f4ef] py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="bg-white rounded-3xl shadow-xl p-10 border border-[#efe7da]">
            <p className="text-gray-600">{t.common.loading}</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl border border-[#efe7da] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-10 flex flex-col justify-center">
                <p className="text-xs uppercase tracking-[0.3em] text-[#c7a86a] mb-3">
                  {viewModel.title}
                </p>
                <h1 className="text-4xl font-bold text-gray-900 mb-4" dir={dir}>
                  {viewModel.title}
                </h1>
                <p className="text-gray-600 text-lg" dir={dir}>
                  {viewModel.subtitle}
                </p>
                <div className="mt-6">
                  <Link
                    href={viewModel.ctaUrl}
                    className="inline-flex px-6 py-3 rounded-full bg-[#c7a86a] text-black font-semibold hover:bg-[#b59659] transition"
                  >
                    {viewModel.cta}
                  </Link>
                </div>
              </div>
              <div className="relative min-h-[240px]">
                {viewModel.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={viewModel.image}
                    alt={viewModel.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-[#f5e6c7] via-[#f9f4ea] to-[#e6d2a6]" />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
