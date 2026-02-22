"use client";

import { useEffect } from "react";
import { getAuth } from "firebase/auth";

// فحص claims عند الدخول باستخدام dynamic import
useEffect(() => {
  import("firebase/auth").then(({ getAuth }) => {
    const auth = getAuth();
    auth.currentUser?.getIdTokenResult().then(res => {
      console.log("CLAIMS:", res.claims);
    });
  });
}, []);

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useAdminAccess } from "@/lib/adminAccess";

interface AdminProduct {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  image: string;
  description: string;
  descriptionAr: string;
  category: string;
  categoryAr: string;
  inStock: boolean;
  createdAt: string;
}

interface WithdrawalRequest {
  id: string;
  sellerId: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface SellerInfo {
  name: string;
  phone: string;
  storeName: string;
}

interface SellerReview {
  id: string;
  name: string;
  phone: string;
  storeName: string;
  storeCategory: string;
  documentUrl: string;
  username: string;
  createdAt: string;
  approvalStatus?: "pending" | "approved" | "rejected";
  approvedAt?: string | null;
}

const emptyProduct = {
  name: "",
  nameAr: "",
  price: 0,
  image: "",
  description: "",
  descriptionAr: "",
  category: "",
  categoryAr: "",
  inStock: true,
};

export default function AdminPage() {

  const { lang, t } = useLanguage();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    import("firebase/auth").then(({ getAuth }) => {
      const auth = getAuth();
      if (!auth.currentUser) {
        setIsAdmin(false);
        setAuthLoading(false);
        return;
      }
      auth.currentUser.getIdTokenResult().then(res => {
        setIsAdmin(res.claims.admin === true);
        setAuthLoading(false);
      });
    });
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const snapshot = await getDocs(productsRef);
    const list = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<AdminProduct, "id">),
    }));
    setProducts(list);
    setLoading(false);
  };

  useEffect(() => {
    if (!canAccess || !showProducts) return;
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccess, showProducts]);

  useEffect(() => {
    if (!canAccess || !showSellers) return;
    const loadSellers = async () => {
      setLoadingSellers(true);
      const snapshot = await getDocs(collection(db, "sellers"));
      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<SellerReview, "id">),
      }));
      setSellers(list as SellerReview[]);
      setLoadingSellers(false);
    };

    loadSellers();
  }, [canAccess, showSellers]);

  useEffect(() => {
    if (!canAccess || !showWithdrawals) return;
    const loadWithdrawals = async () => {
      setLoadingWithdrawals(true);
      const snapshot = await getDocs(collection(db, "withdrawals"));
      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<WithdrawalRequest, "id">),
      }));
      setWithdrawals(list);
      const sellerIds = Array.from(new Set(list.map((item) => item.sellerId)));
      if (sellerIds.length > 0) {
        const entries = await Promise.all(
          sellerIds.map(async (sellerId) => {
            const sellerSnap = await getDoc(doc(db, "sellers", sellerId));
            if (!sellerSnap.exists()) return [sellerId, undefined] as const;
            const data = sellerSnap.data() as SellerInfo;
            return [sellerId, data] as const;
          })
        );
        const map: Record<string, SellerInfo> = {};
        entries.forEach(([sellerId, info]) => {
          if (info) map[sellerId] = info;
        });
        setSellerLookup(map);
      }
      setLoadingWithdrawals(false);
    };

    loadWithdrawals();
  }, [canAccess, showWithdrawals]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setAdminError("");
    try {
      await addDoc(productsRef, {
        ...form,
        price: Number(form.price),
        sellerId: "platform@abaya.local",
        sellerName: "Abaya Store",
        storeName: "Abaya Store",
        createdAt: new Date().toISOString(),
      });
      setForm(emptyProduct);
      await loadProducts();
    } catch (err: any) {
      setAdminError(err.message || "حدث خطأ أثناء إضافة المنتج");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product: AdminProduct) => {
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      nameAr: product.nameAr,
      price: product.price,
      image: product.image,
      description: product.description,
      descriptionAr: product.descriptionAr,
      category: product.category,
      categoryAr: product.categoryAr,
      inStock: product.inStock,
    });
  };

  const handleUpdate = async (productId: string) => {
    setSaving(true);
    setAdminError("");
    try {
      const productRef = doc(db, "products", productId);
      await updateDoc(productRef, {
        ...editForm,
        price: Number(editForm.price),
      });
      setEditingId(null);
      await loadProducts();
    } catch (err: any) {
      setAdminError(err.message || "حدث خطأ أثناء تحديث المنتج");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId: string) => {
    setAdminError("");
    try {
      await deleteDoc(doc(db, "products", productId));
      await loadProducts();
    } catch (err: any) {
      setAdminError(err.message || "حدث خطأ أثناء حذف المنتج");
    }
  };

  const updateWithdrawalStatus = async (withdrawalId: string, status: string) => {
    setUpdatingWithdrawals(withdrawalId);
    setAdminError("");
    try {
      await updateDoc(doc(db, "withdrawals", withdrawalId), { status });
      const snapshot = await getDocs(collection(db, "withdrawals"));
      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<WithdrawalRequest, "id">),
      }));
      setWithdrawals(list);
      const sellerIds = Array.from(new Set(list.map((item) => item.sellerId)));
      if (sellerIds.length > 0) {
        const entries = await Promise.all(
          sellerIds.map(async (sellerId) => {
            const sellerSnap = await getDoc(doc(db, "sellers", sellerId));
            if (!sellerSnap.exists()) return [sellerId, undefined] as const;
            const data = sellerSnap.data() as SellerInfo;
            return [sellerId, data] as const;
          })
        );
        const map: Record<string, SellerInfo> = {};
        entries.forEach(([sellerId, info]) => {
          if (info) map[sellerId] = info;
        });
        setSellerLookup(map);
      }
    } catch (err: any) {
      setAdminError(err.message || "حدث خطأ أثناء تحديث حالة السحب");
    } finally {
      setUpdatingWithdrawals(null);
    }
  };

  const updateSellerStatus = async (
    sellerId: string,
    status: "pending" | "approved" | "rejected"
  ) => {
    setUpdatingSeller(sellerId);
    setAdminError("");
    try {
      await updateDoc(doc(db, "sellers", sellerId), {
        approvalStatus: status,
        approved: status === "approved",
        approvedAt: status === "approved" ? new Date().toISOString() : null,
      });
      const snapshot = await getDocs(collection(db, "sellers"));
      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<SellerReview, "id">),
      }));
      setSellers(list as SellerReview[]);
    } catch (err: any) {
      setAdminError(err.message || "حدث خطأ أثناء تحديث حالة البائع");
    } finally {
      setUpdatingSeller(null);
    }
  };

  if (authLoading || accessLoading) {
    return (
      <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center">
        <p className="text-gray-600">{t.common.loading}</p>
      </div>
    );
  }

  // عرض رسالة الخطأ العامة للإدارة
  const renderAdminError = () =>
    adminError ? (
      <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-center font-bold">
        {adminError}
      </div>
    ) : null;

  // --- ضع عرض رسالة الخطأ أعلى الصفحة ---

  // ...existing code...

  // JSX الرئيسي للصفحة
  return (
    <div>
      {renderAdminError()}
      {/* ...باقي الصفحة... */}
    </div>
  );

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

  if (!canAccess) {
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
          <p className="text-xs uppercase tracking-[0.3em] text-[#c7a86a] mb-2">
            {lang === "ar" ? "الإدارة" : "Admin"}
          </p>
          <h1 className="text-4xl font-bold text-gray-900">
            {t.admin.title}
          </h1>
        </div>

        {(showOrders || showCustomers || showCoupons || showShipping || showRoles) && (
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 border border-[#efe7da]">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                {t.adminModules.title}
              </h2>
              <p className="text-gray-600 text-sm mt-2">
                {t.adminModules.subtitle}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {showOrders && (
                <Link
                  href="/admin/orders"
                  className="border border-[#efe7da] rounded-3xl p-4 hover:border-[#c7a86a] transition"
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t.adminModules.orders.title}
                  </h3>
                  <p className="text-gray-600 text-sm mt-2">
                    {t.adminModules.orders.subtitle}
                  </p>
                  <span className="inline-flex mt-4 text-sm font-semibold text-[#c7a86a]">
                    {t.adminModules.orders.cta}
                  </span>
                </Link>
              )}
              {showCustomers && (
                <Link
                  href="/admin/customers"
                  className="border border-[#efe7da] rounded-3xl p-4 hover:border-[#c7a86a] transition"
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t.adminModules.customers.title}
                  </h3>
                  <p className="text-gray-600 text-sm mt-2">
                    {t.adminModules.customers.subtitle}
                  </p>
                  <span className="inline-flex mt-4 text-sm font-semibold text-[#c7a86a]">
                    {t.adminModules.customers.cta}
                  </span>
                </Link>
              )}
              {showCoupons && (
                <Link
                  href="/admin/coupons"
                  className="border border-[#efe7da] rounded-3xl p-4 hover:border-[#c7a86a] transition"
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t.adminModules.coupons.title}
                  </h3>
                  <p className="text-gray-600 text-sm mt-2">
                    {t.adminModules.coupons.subtitle}
                  </p>
                  <span className="inline-flex mt-4 text-sm font-semibold text-[#c7a86a]">
                    {t.adminModules.coupons.cta}
                  </span>
                </Link>
              )}
              {showShipping && (
                <Link
                  href="/admin/shipping"
                  className="border border-[#efe7da] rounded-3xl p-4 hover:border-[#c7a86a] transition"
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t.adminModules.shipping.title}
                  </h3>
                  <p className="text-gray-600 text-sm mt-2">
                    {t.adminModules.shipping.subtitle}
                  </p>
                  <span className="inline-flex mt-4 text-sm font-semibold text-[#c7a86a]">
                    {t.adminModules.shipping.cta}
                  </span>
                </Link>
              )}
              {showRoles && (
                <Link
                  href="/admin/roles"
                  className="border border-[#efe7da] rounded-3xl p-4 hover:border-[#c7a86a] transition"
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t.adminModules.roles.title}
                  </h3>
                  <p className="text-gray-600 text-sm mt-2">
                    {t.adminModules.roles.subtitle}
                  </p>
                  <span className="inline-flex mt-4 text-sm font-semibold text-[#c7a86a]">
                    {t.adminModules.roles.cta}
                  </span>
                </Link>
              )}
            </div>
          </div>
        )}

        {showBanners && (
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 border border-[#efe7da]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {lang === "ar" ? "بنرات الصفحة الرئيسية" : "Home Banners"}
                </h2>
                <p className="text-gray-600 text-sm mt-2">
                  {lang === "ar"
                    ? "تحكم بصور البنرات الإعلانية من لوحة مخصصة."
                    : "Manage ad banner images from a dedicated panel."}
                </p>
              </div>
              <Link
                href="/admin/banners"
                className="inline-flex px-5 py-2 rounded-full bg-[#c7a86a] text-black font-semibold hover:bg-[#b59659] transition"
              >
                {lang === "ar" ? "فتح لوحة البنرات" : "Open banner panel"}
              </Link>
            </div>
          </div>
        )}

        {showPages && (
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 border border-[#efe7da]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {t.adminPages.sectionTitle}
                </h2>
                <p className="text-gray-600 text-sm mt-2">
                  {t.adminPages.sectionSubtitle}
                </p>
              </div>
              <Link
                href="/admin/pages"
                className="inline-flex px-5 py-2 rounded-full bg-[#c7a86a] text-black font-semibold hover:bg-[#b59659] transition"
              >
                {t.adminPages.openPanel}
              </Link>
            </div>
          </div>
        )}

        {showMarketing && (
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 border border-[#efe7da]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {t.adminMarketing.sectionTitle}
                </h2>
                <p className="text-gray-600 text-sm mt-2">
                  {t.adminMarketing.sectionSubtitle}
                </p>
              </div>
              <Link
                href="/admin/marketing"
                className="inline-flex px-5 py-2 rounded-full bg-[#c7a86a] text-black font-semibold hover:bg-[#b59659] transition"
              >
                {t.adminMarketing.openPanel}
              </Link>
            </div>
          </div>
        )}

        {showSellers && (
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 border border-[#efe7da]">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {lang === "ar" ? "مراجعة البائعين" : "Seller Approvals"}
                </h2>
                <p className="text-gray-600 text-sm mt-2">
                  {lang === "ar"
                    ? "لا يمكن للبائع إضافة منتجات قبل الموافقة."
                    : "Sellers cannot add products before approval."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-gray-600">
                  {lang === "ar" ? "الحالة" : "Status"}
                </span>
                <select
                  value={sellerFilter}
                  onChange={(event) => setSellerFilter(event.target.value)}
                  className="border border-[#efe7da] rounded-full px-4 py-2"
                >
                  <option value="all">{lang === "ar" ? "الكل" : "All"}</option>
                  <option value="pending">{lang === "ar" ? "قيد المراجعة" : "Pending"}</option>
                  <option value="approved">{lang === "ar" ? "مقبول" : "Approved"}</option>
                  <option value="rejected">{lang === "ar" ? "مرفوض" : "Rejected"}</option>
                </select>
                <input
                  value={sellerSearch}
                  onChange={(event) => setSellerSearch(event.target.value)}
                  placeholder={lang === "ar" ? "بحث بالمتجر أو الجوال" : "Search store or phone"}
                  className="border border-[#efe7da] rounded-full px-4 py-2"
                />
              </div>
            </div>

            {loadingSellers ? (
              <p className="text-gray-600">{t.common.loading}</p>
            ) : sellers
                .filter((seller) =>
                  sellerFilter === "all"
                    ? true
                    : (seller.approvalStatus || "pending") === sellerFilter
                )
                .filter((seller) => {
                  const query = sellerSearch.trim().toLowerCase();
                  if (!query) return true;
                  const storeName = seller.storeName?.toLowerCase() || "";
                  const phone = seller.phone?.toLowerCase() || "";
                  return storeName.includes(query) || phone.includes(query);
                }).length === 0 ? (
              <p className="text-gray-600">
                {lang === "ar" ? "لا يوجد بائعون" : "No sellers found"}
              </p>
            ) : (
              <div className="space-y-4">
                {sellers
                  .filter((seller) =>
                    sellerFilter === "all"
                      ? true
                      : (seller.approvalStatus || "pending") === sellerFilter
                  )
                  .filter((seller) => {
                    const query = sellerSearch.trim().toLowerCase();
                    if (!query) return true;
                    const storeName = seller.storeName?.toLowerCase() || "";
                    const phone = seller.phone?.toLowerCase() || "";
                    return storeName.includes(query) || phone.includes(query);
                  })
                  .map((seller) => (
                    <div
                      key={seller.id}
                      className="border border-[#efe7da] rounded-3xl p-4 flex flex-wrap items-center justify-between gap-4"
                    >
                      <div>
                        <p className="text-sm text-gray-500">
                          {lang === "ar" ? "المتجر" : "Store"}
                        </p>
                        <p className="font-semibold text-gray-900">{seller.storeName}</p>
                        <p className="text-sm text-gray-600">{seller.name}</p>
                        <p className="text-sm text-gray-600">{seller.phone}</p>
                        <p className="text-sm text-gray-600">{seller.storeCategory}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          {lang === "ar" ? "الحالة" : "Status"}
                        </p>
                        <p className="font-semibold text-gray-900">
                          {seller.approvalStatus || "pending"}
                        </p>
                        {seller.documentUrl && (
                          <a
                            href={seller.documentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-[#c7a86a] font-semibold hover:underline"
                          >
                            {lang === "ar" ? "عرض الوثيقة" : "View document"}
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateSellerStatus(seller.id, "approved")}
                          disabled={updatingSeller === seller.id}
                          className="px-4 py-2 rounded-full bg-[#c7a86a] text-black font-semibold hover:bg-[#b59659]"
                        >
                          {lang === "ar" ? "موافقة" : "Approve"}
                        </button>
                        <button
                          onClick={() => updateSellerStatus(seller.id, "rejected")}
                          disabled={updatingSeller === seller.id}
                          className="px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700"
                        >
                          {lang === "ar" ? "رفض" : "Reject"}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {showProducts && (
          <div
            id="admin-products"
            className="bg-white rounded-3xl shadow-xl p-6 mb-6 border border-[#efe7da]"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t.admin.addProduct}
            </h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder={t.admin.nameEn}
                className="border border-[#efe7da] rounded-full px-4 py-3"
                required
              />
              <input
                name="nameAr"
                value={form.nameAr}
                onChange={handleChange}
                placeholder={t.admin.nameAr}
                className="border border-[#efe7da] rounded-full px-4 py-3"
                required
              />
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                placeholder={t.admin.price}
                className="border border-[#efe7da] rounded-full px-4 py-3"
                required
              />
              <input
                name="image"
                value={form.image}
                onChange={handleChange}
                placeholder={t.admin.image}
                className="border border-[#efe7da] rounded-full px-4 py-3"
                required
              />
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder={t.admin.descriptionEn}
                className="border border-[#efe7da] rounded-3xl px-4 py-3 md:col-span-2"
                rows={2}
              />
              <textarea
                name="descriptionAr"
                value={form.descriptionAr}
                onChange={handleChange}
                placeholder={t.admin.descriptionAr}
                className="border border-[#efe7da] rounded-3xl px-4 py-3 md:col-span-2"
                rows={2}
              />
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder={t.admin.categoryEn}
                className="border border-[#efe7da] rounded-full px-4 py-3"
                required
              />
              <input
                name="categoryAr"
                value={form.categoryAr}
                onChange={handleChange}
                placeholder={t.admin.categoryAr}
                className="border border-[#efe7da] rounded-full px-4 py-3"
                required
              />
              <label className="flex items-center gap-2 text-gray-700">
                <input
                  type="checkbox"
                  name="inStock"
                  checked={form.inStock}
                  onChange={handleChange}
                />
                {t.admin.inStock}
              </label>
              <button
                type="submit"
                disabled={saving}
                className={`md:col-span-2 px-6 py-3 rounded-full font-semibold ${
                  saving
                    ? "bg-gray-300"
                    : "bg-[#c7a86a] text-black hover:bg-[#b59659]"
                }`}
              >
                {saving ? t.common.loading : t.admin.save}
              </button>
            </form>
          </div>
        )}

        {showWithdrawals && (
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-10 border border-[#efe7da]">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {lang === "ar" ? "طلبات سحب الأرباح" : "Withdrawal Requests"}
            </h2>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="text-sm text-gray-600">
                {lang === "ar" ? "فلترة" : "Filter"}
              </span>
              <select
                value={withdrawalFilter}
                onChange={(event) => setWithdrawalFilter(event.target.value)}
                className="border border-[#efe7da] rounded-full px-4 py-2"
              >
                <option value="all">{lang === "ar" ? "الكل" : "All"}</option>
                <option value="pending">{lang === "ar" ? "قيد المراجعة" : "Pending"}</option>
                <option value="approved">{lang === "ar" ? "مقبول" : "Approved"}</option>
                <option value="rejected">{lang === "ar" ? "مرفوض" : "Rejected"}</option>
              </select>
              <input
                value={withdrawalSearch}
                onChange={(event) => setWithdrawalSearch(event.target.value)}
                placeholder={lang === "ar" ? "بحث بالمتجر أو الجوال" : "Search store or phone"}
                className="border border-[#efe7da] rounded-full px-4 py-2"
              />
              <select
                value={withdrawalSort}
                onChange={(event) => setWithdrawalSort(event.target.value)}
                className="border border-[#efe7da] rounded-full px-4 py-2"
              >
                <option value="newest">{lang === "ar" ? "الأحدث" : "Newest"}</option>
                <option value="oldest">{lang === "ar" ? "الأقدم" : "Oldest"}</option>
              </select>
              <span className="text-sm text-gray-600">
                {lang === "ar" ? "من" : "From"}
              </span>
              <input
                type="date"
                value={withdrawalFrom}
                onChange={(event) => setWithdrawalFrom(event.target.value)}
                className="border border-[#efe7da] rounded-full px-4 py-2"
              />
              <span className="text-sm text-gray-600">
                {lang === "ar" ? "إلى" : "To"}
              </span>
              <input
                type="date"
                value={withdrawalTo}
                onChange={(event) => setWithdrawalTo(event.target.value)}
                className="border border-[#efe7da] rounded-full px-4 py-2"
              />
              <button
                type="button"
                onClick={() => {
                  setWithdrawalFilter("all");
                  setWithdrawalSearch("");
                  setWithdrawalFrom("");
                  setWithdrawalTo("");
                }}
                className="border border-[#efe7da] rounded-full px-4 py-2 text-sm"
              >
                {lang === "ar" ? "مسح الفلاتر" : "Clear filters"}
              </button>
            </div>
            {loadingWithdrawals ? (
              <p className="text-gray-600">{t.common.loading}</p>
            ) : withdrawals
                .filter((request) =>
                  withdrawalFilter === "all" ? true : request.status === withdrawalFilter
                )
                .filter((request) => {
                  const query = withdrawalSearch.trim().toLowerCase();
                  if (!query) return true;
                  const seller = sellerLookup[request.sellerId];
                  const storeName = seller?.storeName?.toLowerCase() || "";
                  const phone = seller?.phone?.toLowerCase() || "";
                  return storeName.includes(query) || phone.includes(query);
                })
                .filter((request) => {
                  if (!withdrawalFrom && !withdrawalTo) return true;
                  const created = new Date(request.createdAt).setHours(0, 0, 0, 0);
                  const from = withdrawalFrom
                    ? new Date(withdrawalFrom).setHours(0, 0, 0, 0)
                    : null;
                  const to = withdrawalTo
                    ? new Date(withdrawalTo).setHours(23, 59, 59, 999)
                    : null;
                  if (from !== null && created < from) return false;
                  if (to !== null && created > to) return false;
                  return true;
                })
                .sort(
                  (a, b) =>
                    withdrawalSort === "newest"
                      ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                      : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                ).length === 0 ? (
              <p className="text-gray-600">
                {lang === "ar" ? "لا توجد طلبات سحب" : "No withdrawal requests"}
              </p>
            ) : (
              <div className="space-y-4">
                {withdrawals
                  .filter((request) =>
                    withdrawalFilter === "all" ? true : request.status === withdrawalFilter
                  )
                  .filter((request) => {
                    const query = withdrawalSearch.trim().toLowerCase();
                    if (!query) return true;
                    const seller = sellerLookup[request.sellerId];
                    const storeName = seller?.storeName?.toLowerCase() || "";
                    const phone = seller?.phone?.toLowerCase() || "";
                    return storeName.includes(query) || phone.includes(query);
                  })
                  .filter((request) => {
                    if (!withdrawalFrom && !withdrawalTo) return true;
                    const created = new Date(request.createdAt).setHours(0, 0, 0, 0);
                    const from = withdrawalFrom
                      ? new Date(withdrawalFrom).setHours(0, 0, 0, 0)
                      : null;
                    const to = withdrawalTo
                      ? new Date(withdrawalTo).setHours(23, 59, 59, 999)
                      : null;
                    if (from !== null && created < from) return false;
                    if (to !== null && created > to) return false;
                    return true;
                  })
                  .sort(
                    (a, b) =>
                      withdrawalSort === "newest"
                        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                  )
                  .map((request) => (
                    <div
                      key={request.id}
                      className="border border-[#efe7da] rounded-3xl p-4 flex flex-wrap items-center justify-between gap-4"
                    >
                      <div>
                        <p className="text-sm text-gray-500">
                          {lang === "ar" ? "البائع" : "Seller"}
                        </p>
                        <p className="font-semibold text-gray-900">
                          {sellerLookup[request.sellerId]?.storeName || request.sellerId}
                        </p>
                        <p className="text-sm text-gray-600">
                          {sellerLookup[request.sellerId]?.name || "-"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {sellerLookup[request.sellerId]?.phone || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          {lang === "ar" ? "المبلغ" : "Amount"}
                        </p>
                        <p className="font-semibold text-gray-900">
                          ${Number(request.amount).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          {lang === "ar" ? "الحالة" : "Status"}
                        </p>
                        <p className="font-semibold text-gray-900">{request.status}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateWithdrawalStatus(request.id, "approved")}
                          disabled={updatingWithdrawals === request.id}
                          className="px-4 py-2 rounded-full bg-[#c7a86a] text-black font-semibold hover:bg-[#b59659]"
                        >
                          {lang === "ar" ? "موافقة" : "Approve"}
                        </button>
                        <button
                          onClick={() => updateWithdrawalStatus(request.id, "rejected")}
                          disabled={updatingWithdrawals === request.id}
                          className="px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700"
                        >
                          {lang === "ar" ? "رفض" : "Reject"}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {showProducts && (
          <div className="bg-white rounded-3xl shadow-xl p-6 border border-[#efe7da]">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t.admin.products}
            </h2>
            {loading ? (
              <p className="text-gray-600">{t.common.loading}</p>
            ) : products.length === 0 ? (
              <p className="text-gray-600">{t.admin.empty}</p>
            ) : (
              <div className="space-y-6">
                {products.map((product) => (
                  <div key={product.id} className="border border-[#efe7da] rounded-3xl p-4">
                    {editingId === product.id ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          name="name"
                          value={editForm.name}
                          onChange={handleEditChange}
                          className="border border-[#efe7da] rounded-full px-4 py-3"
                        />
                        <input
                          name="nameAr"
                          value={editForm.nameAr}
                          onChange={handleEditChange}
                          className="border border-[#efe7da] rounded-full px-4 py-3"
                        />
                        <input
                          name="price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={editForm.price}
                          onChange={handleEditChange}
                          className="border border-[#efe7da] rounded-full px-4 py-3"
                        />
                        <input
                          name="image"
                          value={editForm.image}
                          onChange={handleEditChange}
                          className="border border-[#efe7da] rounded-full px-4 py-3"
                        />
                        <textarea
                          name="description"
                          value={editForm.description}
                          onChange={handleEditChange}
                          className="border border-[#efe7da] rounded-3xl px-4 py-3 md:col-span-2"
                          rows={2}
                        />
                        <textarea
                          name="descriptionAr"
                          value={editForm.descriptionAr}
                          onChange={handleEditChange}
                          className="border border-[#efe7da] rounded-3xl px-4 py-3 md:col-span-2"
                          rows={2}
                        />
                        <input
                          name="category"
                          value={editForm.category}
                          onChange={handleEditChange}
                          className="border border-[#efe7da] rounded-full px-4 py-3"
                        />
                        <input
                          name="categoryAr"
                          value={editForm.categoryAr}
                          onChange={handleEditChange}
                          className="border border-[#efe7da] rounded-full px-4 py-3"
                        />
                        <label className="flex items-center gap-2 text-gray-700">
                          <input
                            type="checkbox"
                            name="inStock"
                            checked={editForm.inStock}
                            onChange={handleEditChange}
                          />
                          {t.admin.inStock}
                        </label>
                        <div className="flex gap-2 md:col-span-2">
                          <button
                            onClick={() => handleUpdate(product.id)}
                            disabled={saving}
                            className={`px-4 py-2 rounded-full ${
                              saving
                                ? "bg-gray-300"
                                : "bg-[#c7a86a] text-black hover:bg-[#b59659]"
                            }`}
                          >
                            {t.admin.update}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-4 py-2 rounded-full bg-[#f7f4ef] hover:bg-[#efe7da]"
                          >
                            {t.admin.cancel}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {lang === "ar" ? product.nameAr : product.name}
                          </p>
                          <p className="text-sm text-gray-600">${product.price}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="px-4 py-2 rounded-full bg-[#111] text-white hover:bg-black"
                          >
                            {t.admin.edit}
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700"
                          >
                            {t.admin.delete}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
