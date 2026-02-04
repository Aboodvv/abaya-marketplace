"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationsContext";
import { ShoppingCart, LogOut, User, Bell } from "lucide-react";

export default function Navbar() {
  const { lang, setLang, t, dir } = useLanguage();
  const { totalItems } = useCart();
  const { user, userProfile, logout, loading } = useAuth();
  const { unreadCount, loadNotifications } = useNotifications();

  const toggleLang = () => {
    setLang(lang === "en" ? "ar" : "en");
  };

  const handleLogout = async () => {
    await logout();
  };

  useEffect(() => {
    if (user) {
      loadNotifications(user.uid);
    }
  }, [user, loadNotifications]);

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
              <Link href="/admin" className="hover:text-gray-300 transition">
                {t.nav.admin}
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
            </div>
          </div>

          <div className={`flex items-center gap-4 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
            <button
              onClick={toggleLang}
              className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition font-medium"
            >
              {lang === "en" ? "العربية" : "English"}
            </button>

            {!loading && user && userProfile ? (
              <div className={`flex items-center gap-2 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
                <Link
                  href="/notifications"
                  className="relative px-3 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/orders"
                  className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
                >
                  {t.orders.title}
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
                >
                  <User size={20} />
                  <span className="hidden sm:inline">{userProfile.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
              >
                {t.nav.login}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
