"use client";

import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  ChevronLeft,
  Heart,
  PackageCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  Truck,
} from "lucide-react";

export default function ProfilePage() {
  const { userProfile, updateProfile } = useAuth();
  const { lang, t } = useLanguage();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: userProfile?.name || "",
    phone: userProfile?.phone || "",
    address: userProfile?.address || "",
    city: userProfile?.city || "",
  });

  const initials = useMemo(() => {
    if (!userProfile?.name) return "";
    return userProfile.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }, [userProfile]);

  const orderStates = useMemo(
    () =>
      [
        { key: "pending", icon: ShoppingBag },
        { key: "processing", icon: PackageCheck },
        { key: "shipped", icon: Truck },
        { key: "delivered", icon: PackageCheck },
      ] as const,
    []
  );

  const quickActions = useMemo(
    () =>
      [
        { key: "orders", href: "/orders", icon: ShoppingBag },
        { key: "favorites", href: "/favorites", icon: Heart },
        { key: "notifications", href: "/notifications", icon: Bell },
        { key: "cart", href: "/cart", icon: ShoppingCart },
        { key: "products", href: "/products", icon: Store },
        { key: "seller", href: "/seller/login", icon: Store },
      ] as const,
    []
  );

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            {lang === "ar" ? "يجب تسجيل الدخول" : "Please log in"}
          </h2>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            {lang === "ar" ? "تسجيل الدخول" : "Login"}
          </Link>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(formData);
      setEditing(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f4ef] pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="relative overflow-hidden rounded-3xl border border-[#efe7da] bg-gradient-to-br from-[#fef6ea] via-white to-[#f3e3c9] p-6 md:p-10 shadow-xl">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[#f7e5c4] opacity-60" />
          <div className="absolute -right-16 bottom-0 h-32 w-32 rounded-full bg-[#f2d6a8] opacity-70" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[#c7a86a] mb-3">
                {t.profile.greeting}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                {userProfile.name}
              </h1>
              <p className="text-gray-600 mt-2">{t.profile.subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-full bg-white border border-[#efe7da] shadow-sm flex items-center justify-center text-lg font-bold text-[#7a5a1f]">
                {initials || "?"}
              </div>
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 rounded-full border border-[#c7a86a] px-5 py-2 text-sm font-semibold text-[#7a5a1f] hover:bg-[#c7a86a] hover:text-black transition"
              >
                {t.profile.editProfile}
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-3xl border border-[#efe7da] p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {t.profile.ordersTitle}
              </h2>
              <p className="text-sm text-gray-500">{t.profile.ordersSubtitle}</p>
            </div>
            <Link
              href="/orders"
              className="text-sm font-semibold text-[#c7a86a] hover:underline"
            >
              {t.profile.viewAll}
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {orderStates.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href="/orders"
                  className="rounded-2xl border border-[#f1e6d4] bg-[#f7f4ef] px-4 py-4 flex flex-col gap-3 hover:shadow-md transition"
                >
                  <Icon className="h-6 w-6 text-[#7a5a1f]" />
                  <span className="text-sm font-semibold text-gray-900">
                    {t.profile.orderStates[item.key]}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-3xl border border-[#efe7da] p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {t.profile.quickActionsTitle}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {quickActions.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className="rounded-2xl border border-[#f1e6d4] bg-white px-4 py-4 flex items-center gap-3 hover:shadow-md transition"
                >
                  <Icon className="h-5 w-5 text-[#7a5a1f]" />
                  <span className="text-sm font-semibold text-gray-900">
                    {t.profile.actions[item.key]}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-3xl border border-[#efe7da] p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {t.profile.detailsTitle}
          </h2>

          {!editing ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-gray-500 text-sm">{t.profile.fields.email}</label>
                <p className="text-gray-900 font-semibold">{userProfile.email}</p>
              </div>
              <div>
                <label className="text-gray-500 text-sm">{t.profile.fields.name}</label>
                <p className="text-gray-900 font-semibold">{userProfile.name}</p>
              </div>
              <div>
                <label className="text-gray-500 text-sm">{t.profile.fields.phone}</label>
                <p className="text-gray-900 font-semibold">{userProfile.phone || "-"}</p>
              </div>
              <div>
                <label className="text-gray-500 text-sm">{t.profile.fields.address}</label>
                <p className="text-gray-900 font-semibold">{userProfile.address || "-"}</p>
              </div>
              <div>
                <label className="text-gray-500 text-sm">{t.profile.fields.city}</label>
                <p className="text-gray-900 font-semibold">{userProfile.city || "-"}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  {t.profile.fields.name}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-[#efe7da] rounded-full bg-white focus:ring-2 focus:ring-[#c7a86a]/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  {t.profile.fields.phone}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-[#efe7da] rounded-full bg-white focus:ring-2 focus:ring-[#c7a86a]/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  {t.profile.fields.address}
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-[#efe7da] rounded-full bg-white focus:ring-2 focus:ring-[#c7a86a]/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  {t.profile.fields.city}
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-[#efe7da] rounded-full bg-white focus:ring-2 focus:ring-[#c7a86a]/40 focus:outline-none"
                />
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 px-6 py-3 rounded-full font-semibold transition ${
                    loading
                      ? "bg-gray-300"
                      : "bg-[#c7a86a] text-black hover:bg-[#b59659]"
                  }`}
                >
                  {loading ? t.profile.saving : t.profile.save}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex-1 px-6 py-3 bg-[#f1e6d4] text-gray-900 rounded-full hover:bg-[#e7d8c0] transition font-semibold"
                >
                  {t.profile.cancel}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
