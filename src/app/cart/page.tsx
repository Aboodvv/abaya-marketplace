"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useOrders } from "@/context/OrdersContext";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationsContext";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Plus, Minus } from "lucide-react";
import { useState } from "react";

export default function CartPage() {
  const { lang, t } = useLanguage();
  const { cart, removeFromCart, updateQuantity, totalPrice } = useCart();
  const { createOrder } = useOrders();
  const { createNotification } = useNotifications();
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart }),
      });

      const { url } = await response.json();
      if (user && cart.length > 0) {
        const orderId = await createOrder({
          userId: user.uid,
          items: cart,
          total: totalPrice,
        });

        await createNotification({
          userId: user.uid,
          title: lang === "ar" ? "تم إنشاء طلبك" : "Order Created",
          body:
            lang === "ar"
              ? `تم إنشاء طلب جديد بقيمة $${totalPrice.toFixed(2)}`
              : `A new order has been created for $${totalPrice.toFixed(2)}`,
        });

        if (user.email) {
          await fetch("/api/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: user.email,
              subject:
                lang === "ar"
                  ? "تأكيد استلام الطلب"
                  : "Order confirmation",
              html:
                lang === "ar"
                  ? `<p>مرحبًا ${userProfile?.name || ""}</p><p>تم إنشاء طلبك بنجاح.</p><p>رقم الطلب: ${orderId}</p><p>المجموع: $${totalPrice.toFixed(2)}</p>`
                  : `<p>Hello ${userProfile?.name || ""}</p><p>Your order has been created successfully.</p><p>Order ID: ${orderId}</p><p>Total: $${totalPrice.toFixed(2)}</p>`,
            }),
          });
        }
      }
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to initiate checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center">
        <div className="text-center bg-white rounded-3xl shadow-xl p-10 border border-[#efe7da]">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t.cart.empty}
          </h2>
          <Link
            href="/products"
            className="inline-flex px-6 py-3 bg-[#c7a86a] text-black rounded-full font-semibold hover:bg-[#b59659] transition"
          >
            {t.cart.continueShopping}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ef]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {t.cart.title}
          </h1>
          <p className="text-gray-600">
            {lang === "ar"
              ? "راجعي العناصر قبل إتمام الدفع"
              : "Review your items before checkout"}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 border border-[#efe7da]">
          {cart.map((item) => {
            const name = lang === "ar" ? item.nameAr : item.name;
            return (
              <div
                key={item.id}
                className="flex flex-col md:flex-row md:items-center gap-4 py-6 border-b last:border-b-0"
              >
                <div className="relative w-full md:w-28 h-28 flex-shrink-0">
                  <Image
                    src={item.image}
                    alt={name}
                    fill
                    className="object-cover rounded-2xl"
                  />
                </div>
                <div className="flex-grow">
                  <h3 className="font-semibold text-lg text-gray-900">{name}</h3>
                  <p className="text-gray-600">${item.price}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-1.5 rounded-full bg-[#f7f4ef] hover:bg-[#efe7da] transition"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="font-semibold w-8 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-1.5 rounded-full bg-[#f7f4ef] hover:bg-[#efe7da] transition"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <p className="font-bold text-gray-900 w-24 text-right">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full transition"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-[#efe7da]">
          <div className="flex justify-between items-center text-2xl font-bold mb-6">
            <span>{t.cart.total}:</span>
            <span className="text-gray-900">${totalPrice.toFixed(2)}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={loading}
            className={`w-full py-4 rounded-full font-semibold text-lg transition ${
              loading
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-[#c7a86a] text-black hover:bg-[#b59659]"
            }`}
          >
            {loading ? t.common.loading : t.cart.checkout}
          </button>
        </div>
      </div>
    </div>
  );
}
