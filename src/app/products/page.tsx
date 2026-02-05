"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { products as localProducts } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/context/CartContext";

export default function ProductsPage() {
  const { t, lang } = useLanguage();
  const [products, setProducts] = useState<Product[]>(localProducts);
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [category, setCategory] = useState("all");

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

  const categories = Array.from(
    new Map(
      products
        .filter((p) => p.category)
        .map((p) => [p.category, { category: p.category, categoryAr: p.categoryAr }])
    ).values()
  );

  const filteredProducts = products.filter((product) => {
    const query = search.trim().toLowerCase();
    const name = `${product.name} ${product.nameAr} ${product.description} ${product.descriptionAr}`.toLowerCase();
    const matchesSearch = query.length === 0 || name.includes(query);
    const min = minPrice === "" ? null : Number(minPrice);
    const max = maxPrice === "" ? null : Number(maxPrice);
    const matchesMin = min === null || product.price >= min;
    const matchesMax = max === null || product.price <= max;
    const matchesStock = !inStockOnly || product.inStock;
    const matchesCategory = category === "all" || product.category === category;

    return matchesSearch && matchesMin && matchesMax && matchesStock && matchesCategory;
  });

  const handleClear = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
    setCategory("all");
  };

  return (
    <div className="min-h-screen bg-[#f7f4ef]">
      <div className="relative overflow-hidden bg-[#0b0b0b]">
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            {t.products.title}
          </h1>
          <p className="text-white/70 text-lg">
            {lang === "ar"
              ? "اختاري من مجموعتنا المميزة من العبايات"
              : "Shop the refined abaya collection"}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-10 border border-[#efe7da]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              {t.filters.title}
            </h2>
            <button
              onClick={handleClear}
              className="px-4 py-2 rounded-full bg-[#f7f4ef] text-gray-900 hover:bg-[#efe7da]"
            >
              {t.filters.clear}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.filters.search}
              className="border border-[#efe7da] rounded-full px-4 py-2 bg-white"
            />
            <input
              type="number"
              min="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder={t.filters.minPrice}
              className="border border-[#efe7da] rounded-full px-4 py-2 bg-white"
            />
            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder={t.filters.maxPrice}
              className="border border-[#efe7da] rounded-full px-4 py-2 bg-white"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border border-[#efe7da] rounded-full px-4 py-2 bg-white"
            >
              <option value="all">{t.filters.all}</option>
              {categories.map((cat) => (
                <option key={cat.category} value={cat.category}>
                  {lang === "ar" ? cat.categoryAr : cat.category}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between mt-4">
            <label className="flex items-center gap-2 text-gray-700">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
              />
              {t.filters.inStockOnly}
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
