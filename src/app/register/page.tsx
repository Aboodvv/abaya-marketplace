"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const { t, lang } = useLanguage();
  const { register } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError(lang === "ar" ? "كلمات المرور غير متطابقة" : "Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await register(formData.email, formData.password, formData.name);
      router.push("/");
    } catch (err: any) {
      setError(err.message || (lang === "ar" ? "فشل التسجيل" : "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full border border-[#efe7da]">
        <p className="text-xs uppercase tracking-[0.3em] text-[#c7a86a] text-center mb-2">
          {lang === "ar" ? "حساب جديد" : "New Account"}
        </p>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          {lang === "ar" ? "إنشاء حساب جديد" : "Create Account"}
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          {lang === "ar" ? "انضم إلينا الآن" : "Join us today"}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              {lang === "ar" ? "الاسم الكامل" : "Full Name"}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-[#efe7da] rounded-full bg-white focus:ring-2 focus:ring-[#c7a86a]/40 focus:outline-none"
              placeholder={lang === "ar" ? "أدخل اسمك" : "Enter your name"}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              {t.login.email}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-[#efe7da] rounded-full bg-white focus:ring-2 focus:ring-[#c7a86a]/40 focus:outline-none"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              {t.login.password}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-[#efe7da] rounded-full bg-white focus:ring-2 focus:ring-[#c7a86a]/40 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              {lang === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"}
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-[#efe7da] rounded-full bg-white focus:ring-2 focus:ring-[#c7a86a]/40 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-full font-semibold transition ${
              loading
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-[#c7a86a] text-black hover:bg-[#b59659]"
            }`}
          >
            {loading ? t.common.loading : (lang === "ar" ? "تسجيل" : "Register")}
          </button>
        </form>

        <div className="text-center">
          <p className="text-gray-600">
            {lang === "ar" ? "هل لديك حساب؟ " : "Already have an account? "}
            <Link
              href="/login"
              className="text-[#c7a86a] font-semibold hover:underline"
            >
              {lang === "ar" ? "دخول" : "Login"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
