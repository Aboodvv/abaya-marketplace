"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { products as localProducts } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/context/CartContext";

export default function Home() {
  const { t, lang } = useLanguage();
  const [products, setProducts] = useState<Product[]>(localProducts);

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

  const featuredProducts = products.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#f7f4ef] text-[#1a1a1a]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-black/55" />
          <div
            className="h-full w-full bg-cover bg-center"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=2400&auto=format&fit=crop)",
            }}
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 md:py-36">
          <div className="max-w-2xl">
            <p className="uppercase tracking-[0.3em] text-[#c7a86a] text-sm mb-4">
              {lang === "ar" ? "مجموعة فاخرة" : "Luxury Collection"}
            </p>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              {t.home.hero.title}
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-8">
              {t.home.hero.subtitle}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#c7a86a] text-black rounded-full font-semibold text-lg hover:bg-[#b59659] transition"
              >
                {t.home.hero.cta}
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-8 py-4 border border-white/40 text-white rounded-full font-semibold text-lg hover:border-[#c7a86a] hover:text-[#c7a86a] transition"
              >
                {t.products.title}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Banners */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 pb-12">
        <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              {t.home.banners.title}
            </h2>
            <Link
              href="/products"
              className="text-[#c7a86a] font-semibold hover:underline"
            >
              {t.products.title}
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {t.home.banners.items.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className="group rounded-2xl border border-[#eee4d6] bg-gradient-to-br from-white to-[#f7f4ef] p-6 hover:shadow-lg transition"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-[#c7a86a] mb-3">
                  {index === 0 ? "NEW" : index === 1 ? "PREMIUM" : "SECURE"}
                </p>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 mb-4">{item.subtitle}</p>
                <Link
                  href={item.href}
                  className="inline-flex items-center text-gray-900 font-semibold group-hover:text-[#c7a86a]"
                >
                  {item.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-4xl font-bold text-gray-900">{t.home.featured}</h2>
          <Link
            href="/products"
            className="text-[#c7a86a] font-semibold hover:underline"
          >
            {t.products.title}
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}

