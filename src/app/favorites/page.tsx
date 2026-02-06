"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function FavoritesPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#f7f4ef] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-xl p-10 border border-[#efe7da] text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t.favorites.title}
          </h1>
          <p className="text-gray-600 mb-6">{t.favorites.empty}</p>
          <Link
            href="/products"
            className="inline-flex px-6 py-3 rounded-full bg-[#c7a86a] text-black font-semibold"
          >
            {t.favorites.cta}
          </Link>
        </div>
      </div>
    </div>
  );
}
