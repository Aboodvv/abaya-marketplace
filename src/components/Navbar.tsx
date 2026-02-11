"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { isAdminUser } from "@/lib/admin";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationsContext";
import { ShoppingCart, LogOut, User, Bell, Search, Menu, X } from "lucide-react";

export default function Navbar() {
  const { lang, t, dir } = useLanguage();
  const { totalItems } = useCart();
  const { user, userProfile, hasSession, logout, loading } = useAuth();
  const { unreadCount, loadNotifications } = useNotifications();
  const isAdmin = isAdminUser(userProfile);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const displayName =
    userProfile?.name ||
    user?.displayName ||
    (user?.email ? user.email.split("@")[0] : lang === "ar" ? "حسابي" : "My Account");
  const accountHref = user || hasSession ? "/profile" : "/login";
  const topBarItems = [
    { key: "explore", href: "/explore", label: t.topbar.explore },
    { key: "abayas", href: "/abayas", label: t.topbar.abayas },
    { key: "fabrics", href: "/fabrics", label: t.topbar.fabrics },
    { key: "delivery", href: "/delivery", label: t.topbar.fastDelivery },
  ];
  const menuItems = [
    { key: "products", href: "/products", label: t.nav.products },
    { key: "categories", href: "/categories", label: t.topPages.categories.title },
    { key: "colored", href: "/abayas-colored", label: t.topPages.coloredAbayas.title },
    { key: "evening", href: "/abayas-evening", label: t.topPages.eveningAbayas.title },
    { key: "formal", href: "/abayas-formal", label: t.topPages.formalAbayas.title },
    { key: "dresses", href: "/dresses", label: t.topPages.dresses.title },
    { key: "fabrics", href: "/fabrics", label: t.topPages.fabrics.title },
    { key: "seller", href: "/seller/login", label: t.nav.seller },
    { key: "sellerRegister", href: "/seller/register", label: t.nav.sellerRegister },
    { key: "cart", href: "/cart", label: t.nav.cart },
    { key: "account", href: accountHref, label: t.nav.account },
  ];
  if (isAdmin) {
    menuItems.push({ key: "admin", href: "/admin", label: t.nav.admin });
  }

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
        <div className="grid h-16 grid-cols-3 items-center">
          <div className={`flex items-center gap-3 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              aria-label={lang === "ar" ? "قائمة التنقل" : "Open navigation"}
              className="p-2 rounded-full border border-white/10 hover:border-[#c7a86a] transition"
            >
              <Menu size={18} />
            </button>
            <Link
              href="/products"
              aria-label={lang === "ar" ? "بحث" : "Search"}
              className="p-2 rounded-full border border-white/10 hover:border-[#c7a86a] transition"
            >
              <Search size={18} />
            </Link>
          </div>

          <div className="flex justify-center">
            <Link href="/" className="text-2xl font-bold tracking-wide">
              {lang === "ar" ? "برزن" : "Barzn"}
              <span
                className={`text-sm text-[#c7a86a] ${dir === "rtl" ? "mr-2" : "ml-2"}`}
              >
                Abaya
              </span>
            </Link>
          </div>

          <div className={`flex items-center justify-end gap-2 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
            <Link
              href="/cart"
              aria-label={t.nav.cart}
              className="relative p-2 rounded-full border border-white/10 hover:border-[#c7a86a] transition"
            >
              <ShoppingCart size={18} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#c7a86a] text-black rounded-full px-2 py-0.5 text-xs">
                  {totalItems}
                </span>
              )}
            </Link>

            {hasSession || user ? (
              <div className={`flex items-center gap-2 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
                <Link
                  href="/notifications"
                  className="relative p-2 border border-white/10 rounded-full hover:border-[#c7a86a] transition"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#c7a86a] text-black rounded-full px-2 py-0.5 text-xs">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-2 border border-white/10 rounded-full hover:border-[#c7a86a] transition text-sm"
                >
                  <User size={18} />
                  <span className="hidden sm:inline">
                    {loading ? t.common.loading : displayName}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 bg-[#c7a86a] text-black rounded-full hover:bg-[#b59659] transition"
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
      {isMenuOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-white opacity-100"
            style={{ backgroundColor: "#ffffff", opacity: 1 }}
            aria-label={lang === "ar" ? "إغلاق القائمة" : "Close menu"}
            onClick={() => setIsMenuOpen(false)}
          />
          <div
            className={`side-menu ${dir === "rtl" ? "right-0" : "left-0"} h-full`}
          >
            <button
              type="button"
              onClick={() => setIsMenuOpen(false)}
              className="menu-close"
              aria-label={lang === "ar" ? "إغلاق" : "Close"}
            >
              <X size={22} />
            </button>
            <div className="menu-header">
              <span className="menu-logo">
                {lang === "ar" ? "برزن" : "Barzn"}
                <span className={`menu-logo-sub ${dir === "rtl" ? "mr-2" : "ml-2"}`}>
                  Abaya
                </span>
              </span>
            </div>
            <ul className="menu-list">
              {menuItems.map((item) => (
                <li key={item.key} className="menu-item">
                  <Link
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`menu-item-link ${dir === "rtl" ? "text-right" : "text-left"}`}
                  >
                    {item.label}
                  </Link>
                  <span className="menu-chevron">&#8249;</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </nav>
  );
}
