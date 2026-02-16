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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const usernamePattern = /^[a-z0-9._-]+$/i;

  const normalizeIdentifierToUsername = (identifier: string) => {
    const normalized = identifier.trim().toLowerCase();
    if (!normalized) return "";
    if (normalized.includes("@")) {
      return normalized.split("@")[0].replace(/[^a-z0-9._-]/g, "");
    }
    return normalized.replace(/\s+/g, "");
  };

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
    const identifier = email.trim() || username.trim();
    const normalizedUsername = normalizeIdentifierToUsername(identifier);
    if (!normalizedUsername || !usernamePattern.test(normalizedUsername)) {
      showToast(
        "error",
        lang === "ar" ? "اسم المستخدم غير صالح" : "Invalid username"
      );
      setLoading(false);
      return;
    }
    try {
      // استدعاء API Route الجديد
      const res = await fetch("/api/seller-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "SELLER_NOT_APPROVED") {
          showToast("error", t.seller.approvalPendingMessage);
        } else if (data.error === "SELLER_PROFILE_MISSING") {
          showToast(
            "error",
            lang === "ar" ? "حساب البائع غير موجود" : "Seller profile missing"
          );
        } else {
          showToast("error", data.error || (lang === "ar" ? "فشل تسجيل الدخول" : "Login failed"));
        }
        setLoading(false);
        return;
      }
      // إذا نجح، انتقل للوحة البائع
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
        <p className="text-black mb-6 text-center">{t.seller.title}</p>

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

        <form onSubmit={handleSubmit} className="space-y-4 text-black">
          <label className="block text-sm font-semibold text-black">
            {t.seller.username}
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t.seller.username}
            className="w-full border border-[#efe7da] rounded-full px-4 py-3 text-black placeholder:text-gray-500"
          />
          <label className="block text-sm font-semibold text-black">
            {t.seller.email}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.seller.email}
            className="w-full border border-[#efe7da] rounded-full px-4 py-3 text-black placeholder:text-gray-500"
          />
          <label className="block text-sm font-semibold text-black">
            {t.seller.password}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t.seller.password}
            className="w-full border border-[#efe7da] rounded-full px-4 py-3 text-black placeholder:text-gray-500"
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

        <p className="text-center text-black mt-6">
          {lang === "ar" ? "لا يوجد حساب؟" : "No account yet?"} {" "}
          <Link
            href="/seller/register"
            className="text-black font-semibold underline decoration-[#c7a86a] hover:opacity-80"
          >
            {t.seller.register}
          </Link>
        </p>
      </div>
    </div>
  );
}
