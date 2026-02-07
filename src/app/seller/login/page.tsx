"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useSeller } from "@/context/SellerContext";

export default function SellerLoginPage() {
  const { t, lang } = useLanguage();
  const { loginSeller } = useSeller();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const usernamePattern = /^[a-z0-9._-]+$/i;

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);
    setLoading(true);
    if (!usernamePattern.test(username.trim())) {
      showToast("error", lang === "ar" ? "اسم المستخدم غير صالح" : "Invalid username");
      setLoading(false);
      return;
    }
    try {
      await loginSeller(username, password);
      router.push("/seller/dashboard");
    } catch (err: any) {
      showToast(
        "error",
        err.message || (lang === "ar" ? "فشل تسجيل الدخول" : "Login failed")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full border border-[#efe7da]">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          {t.seller.login}
        </h1>
        <p className="text-gray-600 mb-6 text-center">{t.seller.title}</p>

        {toast && (
          <div
            className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg transition ${
              toast.type === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
            role="status"
            aria-live="polite"
          >
            {toast.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t.seller.username}
            className="w-full border border-[#efe7da] rounded-full px-4 py-3"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t.seller.password}
            className="w-full border border-[#efe7da] rounded-full px-4 py-3"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-full font-semibold transition ${
              loading ? "bg-gray-300" : "bg-[#c7a86a] text-black hover:bg-[#b59659]"
            }`}
          >
            {loading ? t.common.loading : t.seller.login}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          {lang === "ar" ? "لا يوجد حساب؟" : "No account yet?"} {" "}
          <Link href="/seller/register" className="text-[#c7a86a] font-semibold hover:underline">
            {t.seller.register}
          </Link>
        </p>
      </div>
    </div>
  );
}
