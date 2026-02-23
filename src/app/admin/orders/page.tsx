"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useAdminAccess } from "@/lib/adminAccess";

interface AdminOrderItem {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  image: string;
  quantity: number;
}

interface AdminOrder {
  id: string;
  userId: string;
  items: AdminOrderItem[];
  total: number;
  status: "pending" | "paid" | "cancelled";
  createdAt: string;
  stripeSessionId?: string | null;
}

interface CustomerInfo {
  name?: string;
  email?: string;
  phone?: string;
}

const statusOptions: AdminOrder["status"][] = ["pending", "paid", "cancelled"];

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

export default function AdminOrdersPage() {
  const { lang, t } = useLanguage();
  const { user, userProfile, loading: authLoading } = useAuth();
  const { canAccess, loading: accessLoading, hasPermission } = useAdminAccess(userProfile);
  const canManageOrders = hasPermission("orders");

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [customers, setCustomers] = useState<Record<string, CustomerInfo>>({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!canAccess || !canManageOrders) return;
    const loadOrders = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/orders");
        const list = await res.json();
        setOrders(list);
        // ملاحظة: جلب بيانات العملاء يمكن نقله لاحقاً إلى API منفصل أو توسيع API الحالي
      } catch (err) {
        // يمكن إضافة رسالة خطأ هنا
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, [canAccess, canManageOrders]);

  const filteredOrders = useMemo(() => {
    const queryText = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (!queryText) return true;
      const customer = customers[order.userId];
      const email = customer?.email?.toLowerCase() || "";
      const name = customer?.name?.toLowerCase() || "";
      return (
        order.id.toLowerCase().includes(queryText) ||
        email.includes(queryText) ||
        name.includes(queryText)
      );
    });
  }, [orders, customers, search, statusFilter]);

  const updateStatus = async (orderId: string, status: AdminOrder["status"]) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status }),
      });
      if (!res.ok) throw new Error("فشل تحديث حالة الطلب");
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, status } : order))
      );
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading || accessLoading) {
    return (
      <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center">
        <p className="text-gray-600">{t.common.loading}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#efe7da] text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {lang === "ar" ? "تسجيل الدخول مطلوب" : "Login required"}
          </h1>
          <p className="text-gray-600 mb-6">
            {lang === "ar" ? "يجب تسجيل الدخول للوصول للإدارة." : "Please log in to access admin."}
          </p>
          <Link
            href="/login"
            className="inline-flex px-6 py-3 rounded-full bg-[#c7a86a] text-black font-semibold"
          >
            {t.nav.login}
          </Link>
        </div>
      </div>
    );
  }

  if (!canAccess || !canManageOrders) {
    return (
      <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#efe7da] text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {lang === "ar" ? "غير مصرح" : "Access denied"}
          </h1>
          <p className="text-gray-600 mb-6">
            {lang === "ar"
              ? "ليس لديك صلاحية للوصول إلى لوحة الإدارة."
              : "You do not have permission to access the admin panel."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ef] py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-sm uppercase tracking-[0.3em] text-[#c7a86a] hover:underline"
          >
            {t.adminOrders.backToAdmin}
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mt-4">{t.adminOrders.title}</h1>
          <p className="text-gray-600 mt-2">{t.adminOrders.subtitle}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-[#efe7da] mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-600">{t.adminOrders.filters.label}</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="border border-[#efe7da] rounded-full px-4 py-2"
            >
              <option value="all">{t.adminOrders.filters.all}</option>
              <option value="pending">{t.adminOrders.filters.pending}</option>
              <option value="paid">{t.adminOrders.filters.paid}</option>
              <option value="cancelled">{t.adminOrders.filters.cancelled}</option>
            </select>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t.adminOrders.filters.search}
              className="border border-[#efe7da] rounded-full px-4 py-2"
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-[#efe7da]">
          {loading ? (
            <p className="text-gray-600">{t.common.loading}</p>
          ) : filteredOrders.length === 0 ? (
            <p className="text-gray-600">{t.adminOrders.empty}</p>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const customer = customers[order.userId];
                return (
                  <div
                    key={order.id}
                    className="border border-[#efe7da] rounded-3xl p-4 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm text-gray-500">{t.adminOrders.orderId}</p>
                      <p className="font-semibold text-gray-900">{order.id}</p>
                      <p className="text-sm text-gray-600">
                        {customer?.name || t.adminOrders.unknownCustomer}
                      </p>
                      <p className="text-sm text-gray-600">{customer?.email || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t.adminOrders.total}</p>
                      <p className="font-semibold text-gray-900">${order.total.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">
                        {t.adminOrders.items}: {order.items.length}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t.adminOrders.date}: {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t.adminOrders.status.label}</p>
                      <p className="font-semibold text-gray-900">
                        {t.adminOrders.status[order.status]}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {statusOptions.map((status) => (
                        <button
                          key={`${order.id}-${status}`}
                          onClick={() => updateStatus(order.id, status)}
                          disabled={updatingId === order.id || order.status === status}
                          className={`px-4 py-2 rounded-full text-sm font-semibold ${
                            order.status === status
                              ? "bg-[#111] text-white"
                              : "bg-[#f7f4ef] text-gray-700 hover:bg-[#efe7da]"
                          }`}
                        >
                          {t.adminOrders.status[status]}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
