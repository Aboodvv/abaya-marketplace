"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useEffect } from "react";

export default function SuccessPage() {
  const { t, lang } = useLanguage();
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center px-4">
      <div className="text-center bg-white rounded-3xl shadow-xl p-12 max-w-md border border-[#efe7da]">
        <div className="mb-6">
          <div className="w-20 h-20 bg-[#efe7da] rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-12 h-12 text-[#7a5a1f]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        <p className="text-xs uppercase tracking-[0.3em] text-[#c7a86a] mb-2">
          {lang === "ar" ? "تم بنجاح" : "Confirmed"}
        </p>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {lang === "ar" ? "تم الدفع بنجاح!" : "Payment Successful!"}
        </h1>
        <p className="text-gray-600 mb-8">
          {lang === "ar"
            ? "شكراً لطلبك. سنرسل تفاصيل الطلب إلى بريدك الإلكتروني."
            : "Thank you for your order. We'll send order details to your email."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex px-8 py-3 bg-[#c7a86a] text-black rounded-full font-semibold hover:bg-[#b59659] transition"
          >
            {t.nav.home}
          </Link>
          <Link
            href="/orders"
            className="inline-flex px-8 py-3 border border-[#c7a86a] text-[#7a5a1f] rounded-full font-semibold hover:bg-[#efe7da] transition"
          >
            {t.orders.title}
          </Link>
        </div>
      </div>
    </div>
  );
}
