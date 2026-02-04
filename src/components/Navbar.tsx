"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { ShoppingCart } from "lucide-react";

export default function Navbar() {
  const { lang, setLang, t, dir } = useLanguage();
  const { totalItems } = useCart();

  const toggleLang = () => {
    setLang(lang === "en" ? "ar" : "en");
  };

  return (
    <nav className="bg-gray-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className={`flex items-center gap-8 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
            <Link href="/" className="text-2xl font-bold hover:text-gray-300">
              {lang === "ar" ? "متجر العبايات" : "Abaya Store"}
            </Link>
            <div className={`flex gap-6 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
              <Link href="/" className="hover:text-gray-300 transition">
                {t.nav.home}
              </Link>
              <Link href="/products" className="hover:text-gray-300 transition">
                {t.nav.products}
              </Link>
              <Link href="/cart" className="hover:text-gray-300 transition flex items-center gap-2">
                <ShoppingCart size={20} />
                {t.nav.cart}
                {totalItems > 0 && (
                  <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">
                    {totalItems}
                  </span>
                )}
              </Link>
              <Link href="/login" className="hover:text-gray-300 transition">
                {t.nav.login}
              </Link>
            </div>
          </div>
          <button
            onClick={toggleLang}
            className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition font-medium"
          >
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </div>
    </nav>
  );
}
