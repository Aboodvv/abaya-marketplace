"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AdminLoginPage() {
  const { lang, t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      // تحقق من claims admin
      const token = await result.user.getIdTokenResult();
      if (token.claims.admin) {
        router.push("/admin");
      } else {
        setError(lang === "ar" ? "ليس لديك صلاحية دخول الإدارة" : "You are not an admin");
      }
    } catch (err: any) {
      setError(err.message || (lang === "ar" ? "فشل تسجيل الدخول" : "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f4ef]">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-[#efe7da]">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">
          {lang === "ar" ? "تسجيل دخول الإدارة" : "Admin Login"}
        </h1>
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-center font-bold">{error}</div>}
        <div className="mb-4">
          <label className="block mb-1 font-semibold text-gray-700">{lang === "ar" ? "البريد الإلكتروني" : "Email"}</label>
          <input
            type="email"
            className="w-full border border-[#efe7da] rounded-full px-4 py-2 focus:outline-none focus:border-[#c7a86a]"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            dir={lang === "ar" ? "rtl" : "ltr"}
          />
        </div>
        <div className="mb-6">
          <label className="block mb-1 font-semibold text-gray-700">{lang === "ar" ? "كلمة المرور" : "Password"}</label>
          <input
            type="password"
            className="w-full border border-[#efe7da] rounded-full px-4 py-2 focus:outline-none focus:border-[#c7a86a]"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            dir={lang === "ar" ? "rtl" : "ltr"}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-[#c7a86a] text-white font-bold py-2 rounded-full hover:bg-[#b89b5e] transition"
          disabled={loading}
        >
          {loading ? (lang === "ar" ? "جاري الدخول..." : "Logging in...") : (lang === "ar" ? "دخول" : "Login")}
        </button>
      </form>
    </div>
  );
}
