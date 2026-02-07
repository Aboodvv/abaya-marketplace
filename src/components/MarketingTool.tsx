"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLanguage } from "@/context/LanguageContext";

interface MarketingPhrase {
  text?: string;
  textAr?: string;
}

interface MarketingContent {
  headline?: string;
  headlineAr?: string;
  subtitle?: string;
  subtitleAr?: string;
  cta?: string;
  ctaAr?: string;
  ctaUrl?: string;
  phrases?: MarketingPhrase[];
}

export default function MarketingTool() {
  const { lang, dir, t } = useLanguage();
  const [content, setContent] = useState<MarketingContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const snapshot = await getDoc(doc(db, "settings", "marketingTool"));
        if (snapshot.exists()) {
          setContent(snapshot.data() as MarketingContent);
        }
      } catch (error) {
        console.error("Failed to load marketing tool", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const viewModel = useMemo(() => {
    const headline =
      lang === "ar"
        ? content?.headlineAr || t.marketingTool.headline
        : content?.headline || t.marketingTool.headline;
    const subtitle =
      lang === "ar"
        ? content?.subtitleAr || t.marketingTool.subtitle
        : content?.subtitle || t.marketingTool.subtitle;
    const cta =
      lang === "ar" ? content?.ctaAr || t.marketingTool.cta : content?.cta || t.marketingTool.cta;
    const ctaUrl = content?.ctaUrl || "/products";

    const resolvedPhrases =
      content?.phrases
        ?.map((phrase) =>
          lang === "ar" ? phrase.textAr || phrase.text || "" : phrase.text || phrase.textAr || ""
        )
        .filter(Boolean) || [];

    const phrases = resolvedPhrases.length > 0 ? resolvedPhrases : t.marketingTool.phrases;

    return { headline, subtitle, cta, ctaUrl, phrases };
  }, [content, lang, t.marketingTool]);

  useEffect(() => {
    if (viewModel.phrases.length <= 1) return;
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % viewModel.phrases.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [viewModel.phrases.length]);

  useEffect(() => {
    setPhraseIndex(0);
  }, [viewModel.phrases.length]);

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-12">
        <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10 border border-[#efe7da]">
          <p className="text-gray-600">{t.common.loading}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-12">
      <div className="rounded-3xl border border-[#efe7da] bg-gradient-to-br from-[#fff7ea] via-white to-[#f7f4ef] shadow-2xl p-6 md:p-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="max-w-2xl" dir={dir}>
            <p className="text-xs uppercase tracking-[0.3em] text-[#c7a86a] mb-3">
              {lang === "ar" ? "عروض سريعة" : "Fast Offers"}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              {viewModel.headline}
            </h2>
            <p className="text-gray-600 text-lg mb-5">{viewModel.subtitle}</p>
            <p
              key={`phrase-${phraseIndex}`}
              className="phrase-swap text-xl font-semibold text-gray-900"
            >
              {viewModel.phrases[phraseIndex]}
            </p>
          </div>
          <div className="flex flex-col items-start gap-4">
            <Link
              href={viewModel.ctaUrl}
              className="inline-flex items-center justify-center px-7 py-3 rounded-full bg-[#c7a86a] text-black font-semibold text-lg hover:bg-[#b59659] transition"
            >
              {viewModel.cta}
            </Link>
            <div className="flex items-center gap-2">
              {viewModel.phrases.map((_, index) => (
                <span
                  key={`dot-${index}`}
                  className={`h-2 w-2 rounded-full transition ${
                    index === phraseIndex ? "bg-[#c7a86a]" : "bg-[#e4d6bd]"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
