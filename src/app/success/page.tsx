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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center bg-white rounded-lg shadow-lg p-12 max-w-md">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-12 h-12 text-green-600"
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
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {lang === "ar" ? "تم الدفع بنجاح!" : "Payment Successful!"}
        </h1>
        <p className="text-gray-600 mb-8">
          {lang === "ar"
            ? "شكراً لطلبك. سنرسل تفاصيل الطلب إلى بريدك الإلكتروني."
            : "Thank you for your order. We'll send order details to your email."}
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition"
        >
          {t.nav.home}
        </Link>
      </div>
    </div>
  );
}
