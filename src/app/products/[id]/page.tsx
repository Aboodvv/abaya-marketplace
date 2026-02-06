"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { products as localProducts } from "@/data/products";
import { useLanguage } from "@/context/LanguageContext";
import { useCart, Product } from "@/context/CartContext";

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { lang, t } = useLanguage();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const docRef = doc(db, "products", id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setProduct({ id: snapshot.id, ...(snapshot.data() as Omit<Product, "id">) });
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Failed to fetch product", error);
      }

      const local = localProducts.find((item) => item.id === id);
      setProduct(local || null);
      setLoading(false);
    };

    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center">
        <p className="text-gray-600">{t.common.loading}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 text-center border border-[#efe7da]">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {lang === "ar" ? "المنتج غير موجود" : "Product not found"}
          </h1>
          <Link
            href="/products"
            className="inline-flex px-6 py-3 bg-[#c7a86a] text-black rounded-full hover:bg-[#b59659]"
          >
            {t.products.title}
          </Link>
        </div>
      </div>
    );
  }

  const name = lang === "ar" ? product.nameAr : product.name;
  const description = lang === "ar" ? product.descriptionAr : product.description;
  const category = lang === "ar" ? product.categoryAr : product.category;

  return (
    <div className="min-h-screen bg-[#f7f4ef]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link
          href="/products"
          className="text-sm uppercase tracking-[0.3em] text-[#c7a86a] hover:underline"
        >
          {lang === "ar" ? "عودة للمنتجات" : "Back to products"}
        </Link>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="relative h-[480px] w-full rounded-3xl overflow-hidden shadow-xl border border-[#efe7da] bg-white">
            <Image
              src={product.image}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {!product.inStock && (
              <div className="absolute top-5 right-5 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                {t.products.outOfStock}
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#efe7da]">
            <p className="text-xs uppercase tracking-[0.3em] text-[#c7a86a] mb-2">
              {category}
            </p>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{name}</h1>
            <p className="text-gray-600 mb-6 leading-relaxed">{description}</p>

            <div className="flex items-center justify-between mb-6">
              <span className="text-3xl font-bold text-gray-900">${product.price}</span>
              <span className="text-sm uppercase tracking-[0.2em] text-[#c7a86a]">
                {product.inStock ? t.products.inStock : t.products.outOfStock}
              </span>
            </div>

            <button
              onClick={() => addToCart(product)}
              disabled={!product.inStock}
              className={`w-full py-4 rounded-full font-semibold text-lg transition ${
                product.inStock
                  ? "bg-[#c7a86a] text-black hover:bg-[#b59659]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {t.products.addToCart}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
