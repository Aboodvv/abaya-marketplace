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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-10 text-center">
          {t.products.title}
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {t.filters.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.filters.search}
              className="border rounded-lg px-4 py-2"
            />
            <input
              type="number"
              min="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder={t.filters.minPrice}
              className="border rounded-lg px-4 py-2"
            />
            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder={t.filters.maxPrice}
              className="border rounded-lg px-4 py-2"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border rounded-lg px-4 py-2"
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
            <button
              onClick={handleClear}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
            >
              {t.filters.clear}
            </button>
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
