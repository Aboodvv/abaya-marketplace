"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getFirebaseAuthErrorMessage } from "@/lib/firebaseErrors";

export default function LoginPage() {
  const { t, lang } = useLanguage();
  const { login, resetPassword } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResetMessage("");
    setLoading(true);

    try {
      await login(email.trim(), password);
      router.push("/");
    } catch (err: any) {
      setError(getFirebaseAuthErrorMessage(err, lang));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setError("");
    setResetMessage("");
    if (!email.trim()) {
      setError(t.login.resetMissingEmail);
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim());
      setResetMessage(t.login.resetSent);
    } catch (err: any) {
      setError(getFirebaseAuthErrorMessage(err, lang));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full border border-[#efe7da]">
        <p className="text-xs uppercase tracking-[0.3em] text-[#c7a86a] text-center mb-2">
          {lang === "ar" ? "مرحبا بك" : "Welcome"}
        </p>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          {t.login.title}
        </h1>
        <p className="text-gray-600 mb-8 text-center">{t.login.subtitle}</p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {resetMessage && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
            {resetMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 mb-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              {t.login.email}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {loading ? t.common.loading : t.login.submit}
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="mb-4 text-sm font-semibold text-[#7a5a1f] hover:text-[#c7a86a] transition"
          >
            {t.login.forgotPassword}
          </button>
          <p className="text-gray-600 mb-3">
            {lang === "ar" ? "ليس لديك حساب؟ " : "Don't have an account? "}
            <Link
              href="/register"
              className="text-[#c7a86a] font-semibold hover:underline"
            >
              {lang === "ar" ? "سجل الآن" : "Register here"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
