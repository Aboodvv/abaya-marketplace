"use client";

import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
  const { userProfile, updateProfile } = useAuth();
  const { lang } = useLanguage();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: userProfile?.name || "",
    phone: userProfile?.phone || "",
    address: userProfile?.address || "",
    city: userProfile?.city || "",
  });

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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            {lang === "ar" ? "حسابي" : "My Profile"}
          </h1>

          {!editing ? (
            <div className="space-y-6">
              <div>
                <label className="text-gray-600 font-semibold">
                  {lang === "ar" ? "البريد الإلكتروني" : "Email"}
                </label>
                <p className="text-gray-900 text-lg">{userProfile.email}</p>
              </div>

              <div>
                <label className="text-gray-600 font-semibold">
                  {lang === "ar" ? "الاسم" : "Name"}
                </label>
                <p className="text-gray-900 text-lg">{userProfile.name}</p>
              </div>

              <div>
                <label className="text-gray-600 font-semibold">
                  {lang === "ar" ? "رقم الهاتف" : "Phone"}
                </label>
                <p className="text-gray-900 text-lg">{userProfile.phone || "-"}</p>
              </div>

              <div>
                <label className="text-gray-600 font-semibold">
                  {lang === "ar" ? "العنوان" : "Address"}
                </label>
                <p className="text-gray-900 text-lg">{userProfile.address || "-"}</p>
              </div>

              <div>
                <label className="text-gray-600 font-semibold">
                  {lang === "ar" ? "المدينة" : "City"}
                </label>
                <p className="text-gray-900 text-lg">{userProfile.city || "-"}</p>
              </div>

              <button
                onClick={() => setEditing(true)}
                className="mt-8 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
              >
                {lang === "ar" ? "تعديل البيانات" : "Edit Profile"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  {lang === "ar" ? "الاسم" : "Name"}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  {lang === "ar" ? "رقم الهاتف" : "Phone"}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  {lang === "ar" ? "العنوان" : "Address"}
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  {lang === "ar" ? "المدينة" : "City"}
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:outline-none"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${
                    loading
                      ? "bg-gray-400"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {loading ? (lang === "ar" ? "جاري الحفظ..." : "Saving...") : (lang === "ar" ? "حفظ" : "Save")}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  {lang === "ar" ? "إلغاء" : "Cancel"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
