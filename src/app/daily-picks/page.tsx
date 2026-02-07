"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { products as localProducts } from "@/data/products";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/context/CartContext";
import ProductCard from "@/components/ProductCard";

const dailyPickIds = ["1", "3", "7", "2", "5", "8"];

type ProductWithFlags = Product & {
  isDailyPick?: boolean;
  dailyPick?: boolean;
};

export default function DailyPicksPage() {
  const { t, lang } = useLanguage();
  const { totalItems } = useCart();
  const [products, setProducts] = useState<Product[]>(localProducts);
  const freeDeliveryTarget = 3;
  const remainingForFreeDelivery = Math.max(0, freeDeliveryTarget - totalItems);
  const progressPercent = Math.min(100, (totalItems / freeDeliveryTarget) * 100);

  useEffect(() => {
    const fetchProducts = async () => {
      const snapshot = await getDocs(collection(db, "products"));
      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Product, "id">),
      }));
      if (list.length > 0) {
        setProducts(list);
      }
    };

    fetchProducts();
  }, []);

  const dailyPicks = useMemo(() => {
    const flagged = (products as ProductWithFlags[]).filter(
      (product) => product.isDailyPick || product.dailyPick
    );
    if (flagged.length > 0) {
      return flagged;
    }

    const byId = products.filter((product) => dailyPickIds.includes(product.id));
    if (byId.length > 0) {
      return byId;
    }

    return products.slice(0, 6);
  }, [products]);

  return (
    <div className="min-h-screen bg-[#f7f4ef] py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-[#c7a86a] mb-2">
            {lang === "ar" ? "مختارة اليوم" : "Today\'s Edit"}
          </p>
          <h1 className="text-4xl font-bold text-gray-900">
            {t.dailyPick.title}
          </h1>
          <p className="text-gray-600 mt-2">{t.dailyPick.subtitle}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 border border-[#efe7da]">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="text-sm font-semibold text-gray-900">
              {t.dailyPick.freeDeliveryTitle}
            </p>
            <span className="text-sm text-gray-600">{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-3 rounded-full bg-[#f7f4ef] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#c7a86a] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-gray-600">
            {remainingForFreeDelivery === 0
              ? t.dailyPick.freeDeliveryUnlocked
              : t.dailyPick.freeDeliveryRemaining.replace(
                  "{count}",
                  String(remainingForFreeDelivery)
                )}
          </p>
        </div>

        {dailyPicks.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-[#efe7da]">
            <p className="text-gray-600">{t.dailyPick.empty}</p>
            <Link
              href="/products"
              className="inline-flex mt-4 px-5 py-2 rounded-full bg-[#c7a86a] text-black font-semibold"
            >
              {t.products.title}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {dailyPicks.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
