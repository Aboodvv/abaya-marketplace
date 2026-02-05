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
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0b0b0b]/90 text-white backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div
            className={`flex items-center gap-8 ${dir === "rtl" ? "flex-row-reverse" : ""}`}
          >
            <Link href="/" className="text-2xl font-bold tracking-wide">
              {lang === "ar" ? "برزن" : "Barzn"}
              <span className="ml-2 text-sm text-[#c7a86a]">Abaya</span>
            </Link>
            <div
              className={`hidden md:flex gap-6 text-sm font-semibold ${dir === "rtl" ? "flex-row-reverse" : ""}`}
            >
              <Link href="/" className="hover:text-[#c7a86a] transition">
                {t.nav.home}
              </Link>
              <Link href="/products" className="hover:text-[#c7a86a] transition">
                {t.nav.products}
              </Link>
              <Link href="/admin" className="hover:text-[#c7a86a] transition">
                {t.nav.admin}
              </Link>
              <Link
                href="/cart"
                className="hover:text-[#c7a86a] transition flex items-center gap-2"
              >
                <ShoppingCart size={18} />
                {t.nav.cart}
                {totalItems > 0 && (
                  <span className="bg-[#c7a86a] text-black rounded-full px-2 py-0.5 text-xs">
                    {totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>

          <div
            className={`flex items-center gap-3 ${dir === "rtl" ? "flex-row-reverse" : ""}`}
          >
            <button
              onClick={toggleLang}
              className="px-3 py-1.5 border border-[#c7a86a] text-[#c7a86a] rounded-full hover:bg-[#c7a86a] hover:text-black transition text-sm"
            >
              {lang === "en" ? "العربية" : "English"}
            </button>

            {!loading && user && userProfile ? (
              <div
                className={`flex items-center gap-2 ${dir === "rtl" ? "flex-row-reverse" : ""}`}
              >
                <Link
                  href="/notifications"
                  className="relative px-3 py-2 border border-white/10 rounded-full hover:border-[#c7a86a] transition"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#c7a86a] text-black rounded-full px-2 py-0.5 text-xs">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/orders"
                  className="px-4 py-2 border border-white/10 rounded-full hover:border-[#c7a86a] transition text-sm"
                >
                  {t.orders.title}
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-full hover:border-[#c7a86a] transition text-sm"
                >
                  <User size={18} />
                  <span className="hidden sm:inline">{userProfile.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-[#c7a86a] text-black rounded-full hover:bg-[#b59659] transition"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-[#c7a86a] text-black rounded-full hover:bg-[#b59659] transition text-sm font-semibold"
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
