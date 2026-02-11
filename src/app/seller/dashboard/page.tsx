"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLanguage } from "@/context/LanguageContext";
import { useSeller } from "@/context/SellerContext";
import { Product } from "@/context/CartContext";
import {
  Menu,
  X,
  Home,
  ShoppingBag,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Trash2,
  Edit2,
} from "lucide-react";

interface SellerOrderItem {
  sellerId?: string;
  price: number;
  quantity: number;
}

interface SellerOrder {
  id: string;
  items: SellerOrderItem[];
  total: number;
  status?: string;
  createdAt: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
}

type NavTab = "overview" | "orders" | "products" | "withdrawals" | "settings" | "analytics";

export default function SellerDashboardPage() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const { sellerUser, sellerProfile, loading: sellerLoading, logoutSeller } = useSeller();
  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [savingWithdraw, setSavingWithdraw] = useState(false);
  const sellerEmail = sellerProfile?.email?.toLowerCase() || "";

  // تحميل المنتجات
  useEffect(() => {
    if (!sellerEmail) return;
    const loadProducts = async () => {
      const q = query(collection(db, "products"), where("sellerId", "==", sellerEmail));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Product, "id">),
      }));
      setProducts(list);
    };
    loadProducts();
  }, [sellerEmail]);

  // تحميل الطلبات
  useEffect(() => {
    if (!sellerEmail) return;
    const loadOrders = async () => {
      const snapshot = await getDocs(collection(db, "orders"));
      const list = snapshot.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<SellerOrder, "id">),
        }))
        .filter((order) => order.items?.some((item) => item.sellerId === sellerEmail))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(list as SellerOrder[]);
    };
    loadOrders();
  }, [sellerEmail]);

  // تحميل السحوبات
  useEffect(() => {
    if (!sellerUser) return;
    const loadWithdrawals = async () => {
      const q = query(collection(db, "withdrawals"), where("sellerId", "==", sellerUser.uid));
      const snapshot = await getDocs(q);
      const list = snapshot.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Withdrawal, "id">),
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setWithdrawals(list as Withdrawal[]);
    };
    loadWithdrawals();
  }, [sellerUser]);

  const totalSales = useMemo(() => {
    if (!sellerEmail) return 0;
    return orders.reduce((sum, order) => {
      const sellerItems = order.items.filter((item) => item.sellerId === sellerEmail);
      const sellerTotal = sellerItems.reduce(
        (itemSum, item) => itemSum + item.price * item.quantity,
        0
      );
      return sum + sellerTotal;
    }, 0);
  }, [orders, sellerEmail]);

  const totalItems = useMemo(
    () => orders.reduce((sum, order) => sum + order.items.length, 0),
    [orders]
  );

  const pendingOrders = useMemo(
    () => orders.filter((o) => o.status === "pending" || !o.status).length,
    [orders]
  );

  const completedOrders = useMemo(
    () => orders.filter((o) => o.status === "completed").length,
    [orders]
  );

  const averageOrderValue = useMemo(
    () => (orders.length > 0 ? totalSales / orders.length : 0),
    [totalSales, orders.length]
  );

  const withdrawnTotal = useMemo(
    () => withdrawals.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [withdrawals]
  );

  const availableBalance = Math.max(0, totalSales - withdrawnTotal);

  const filteredOrders = useMemo(() => {
    if (orderStatusFilter === "all") return orders;
    return orders.filter((o) => (o.status || "pending") === orderStatusFilter);
  }, [orders, orderStatusFilter]);

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteDoc(doc(db, "products", productId));
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error("خطأ في حذف المنتج:", error);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerUser) return;
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0 || amount > availableBalance) return;
    setSavingWithdraw(true);
    try {
      await addDoc(collection(db, "withdrawals"), {
        sellerId: sellerUser.uid,
        amount,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      setWithdrawAmount("");
      const snapshot = await getDocs(
        query(collection(db, "withdrawals"), where("sellerId", "==", sellerUser.uid))
      );
      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Withdrawal, "id">),
      }));
      setWithdrawals(list as Withdrawal[]);
    } catch (error) {
      console.error("خطأ في السحب:", error);
    } finally {
      setSavingWithdraw(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutSeller();
      router.push("/seller/login");
    } catch (error) {
      console.error("خطأ في تسجيل الخروج:", error);
    }
  };

  if (sellerLoading) {
    return (
      <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center">
        <p className="text-gray-600">{t.common.loading}</p>
      </div>
    );
  }

  if (!sellerUser || !sellerProfile) {
    return (
      <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#efe7da] text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {lang === "ar" ? "يجب تسجيل الدخول كبائع" : "Please login as seller"}
          </h1>
          <div className="flex flex-col gap-3">
            <Link
              href="/seller/login"
              className="px-6 py-3 rounded-full bg-[#c7a86a] text-black font-semibold hover:bg-[#b59659] transition"
            >
              {t.seller.login}
            </Link>
            <Link
              href="/seller/register"
              className="px-6 py-3 rounded-full border border-[#c7a86a] text-[#7a5a1f] font-semibold hover:bg-[#f7f4ef] transition"
            >
              {t.seller.register}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen bg-[#f7f4ef] ${lang === "ar" ? "flex-row-reverse" : ""}`}>
      {/* الشريط الجانبي */}
      <div
        className={`fixed ${
          lang === "ar" ? "right-0" : "left-0"
        } top-0 h-screen w-64 bg-white border-l border-[#efe7da] shadow-lg transform transition-transform duration-300 z-50 ${
          sidebarOpen ? "translate-x-0" : lang === "ar" ? "translate-x-64" : "-translate-x-64"
        } md:relative md:translate-x-0`}
      >
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-gray-900">
              {lang === "ar" ? "البائع" : "Seller"}
            </h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-gray-600 hover:text-gray-900"
            >
              <X size={22} />
            </button>
          </div>

          {/* معلومات المتجر */}
          <div className="bg-[#f7f4ef] rounded-2xl p-4 mb-6">
            <p className="text-sm font-semibold text-gray-900">{sellerProfile.storeName}</p>
            <p className="text-xs text-gray-600">{sellerProfile.storeCategory}</p>
          </div>

          {/* قائمة التنقل */}
          <nav className="space-y-2 flex-1">
            {[
              { id: "overview" as NavTab, label: t.seller.overview, icon: Home },
              { id: "orders" as NavTab, label: t.seller.ordersManagement, icon: ShoppingBag },
              { id: "products" as NavTab, label: t.seller.productsManagement, icon: Package },
              { id: "withdrawals" as NavTab, label: t.seller.withdrawals, icon: BarChart3 },
              { id: "analytics" as NavTab, label: t.seller.analytics, icon: BarChart3 },
              { id: "settings" as NavTab, label: t.seller.settings, icon: Settings },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  activeTab === id
                    ? "bg-[#c7a86a] text-black font-semibold"
                    : "text-gray-700 hover:bg-[#f7f4ef]"
                }`}
              >
                <Icon size={20} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* زر الخروج */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut size={20} />
            <span>{lang === "ar" ? "تسجيل الخروج" : "Logout"}</span>
          </button>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="flex-1 overflow-auto">
        {/* رأس الصفحة */}
        <div className="bg-white border-b border-[#efe7da] sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {activeTab === "overview" && t.seller.overview}
            {activeTab === "orders" && t.seller.ordersManagement}
            {activeTab === "products" && t.seller.productsManagement}
            {activeTab === "withdrawals" && t.seller.withdrawals}
            {activeTab === "analytics" && t.seller.analytics}
            {activeTab === "settings" && t.seller.settings}
          </h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-gray-600 hover:text-gray-900"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* محتوى الصفحات */}
        <div className="p-6">
          {/* نظرة عامة */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* بطاقات الملخص */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-[#efe7da] shadow-sm">
                  <p className="text-sm text-gray-600">{t.seller.totalSales}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">${totalSales.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-[#efe7da] shadow-sm">
                  <p className="text-sm text-gray-600">{t.seller.orders}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{orders.length}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-[#efe7da] shadow-sm">
                  <p className="text-sm text-gray-600">{t.seller.availableBalance}</p>
                  <p className="text-3xl font-bold text-[#c7a86a] mt-2">${availableBalance.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-[#efe7da] shadow-sm">
                  <p className="text-sm text-gray-600">{t.seller.totalItems}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{totalItems}</p>
                </div>
              </div>

              {/* آخر الطلبات والمنتجات */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* آخر الطلبات */}
                <div className="bg-white rounded-2xl p-6 border border-[#efe7da]">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">{t.seller.recentOrders}</h2>
                  {filteredOrders.slice(0, 5).length === 0 ? (
                    <p className="text-gray-600">{t.seller.noOrders}</p>
                  ) : (
                    <div className="space-y-3">
                      {filteredOrders.slice(0, 5).map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-3 bg-[#f7f4ef] rounded-lg"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">
                              {lang === "ar" ? "الطلب" : "Order"} #{order.id.slice(0, 8)}
                            </p>
                            <p className="text-xs text-gray-600">
                              {new Date(order.createdAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US")}
                            </p>
                          </div>
                          <p className="font-bold text-gray-900">${order.total.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* أفضل المنتجات */}
                <div className="bg-white rounded-2xl p-6 border border-[#efe7da]">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">{t.seller.topProducts}</h2>
                  {products.length === 0 ? (
                    <p className="text-gray-600">{t.seller.noProducts}</p>
                  ) : (
                    <div className="space-y-3">
                      {products.slice(0, 5).map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 bg-[#f7f4ef] rounded-lg"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">
                              {lang === "ar" ? product.nameAr : product.name}
                            </p>
                            <p className="text-xs text-gray-600">${product.price}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                product.inStock
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {product.inStock
                                ? lang === "ar"
                                  ? "متوفر"
                                  : "In Stock"
                                : t.seller.outOfStock}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* إدارة الطلبات */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-[#efe7da] rounded-lg bg-white"
                >
                  <option value="all">{t.seller.allOrders}</option>
                  <option value="pending">{t.seller.pending}</option>
                  <option value="completed">{t.seller.completed}</option>
                </select>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 border border-[#efe7da] text-center">
                  <p className="text-gray-600">{t.seller.noOrders}</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl overflow-hidden border border-[#efe7da]">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#efe7da] bg-[#f7f4ef]">
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                            {lang === "ar" ? "رقم الطلب" : "Order ID"}
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                            {lang === "ar" ? "التاريخ" : "Date"}
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                            {lang === "ar" ? "المبلغ" : "Amount"}
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                            {lang === "ar" ? "الحالة" : "Status"}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrders.map((order) => (
                          <tr key={order.id} className="border-b border-[#efe7da]">
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {order.id.slice(0, 8)}...
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {new Date(order.createdAt).toLocaleDateString(
                                lang === "ar" ? "ar-SA" : "en-US"
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                              ${order.total.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  (order.status || "pending") === "pending"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {order.status === "completed" ? t.seller.completed : t.seller.pending}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* إدارة المنتجات */}
          {activeTab === "products" && (
            <div className="space-y-6">
              <Link
                href="/seller/dashboard?tab=add-product"
                className="inline-block px-6 py-3 rounded-full bg-[#c7a86a] text-black font-semibold hover:bg-[#b59659] transition"
              >
                {lang === "ar" ? "إضافة منتج جديد" : "Add New Product"}
              </Link>

              {products.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 border border-[#efe7da] text-center">
                  <p className="text-gray-600">{t.seller.noProducts}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl overflow-hidden border border-[#efe7da] shadow-sm hover:shadow-lg transition"
                    >
                      <div className="relative h-48">
                        <Image
                          src={product.image}
                          alt={lang === "ar" ? product.nameAr : product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {lang === "ar" ? product.nameAr : product.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">${product.price}</p>
                        <div className="flex gap-2 mt-4">
                          <button className="flex-1 px-3 py-2 bg-[#c7a86a] text-black text-sm font-semibold rounded-lg hover:bg-[#b59659] transition flex items-center justify-center gap-2">
                            <Edit2 size={16} />
                            {lang === "ar" ? "تعديل" : "Edit"}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(product.id)}
                            className="px-3 py-2 border border-red-300 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* السحب */}
          {activeTab === "withdrawals" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-[#efe7da]">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">{t.seller.totalSales}</p>
                    <p className="text-2xl font-bold text-gray-900">${totalSales.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{lang === "ar" ? "تم السحب" : "Withdrawn"}</p>
                    <p className="text-2xl font-bold text-gray-900">${withdrawnTotal.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{t.seller.availableBalance}</p>
                    <p className="text-2xl font-bold text-[#c7a86a]">${availableBalance.toFixed(2)}</p>
                  </div>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    // يتم التعامل مع طلب السحب هنا
                  }}
                  className="space-y-4 border-t border-[#efe7da] pt-6"
                >
                  <input
                    type="number"
                    min="0"
                    placeholder={lang === "ar" ? "مبلغ السحب" : "Withdrawal amount"}
                    className="w-full border border-[#efe7da] rounded-lg px-4 py-3"
                  />
                  <button
                    type="submit"
                    className="w-full px-4 py-3 bg-[#c7a86a] text-black font-semibold rounded-lg hover:bg-[#b59659] transition"
                  >
                    {t.seller.requestWithdrawal}
                  </button>
                </form>
              </div>

              {withdrawals.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 border border-[#efe7da] text-center">
                  <p className="text-gray-600">{t.seller.noWithdrawals}</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl overflow-hidden border border-[#efe7da]">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#efe7da] bg-[#f7f4ef]">
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                            {lang === "ar" ? "المبلغ" : "Amount"}
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                            {lang === "ar" ? "التاريخ" : "Date"}
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                            {lang === "ar" ? "الحالة" : "Status"}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {withdrawals.map((withdrawal) => (
                          <tr key={withdrawal.id} className="border-b border-[#efe7da]">
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                              ${withdrawal.amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {new Date(withdrawal.createdAt).toLocaleDateString(
                                lang === "ar" ? "ar-SA" : "en-US"
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  withdrawal.status === "pending"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : withdrawal.status === "approved"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                }`}
                              >
                                {withdrawal.status === "pending"
                                  ? t.seller.pending
                                  : withdrawal.status === "approved"
                                    ? t.seller.approved
                                    : t.seller.rejected}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* التحليلات */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-[#efe7da]">
                  <p className="text-sm text-gray-600">{t.seller.averageOrderValue}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">${averageOrderValue.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-[#efe7da]">
                  <p className="text-sm text-gray-600">{t.seller.pendingOrders}</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">{pendingOrders}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-[#efe7da]">
                  <p className="text-sm text-gray-600">{t.seller.completedOrders}</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{completedOrders}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-[#efe7da]">
                  <p className="text-sm text-gray-600">{lang === "ar" ? "معدل النجاح" : "Success Rate"}</p>
                  <p className="text-3xl font-bold text-[#c7a86a] mt-2">
                    {completedOrders === 0 ? "0%" : ((completedOrders / orders.length) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-[#efe7da]">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  {lang === "ar" ? "توزيع الطلبات حسب الحالة" : "Order Distribution"}
                </h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-700">{t.seller.pending}</p>
                      <p className="text-sm font-bold text-gray-900">{pendingOrders}</p>
                    </div>
                    <div className="w-full bg-[#efe7da] rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${orders.length > 0 ? (pendingOrders / orders.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-700">{t.seller.completed}</p>
                      <p className="text-sm font-bold text-gray-900">{completedOrders}</p>
                    </div>
                    <div className="w-full bg-[#efe7da] rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${orders.length > 0 ? (completedOrders / orders.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* الإعدادات */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-[#efe7da]">
                <h2 className="text-lg font-bold text-gray-900 mb-4">{t.seller.storeSettings}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {lang === "ar" ? "اسم المتجر" : "Store Name"}
                    </label>
                    <input
                      type="text"
                      value={sellerProfile.storeName}
                      disabled
                      className="w-full border border-[#efe7da] rounded-lg px-4 py-3 bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {lang === "ar" ? "التصنيف" : "Category"}
                    </label>
                    <input
                      type="text"
                      value={sellerProfile.storeCategory}
                      disabled
                      className="w-full border border-[#efe7da] rounded-lg px-4 py-3 bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {lang === "ar" ? "رقم الجوال" : "Phone"}
                    </label>
                    <input
                      type="text"
                      value={sellerProfile.phone}
                      disabled
                      className="w-full border border-[#efe7da] rounded-lg px-4 py-3 bg-gray-100"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    {lang === "ar"
                      ? "لتحديث معلومات المتجر، يرجى التواصل مع الدعم"
                      : "To update store information, please contact support"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* نافذة تأكيد الحذف */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm border border-[#efe7da] shadow-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {lang === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
            </h2>
            <p className="text-gray-600 mb-6">
              {lang === "ar"
                ? "هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء."
                : "Are you sure you want to delete this product? This action cannot be undone."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-[#efe7da] rounded-lg text-gray-900 font-semibold hover:bg-[#f7f4ef] transition"
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={() => handleDeleteProduct(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
              >
                {lang === "ar" ? "حذف" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
