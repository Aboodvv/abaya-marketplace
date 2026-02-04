"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useOrders, Order } from "@/context/OrdersContext";

export default function OrdersPage() {
  const { lang, t } = useLanguage();
  const { user, userProfile } = useAuth();
  const { getOrdersByUser } = useOrders();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      const data = await getOrdersByUser(user.uid);
      setOrders(data);
      setLoading(false);
    };

    fetchOrders();
  }, [getOrdersByUser, user]);

  if (!user || !userProfile) {
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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-10">
          {t.orders.title}
        </h1>

        {loading ? (
          <div className="text-gray-600">{t.common.loading}</div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600 mb-4">{t.orders.empty}</p>
            <Link
              href="/products"
              className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              {t.cart.continueShopping}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">{t.orders.orderId}</p>
                    <p className="font-semibold text-gray-900">{order.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t.orders.date}</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(order.createdAt).toLocaleString(lang === "ar" ? "ar-SA" : "en-US")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t.orders.status}</p>
                    <span className="inline-block px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-semibold">
                      {t.orders.pending}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t.cart.total}</p>
                    <p className="font-semibold text-gray-900">${order.total.toFixed(2)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {order.items.map((item) => {
                    const name = lang === "ar" ? item.nameAr : item.name;
                    return (
                      <div key={item.id} className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-md overflow-hidden">
                          <Image
                            src={item.image}
                            alt={name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{name}</p>
                          <p className="text-sm text-gray-600">
                            {t.cart.quantity}: {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
