"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { products as localProducts } from "@/data/products";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/context/CartContext";
import ProductCard from "@/components/ProductCard";

export default function OffersPage() {
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

  const offersProducts = useMemo(
    () =>
      products.filter(
        (product) => product.category === "offers" || product.categoryAr === "عروض"
      ),
    [products]
  );

  return (
    <div className="min-h-screen bg-[#f7f4ef] py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-[#c7a86a] mb-2">
            {lang === "ar" ? "عروض خاصة" : "Special Offers"}
          </p>
          <h1 className="text-4xl font-bold text-gray-900">{t.offers.title}</h1>
        </div>

        {offersProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-[#efe7da]">
            <p className="text-gray-600">{t.offers.empty}</p>
            <Link
              href="/products"
              className="inline-flex mt-4 px-5 py-2 rounded-full bg-[#c7a86a] text-black font-semibold"
            >
              {t.products.title}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {offersProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
