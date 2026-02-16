
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useSeller } from "@/context/SellerContext";

export default function SellerRegisterPage() {
  const { t, lang } = useLanguage();
  const { registerSeller } = useSeller();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [redirectAgreement, setRedirectAgreement] = useState(false);
  const router = useRouter();
  const usernamePattern = /^[a-z0-9._-]+$/i;
  const maxDocumentSizeMb = 5;
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!documentFile) {
      setError(lang === "ar" ? "يرجى رفع الوثيقة" : "Please upload the document");
      return;
    }
    if (documentFile.size > maxDocumentSizeMb * 1024 * 1024) {
      setError(
        lang === "ar"
          ? `حجم الملف كبير، الحد الأقصى ${maxDocumentSizeMb}MB`
          : `File is too large. Max ${maxDocumentSizeMb}MB`
      );
      return;
    }
    const usernameFromEmail = form.email
      .trim()
      .toLowerCase()
      .split("@")[0]
      .replace(/[^a-z0-9._-]/g, "");
    if (!usernamePattern.test(usernameFromEmail)) {
      setError(
        lang === "ar"
          ? "اسم المستخدم يجب أن يحتوي على حروف/أرقام فقط ويمكن استخدام . _ -"
          : "Username must contain only letters/numbers and may include . _ -"
      );
      return;
    }
    setLoading(true);
    try {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(
            new Error(
              lang === "ar"
                ? "العملية تأخرت، حاول مرة أخرى"
                : "Request timed out, please try again"
            )
          );
        }, 20000);
        registerSeller({
          ...form,
          storeName: form.name.trim(),
          storeCategory: lang === "ar" ? "عام" : "General",
          username: usernameFromEmail,
          documentFile,
        })
          .then(() => {
            clearTimeout(timer);
            resolve();
          })
          .catch((error) => {
            clearTimeout(timer);
            reject(error);
          });
      });

      setSuccess(true);
      setTimeout(() => setRedirectAgreement(true), 1200);
    } catch (err: any) {
      setError(err.message || (lang === "ar" ? "فشل تسجيل البائع" : "Failed to register"));
    } finally {
      setLoading(false);
    }
  };

  if (redirectAgreement) {
    router.replace("/seller/agreement");
    return null;
  }
  if (success) {
    return (
      <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center px-4 py-10">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-lg w-full border border-[#efe7da] text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {t.seller.approvalPendingTitle}
          </h1>
          <p className="text-gray-700 mb-6">{t.seller.approvalPendingMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-lg w-full border border-[#efe7da]">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          {t.seller.register}
        </h1>
        <p className="text-gray-600 mb-6 text-center">{t.seller.title}</p>
        <p className="text-sm text-gray-500 mb-6 text-center">
          {lang === "ar"
            ? "سيتم مراجعة تسجيلك قبل تفعيل إضافة المنتجات."
            : "Your registration will be reviewed before product access is enabled."}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder={t.seller.name}
            className="w-full border border-[#efe7da] rounded-full px-4 py-3"
            required
          />
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder={t.seller.phone}
            className="w-full border border-[#efe7da] rounded-full px-4 py-3"
            required
          />
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder={t.seller.email}
            className="w-full border border-[#efe7da] rounded-full px-4 py-3"
            required
          />
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder={t.seller.password}
            className="w-full border border-[#efe7da] rounded-full px-4 py-3"
            required
          />
          <label className="block text-sm text-gray-700">
            {t.seller.commercialRegister}
          </label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
            className="w-full border border-[#efe7da] rounded-2xl px-4 py-3 bg-white"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-full font-semibold transition ${
              loading ? "bg-gray-300" : "bg-[#c7a86a] text-black hover:bg-[#b59659]"
            }`}
          >
            {loading ? t.common.loading : t.seller.submit}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          {lang === "ar" ? "لديك حساب؟" : "Already have an account?"} {" "}
          <Link href="/seller/login" className="text-[#c7a86a] font-semibold hover:underline">
            {t.seller.login}
          </Link>
        </p>
      </div>
    </div>
  );
}
