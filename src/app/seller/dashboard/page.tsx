"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLanguage } from "@/context/LanguageContext";
import { useSeller } from "@/context/SellerContext";
import { Product } from "@/context/CartContext";

interface SellerOrderItem {
  id: string;
  name: string;
  nameAr: string;
  image: string;
  sellerId?: string;
  price: number;
  quantity: number;
}

type SellerOrderStatus = "preparing" | "shipping" | "delivered";

interface SellerOrder {
  id: string;
  items: SellerOrderItem[];
  total: number;
  createdAt: string;
  sellerStatuses?: Record<string, SellerOrderStatus>;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
}

export default function SellerDashboardPage() {
  const { t, lang } = useLanguage();
  const { sellerUser, sellerProfile, loading: sellerLoading, logoutSeller } = useSeller();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    nameAr: "",
    price: "",
    image: "",
    description: "",
    descriptionAr: "",
    category: "",
    categoryAr: "",
    inStock: true,
  });
  const [savingProduct, setSavingProduct] = useState(false);
  const [productError, setProductError] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [savingWithdraw, setSavingWithdraw] = useState(false);
  const approvalStatus =
    sellerProfile?.approvalStatus ?? (sellerProfile?.approved ? "approved" : "pending");
  const isApproved = approvalStatus === "approved";

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

  useEffect(() => {
    if (!sellerUser) return;
    const loadOrders = async () => {
      const snapshot = await getDocs(collection(db, "orders"));
      const list = snapshot.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<SellerOrder, "id">),
        }))
        .filter((order) =>
          order.items?.some((item) => item.sellerId === sellerUser.uid)
        );
      setOrders(list as SellerOrder[]);
    };

    const loadWithdrawals = async () => {
      const q = query(collection(db, "withdrawals"), where("sellerId", "==", sellerUser.uid));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Withdrawal, "id">),
      }));
      setWithdrawals(list as Withdrawal[]);
    };

    loadOrders();
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

  const withdrawnTotal = useMemo(
    () => withdrawals.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [withdrawals]
  );
  const availableBalance = Math.max(0, totalSales - withdrawnTotal);

  const sellerOrders = useMemo(() => {
    if (!sellerUser) return [] as SellerOrder[];
    return orders.filter((order) =>
      order.items?.some((item) => item.sellerId === sellerUser.uid)
    );
  }, [orders, sellerUser]);

  const getSellerStatusLabel = (status: SellerOrderStatus) => {
    switch (status) {
      case "shipping":
        return t.seller.orderStatusShipping;
      case "delivered":
        return t.seller.orderStatusDelivered;
      default:
        return t.seller.orderStatusPreparing;
    }
  };

  const handleProductChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductError("");
    if (!sellerUser || !sellerProfile) return;
    if (!isApproved) {
      setProductError(
        approvalStatus === "rejected"
          ? lang === "ar"
            ? "تم رفض حسابك ولا يمكنك إضافة منتجات"
            : "Your account was rejected and you cannot add products"
          : lang === "ar"
            ? "حسابك قيد المراجعة ولا يمكنك إضافة منتجات بعد"
            : "Your account is under review and you cannot add products yet"
      );
      return;
    }
    setSavingProduct(true);
    await addDoc(collection(db, "products"), {
      ...form,
      price: Number(form.price),
      sellerId: sellerUser.uid,
      sellerName: sellerProfile.name,
      storeName: sellerProfile.storeName,
      createdAt: new Date().toISOString(),
    });
    setForm({
      name: "",
      nameAr: "",
      price: "",
      image: "",
      description: "",
      descriptionAr: "",
      category: "",
      categoryAr: "",
      inStock: true,
    });
    setSavingProduct(false);
    const q = query(collection(db, "products"), where("sellerId", "==", sellerUser.uid));
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<Product, "id">),
    }));
    setProducts(list);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError("");
    if (!sellerUser) return;
    if (!isApproved) {
      setWithdrawError(
        approvalStatus === "rejected"
          ? lang === "ar"
            ? "تم رفض حسابك ولا يمكنك طلب سحب"
            : "Your account was rejected and you cannot request withdrawals"
          : lang === "ar"
            ? "حسابك قيد المراجعة ولا يمكنك طلب سحب بعد"
            : "Your account is under review and you cannot request withdrawals yet"
      );
      return;
    }
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) return;
    setSavingWithdraw(true);
    await addDoc(collection(db, "withdrawals"), {
      sellerId: sellerUser.uid,
      amount,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    setWithdrawAmount("");
    setSavingWithdraw(false);
    const snapshot = await getDocs(
      query(collection(db, "withdrawals"), where("sellerId", "==", sellerUser.uid))
    );
    const list = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<Withdrawal, "id">),
    }));
    setWithdrawals(list as Withdrawal[]);
  };

  const updateOrderStatus = async (orderId: string, status: SellerOrderStatus) => {
    if (!sellerUser) return;
    setUpdatingOrderId(orderId);
    await updateDoc(doc(db, "orders", orderId), {
      [`sellerStatuses.${sellerUser.uid}`]: status,
    });
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              sellerStatuses: {
                ...(order.sellerStatuses || {}),
                [sellerUser.uid]: status,
              },
            }
          : order
      )
    );
    setUpdatingOrderId(null);
  };

  if (sellerLoading) {
    return (
      <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center">
        <p className="text-gray-600">{t.common.loading}</p>
      </div>
    );
  }

  if (!sellerUser) {
    return (
      <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#efe7da] text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {lang === "ar" ? "يجب تسجيل الدخول كبائع" : "Please login as seller"}
          </h1>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/seller/login"
              className="px-6 py-3 rounded-full bg-[#c7a86a] text-black font-semibold"
            >
              {t.seller.login}
            </Link>
            <Link
              href="/seller/register"
              className="px-6 py-3 rounded-full border border-[#c7a86a] text-[#7a5a1f] font-semibold"
            >
              {t.seller.register}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!sellerProfile) {
    return (
      <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#efe7da] text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {lang === "ar" ? "تعذر تحميل ملف البائع" : "Seller profile not available"}
          </h1>
          <p className="text-gray-600 mb-6">
            {lang === "ar"
              ? "تم تسجيل دخولك ولكن بيانات المتجر لم تُحمّل. جرّب تحديث الصفحة."
              : "You are signed in, but we couldn't load your store profile. Please refresh."}
          </p>
          <button
            onClick={logoutSeller}
            className="px-6 py-3 rounded-full border border-[#c7a86a] text-[#c7a86a] hover:bg-[#c7a86a] hover:text-black transition"
          >
            {lang === "ar" ? "تسجيل الخروج" : "Logout"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ef] py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">{t.seller.dashboard}</h1>
            <p className="text-gray-600 mt-2">{sellerProfile.storeName}</p>
          </div>
          <button
            onClick={logoutSeller}
            className="px-5 py-2 rounded-full border border-[#c7a86a] text-[#c7a86a] hover:bg-[#c7a86a] hover:text-black transition"
          >
            {lang === "ar" ? "تسجيل الخروج" : "Logout"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-3xl shadow-xl p-6 border border-[#efe7da]">
            <p className="text-sm text-gray-500">{t.seller.totalSales}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">${totalSales.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-3xl shadow-xl p-6 border border-[#efe7da]">
            <p className="text-sm text-gray-500">{t.seller.orders}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{orders.length}</p>
          </div>
          <div className="bg-white rounded-3xl shadow-xl p-6 border border-[#efe7da]">
            <p className="text-sm text-gray-500">{t.seller.availableBalance}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">${availableBalance.toFixed(2)}</p>
          </div>
        </div>

        {!isApproved && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 mb-10">
            <p className="font-semibold text-amber-800 mb-1">
              {approvalStatus === "rejected"
                ? lang === "ar"
                  ? "تم رفض تسجيلك كبائع"
                  : "Your seller registration was rejected"
                : lang === "ar"
                  ? "تسجيلك كبائع قيد المراجعة"
                  : "Your seller registration is under review"}
            </p>
            <p className="text-sm text-amber-700">
              {approvalStatus === "rejected"
                ? lang === "ar"
                  ? "يرجى التواصل مع الإدارة لمزيد من التفاصيل."
                  : "Please contact admin for more details."
                : lang === "ar"
                  ? "سيتم تفعيل إضافة المنتجات بعد الموافقة."
                  : "You can add products after approval."}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <div className="bg-white rounded-3xl shadow-xl p-6 border border-[#efe7da]">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.seller.addProduct}</h2>
            {productError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                {productError}
              </div>
            )}
            <form onSubmit={handleAddProduct} className="space-y-4">
              <input
                name="name"
                value={form.name}
                onChange={handleProductChange}
                placeholder={lang === "ar" ? "الاسم (EN)" : "Name (EN)"}
                className="w-full border border-[#efe7da] rounded-full px-4 py-3"
                disabled={!isApproved}
                required
              />
              <input
                name="nameAr"
                value={form.nameAr}
                onChange={handleProductChange}
                placeholder={lang === "ar" ? "الاسم (AR)" : "Name (AR)"}
                className="w-full border border-[#efe7da] rounded-full px-4 py-3"
                disabled={!isApproved}
                required
              />
              <input
                name="price"
                type="number"
                min="0"
                value={form.price}
                onChange={handleProductChange}
                placeholder={t.admin.price}
                className="w-full border border-[#efe7da] rounded-full px-4 py-3"
                disabled={!isApproved}
                required
              />
              <input
                name="image"
                value={form.image}
                onChange={handleProductChange}
                placeholder={t.admin.image}
                className="w-full border border-[#efe7da] rounded-full px-4 py-3"
                disabled={!isApproved}
                required
              />
              <textarea
                name="description"
                value={form.description}
                onChange={handleProductChange}
                placeholder={t.admin.descriptionEn}
                className="w-full border border-[#efe7da] rounded-3xl px-4 py-3"
                disabled={!isApproved}
                rows={2}
              />
              <textarea
                name="descriptionAr"
                value={form.descriptionAr}
                onChange={handleProductChange}
                placeholder={t.admin.descriptionAr}
                className="w-full border border-[#efe7da] rounded-3xl px-4 py-3"
                disabled={!isApproved}
                rows={2}
              />
              <input
                name="category"
                value={form.category}
                onChange={handleProductChange}
                placeholder={t.admin.categoryEn}
                className="w-full border border-[#efe7da] rounded-full px-4 py-3"
                disabled={!isApproved}
                required
              />
              <input
                name="categoryAr"
                value={form.categoryAr}
                onChange={handleProductChange}
                placeholder={t.admin.categoryAr}
                className="w-full border border-[#efe7da] rounded-full px-4 py-3"
                disabled={!isApproved}
                required
              />
              <label className="flex items-center gap-2 text-gray-700">
                <input
                  type="checkbox"
                  name="inStock"
                  checked={form.inStock}
                  onChange={handleProductChange}
                  disabled={!isApproved}
                />
                {t.admin.inStock}
              </label>
              <button
                type="submit"
                disabled={savingProduct || !isApproved}
                className={`w-full py-3 rounded-full font-semibold transition ${
                  savingProduct || !isApproved
                    ? "bg-gray-300"
                    : "bg-[#c7a86a] text-black hover:bg-[#b59659]"
                }`}
              >
                {savingProduct ? t.common.loading : t.seller.addProduct}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-6 border border-[#efe7da]">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.seller.wallet}</h2>
            <div className="space-y-3 mb-6">
              <p className="text-gray-600">
                {t.seller.totalSales}: <span className="font-semibold">${totalSales.toFixed(2)}</span>
              </p>
              <p className="text-gray-600">
                {t.seller.availableBalance}:{" "}
                <span className="font-semibold">${availableBalance.toFixed(2)}</span>
              </p>
            </div>
            {withdrawError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                {withdrawError}
              </div>
            )}
            <form onSubmit={handleWithdraw} className="space-y-4">
              <input
                type="number"
                min="0"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder={lang === "ar" ? "مبلغ السحب" : "Withdraw amount"}
                className="w-full border border-[#efe7da] rounded-full px-4 py-3"
                disabled={!isApproved}
                required
              />
              <button
                type="submit"
                disabled={savingWithdraw || !isApproved}
                className={`w-full py-3 rounded-full font-semibold transition ${
                  savingWithdraw || !isApproved
                    ? "bg-gray-300"
                    : "bg-[#c7a86a] text-black hover:bg-[#b59659]"
                }`}
              >
                {savingWithdraw ? t.common.loading : t.seller.withdraw}
              </button>
            </form>
            <div className="mt-6 space-y-3">
              {withdrawals.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm text-gray-600">
                  <span>${Number(item.amount).toFixed(2)}</span>
                  <span>{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 mb-10 border border-[#efe7da]">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.seller.orders}</h2>
          {sellerOrders.length === 0 ? (
            <p className="text-gray-600">{t.seller.ordersEmpty}</p>
          ) : (
            <div className="space-y-4">
              {sellerOrders.map((order) => {
                const sellerItems = order.items.filter(
                  (item) => item.sellerId === sellerUser.uid
                );
                const sellerTotal = sellerItems.reduce(
                  (sum, item) => sum + item.price * item.quantity,
                  0
                );
                const currentStatus =
                  order.sellerStatuses?.[sellerUser.uid] ?? "preparing";

                return (
                  <div
                    key={order.id}
                    className="border border-[#efe7da] rounded-3xl p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-gray-500">{t.orders.orderId}</p>
                        <p className="font-semibold text-gray-900">{order.id}</p>
                        <p className="text-sm text-gray-600">
                          {t.orders.date}: {" "}
                          {new Date(order.createdAt).toLocaleString(
                            lang === "ar" ? "ar-SA" : "en-US"
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{t.cart.total}</p>
                        <p className="font-semibold text-gray-900">
                          ${sellerTotal.toFixed(2)}
                        </p>
                        <span className="inline-flex mt-2 px-3 py-1 rounded-full bg-[#f7f4ef] text-[#7a5a1f] text-sm font-semibold">
                          {getSellerStatusLabel(currentStatus)}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-2">
                          {t.seller.orderStatusLabel}
                        </label>
                        <select
                          value={currentStatus}
                          onChange={(event) =>
                            updateOrderStatus(
                              order.id,
                              event.target.value as SellerOrderStatus
                            )
                          }
                          disabled={updatingOrderId === order.id}
                          className="border border-[#efe7da] rounded-full px-4 py-2"
                        >
                          <option value="preparing">
                            {t.seller.orderStatusPreparing}
                          </option>
                          <option value="shipping">
                            {t.seller.orderStatusShipping}
                          </option>
                          <option value="delivered">
                            {t.seller.orderStatusDelivered}
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {sellerItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-4">
                          <div className="relative w-14 h-14 rounded-2xl overflow-hidden">
                            <Image
                              src={item.image}
                              alt={lang === "ar" ? item.nameAr : item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {lang === "ar" ? item.nameAr : item.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {t.cart.quantity}: {item.quantity}
                            </p>
                          </div>
                          <p className="font-semibold text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-[#efe7da]">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.seller.myProducts}</h2>
          {products.length === 0 ? (
            <p className="text-gray-600">{lang === "ar" ? "لا توجد منتجات بعد" : "No products yet"}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="border border-[#efe7da] rounded-2xl overflow-hidden">
                  <div className="relative h-40">
                    <Image
                      src={product.image}
                      alt={lang === "ar" ? product.nameAr : product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900">
                      {lang === "ar" ? product.nameAr : product.name}
                    </h3>
                    <p className="text-sm text-gray-600">${product.price}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
