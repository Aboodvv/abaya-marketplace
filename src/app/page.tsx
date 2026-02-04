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
  const { t } = useLanguage();
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            {t.home.hero.title}
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-300">
            {t.home.hero.subtitle}
          </p>
          <Link
            href="/products"
            className="inline-block px-8 py-4 bg-white text-gray-900 rounded-lg font-semibold text-lg hover:bg-gray-100 transition"
          >
            {t.home.hero.cta}
          </Link>
        </div>
      </section>

      {/* Banners */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 pb-10">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              {t.home.banners.title}
            </h2>
            <Link
              href="/products"
              className="text-gray-900 font-semibold hover:underline"
            >
              {t.products.title}
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {t.home.banners.items.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className="group rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 hover:shadow-lg transition"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 mb-4">{item.subtitle}</p>
                <Link
                  href={item.href}
                  className="inline-flex items-center text-gray-900 font-semibold group-hover:underline"
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
        <h2 className="text-4xl font-bold text-gray-900 mb-10 text-center">
          {t.home.featured}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="text-center mt-12">
          <Link
            href="/products"
            className="inline-block px-8 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition"
          >
            {t.products.title}
          </Link>
        </div>
      </section>
    </div>
  );
}

