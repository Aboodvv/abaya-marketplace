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
import ProductCard from "@/components/ProductCard";

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
  const relatedProducts = localProducts
    .filter((item) => item.id !== product.id)
    .filter((item) => item.category === product.category)
    .slice(0, 3);
  const fallbackProducts = localProducts.filter((item) => item.id !== product.id).slice(0, 3);

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
          <div>
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
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[0, 1, 2].map((index) => (
                <div
                  key={`${product.id}-thumb-${index}`}
                  className="relative h-28 w-full rounded-2xl overflow-hidden border border-[#efe7da] bg-white"
                >
                  <Image
                    src={product.image}
                    alt={name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 33vw, 25vw"
                  />
                </div>
              ))}
            </div>
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

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[#efe7da] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#c7a86a] mb-2">
                  {lang === "ar" ? "الخامة" : "Fabric"}
                </p>
                <p className="text-gray-700">
                  {lang === "ar"
                    ? "قماش فاخر مع لمسات ناعمة وانسيابية."
                    : "Premium fabric with a soft, flowing finish."}
                </p>
              </div>
              <div className="rounded-2xl border border-[#efe7da] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#c7a86a] mb-2">
                  {lang === "ar" ? "العناية" : "Care"}
                </p>
                <p className="text-gray-700">
                  {lang === "ar"
                    ? "تنظيف جاف للحفاظ على الجودة والشكل."
                    : "Dry clean recommended to preserve quality."}
                </p>
              </div>
              <div className="rounded-2xl border border-[#efe7da] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#c7a86a] mb-2">
                  {lang === "ar" ? "الشحن" : "Shipping"}
                </p>
                <p className="text-gray-700">
                  {lang === "ar"
                    ? "توصيل سريع خلال 2-4 أيام عمل."
                    : "Fast delivery within 2-4 business days."}
                </p>
              </div>
              <div className="rounded-2xl border border-[#efe7da] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#c7a86a] mb-2">
                  {lang === "ar" ? "الإرجاع" : "Returns"}
                </p>
                <p className="text-gray-700">
                  {lang === "ar"
                    ? "إرجاع خلال 7 أيام بحالتها الأصلية."
                    : "Returns accepted within 7 days."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              {lang === "ar" ? "منتجات مشابهة" : "You may also like"}
            </h2>
            <Link
              href="/products"
              className="text-[#c7a86a] font-semibold hover:underline"
            >
              {t.products.title}
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(relatedProducts.length > 0 ? relatedProducts : fallbackProducts).map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
