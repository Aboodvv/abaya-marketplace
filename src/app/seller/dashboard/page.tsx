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

  // تحميل المنتجات
  useEffect(() => {
    if (!sellerUser) return;
    const loadProducts = async () => {
      const q = query(collection(db, "products"), where("sellerId", "==", sellerUser.uid));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Product, "id">),
      }));
      setProducts(list);
    };
    loadProducts();
  }, [sellerUser]);

  // تحميل الطلبات
  useEffect(() => {
    if (!sellerUser) return;
    const loadOrders = async () => {
      const snapshot = await getDocs(collection(db, "orders"));
      const list = snapshot.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<SellerOrder, "id">),
        }))
        .filter((order) => order.items?.some((item) => item.sellerId === sellerUser.uid))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(list as SellerOrder[]);
    };
    loadOrders();
  }, [sellerUser]);

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
    if (!sellerUser) return 0;
    return orders.reduce((sum, order) => {
      const sellerItems = order.items.filter((item) => item.sellerId === sellerUser.uid);
      const sellerTotal = sellerItems.reduce(
        (itemSum, item) => itemSum + item.price * item.quantity,
        0
      );
      return sum + sellerTotal;
    }, 0);
  }, [orders, sellerUser]);

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

        {/* محتوى الصفحات - يتم إضافة الأقسام هنا */}
        <div className="p-6">
          {activeTab === "overview" && <div>Coming soon...</div>}
          {activeTab === "orders" && <div>Coming soon...</div>}
          {activeTab === "products" && <div>Coming soon...</div>}
          {activeTab === "withdrawals" && <div>Coming soon...</div>}
          {activeTab === "analytics" && <div>Coming soon...</div>}
          {activeTab === "settings" && <div>Coming soon...</div>}
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
