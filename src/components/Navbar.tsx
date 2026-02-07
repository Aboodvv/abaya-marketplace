"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { isAdminUser } from "@/lib/admin";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationsContext";
import { ShoppingCart, LogOut, User, Bell } from "lucide-react";

export default function Navbar() {
  const { lang, setLang, t, dir } = useLanguage();
  const { totalItems } = useCart();
  const { user, userProfile, logout, loading } = useAuth();
  const { unreadCount, loadNotifications } = useNotifications();
  const isAdmin = isAdminUser(userProfile, user?.email);
  const displayName =
    userProfile?.name ||
    user?.displayName ||
    user?.email ||
    (lang === "ar" ? "حسابي" : "My Account");
  const topBarItems = [
    { key: "explore", href: "/explore", label: t.topbar.explore },
    { key: "abayas", href: "/abayas", label: t.topbar.abayas },
    { key: "fabrics", href: "/fabrics", label: t.topbar.fabrics },
    { key: "delivery", href: "/delivery", label: t.topbar.fastDelivery },
  ];

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
              <Link href="/seller/login" className="hover:text-[#c7a86a] transition">
                {t.nav.seller}
              </Link>
              {isAdmin && (
                <Link href="/admin" className="hover:text-[#c7a86a] transition">
                  {t.nav.admin}
                </Link>
              )}
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

            {!loading && user ? (
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
                  <span className="hidden sm:inline">{displayName}</span>
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
      <div className="border-t border-white/10 bg-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`flex flex-wrap items-center justify-center gap-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 ${
              dir === "rtl" ? "flex-row-reverse" : ""
            }`}
          >
            {topBarItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="flex items-center gap-3 hover:text-[#c7a86a] transition"
              >
                <span className="h-1 w-1 rounded-full bg-[#c7a86a]" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
