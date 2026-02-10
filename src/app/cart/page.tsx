"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useOrders } from "@/context/OrdersContext";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationsContext";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Plus, Minus } from "lucide-react";
import { useMemo, useState } from "react";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

type CouponType = "percent" | "fixed";

interface CouponDoc {
  code: string;
  type: CouponType;
  value: number;
  active: boolean;
  usageLimit?: number | null;
  usageCount?: number | null;
  usageLimitPerCustomer?: number | null;
  allowedProductIds?: string[] | null;
  allowedCategories?: string[] | null;
  startsAt?: string | null;
  endsAt?: string | null;
}

interface AppliedCoupon {
  code: string;
  type: CouponType;
  value: number;
}

export default function CartPage() {
  const { lang, t } = useLanguage();
  const { cart, removeFromCart, updateQuantity, totalItems, totalPrice } = useCart();
  const { createOrder } = useOrders();
  const { createNotification } = useNotifications();
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const freeDeliveryTarget = 3;
  const remainingForFreeDelivery = Math.max(0, freeDeliveryTarget - totalItems);
  const progressPercent = Math.min(100, (totalItems / freeDeliveryTarget) * 100);
  const freeDeliveryEligible = totalItems >= freeDeliveryTarget;

  const subtotal = totalPrice;
  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const rawDiscount =
      appliedCoupon.type === "percent"
        ? (subtotal * appliedCoupon.value) / 100
        : appliedCoupon.value;
    return Math.max(0, Math.min(subtotal, Number(rawDiscount)));
  }, [appliedCoupon, subtotal]);
  const totalAfterDiscount = Math.max(0, subtotal - discountAmount);

  const resetCouponState = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  const normalizeList = (list?: string[] | null) =>
    (list || [])
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

  const validateCoupon = (coupon: CouponDoc) => {
    if (!coupon.active) return false;
    const now = Date.now();
    const startsAt = coupon.startsAt ? new Date(coupon.startsAt).getTime() : null;
    const endsAt = coupon.endsAt ? new Date(coupon.endsAt).getTime() : null;
    if (startsAt && now < startsAt) return false;
    if (endsAt && now > endsAt) return false;
    if (coupon.usageLimit && (coupon.usageCount || 0) >= coupon.usageLimit) return false;
    const allowedCategories = normalizeList(coupon.allowedCategories);
    const allowedProductIds = normalizeList(coupon.allowedProductIds);
    if (allowedCategories.length > 0 || allowedProductIds.length > 0) {
      const hasEligibleItem = cart.some((item) => {
        const category = item.category ? item.category.toLowerCase() : "";
        return (
          (allowedProductIds.length > 0 && allowedProductIds.includes(item.id.toLowerCase())) ||
          (allowedCategories.length > 0 && allowedCategories.includes(category))
        );
      });
      if (!hasEligibleItem) return false;
    }
    return true;
  };

  const handleApplyCoupon = async () => {
    const normalized = couponCode.trim().toUpperCase();
    if (!normalized) {
      setCouponError(t.cart.couponEmpty);
      return;
    }
    setCouponLoading(true);
    setCouponError("");
    try {
      const snapshot = await getDocs(
        query(collection(db, "coupons"), where("code", "==", normalized), limit(1))
      );
      if (snapshot.empty) {
        setCouponError(t.cart.couponInvalid);
        setAppliedCoupon(null);
        return;
      }
      const data = snapshot.docs[0].data() as CouponDoc;
      if (!validateCoupon(data)) {
        setCouponError(t.cart.couponInvalid);
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon({ code: data.code, type: data.type, value: data.value });
      setCouponCode(data.code);
    } catch (error) {
      console.error("Failed to validate coupon", error);
      setCouponError(t.cart.couponError);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          couponCode: appliedCoupon?.code || null,
          userId: user?.uid || null,
        }),
      });

      const { url } = await response.json();
      if (user && cart.length > 0) {
        const orderId = await createOrder({
          userId: user.uid,
          items: cart,
          total: totalAfterDiscount,
          subtotal,
          discountAmount,
          couponCode: appliedCoupon?.code || null,
          totalAfterDiscount,
          freeDeliveryEligible,
          freeDeliveryThreshold: freeDeliveryTarget,
        });

        await createNotification({
          userId: user.uid,
          title: lang === "ar" ? "تم إنشاء طلبك" : "Order Created",
          body:
            lang === "ar"
              ? `تم إنشاء طلب جديد بقيمة $${totalAfterDiscount.toFixed(2)}`
              : `A new order has been created for $${totalAfterDiscount.toFixed(2)}`,
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
                  ? `<p>مرحبًا ${userProfile?.name || ""}</p><p>تم إنشاء طلبك بنجاح.</p><p>رقم الطلب: ${orderId}</p><p>الإجمالي: $${totalAfterDiscount.toFixed(2)}</p>`
                  : `<p>Hello ${userProfile?.name || ""}</p><p>Your order has been created successfully.</p><p>Order ID: ${orderId}</p><p>Total: $${totalAfterDiscount.toFixed(2)}</p>`,
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
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="text-sm font-semibold text-gray-900">
              {t.cart.freeDeliveryTitle}
            </p>
            <span className="text-sm text-gray-600">{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-3 rounded-full bg-[#f7f4ef] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#c7a86a] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-gray-600">
            {remainingForFreeDelivery === 0
              ? t.cart.freeDeliveryUnlocked
              : t.cart.freeDeliveryRemaining.replace(
                  "{count}",
                  String(remainingForFreeDelivery)
                )}
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
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <p className="text-sm text-gray-600">{t.cart.couponTitle}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value)}
                  placeholder={t.cart.couponPlaceholder}
                  className="border border-[#efe7da] rounded-full px-4 py-2"
                />
                {appliedCoupon ? (
                  <button
                    type="button"
                    onClick={resetCouponState}
                    className="px-4 py-2 rounded-full bg-[#f7f4ef] hover:bg-[#efe7da]"
                  >
                    {t.cart.couponRemove}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading}
                    className={`px-4 py-2 rounded-full font-semibold ${
                      couponLoading
                        ? "bg-gray-300"
                        : "bg-[#c7a86a] text-black hover:bg-[#b59659]"
                    }`}
                  >
                    {couponLoading ? t.common.loading : t.cart.couponApply}
                  </button>
                )}
              </div>
              {couponError && <p className="text-sm text-red-600 mt-2">{couponError}</p>}
              {appliedCoupon && !couponError && (
                <p className="text-sm text-[#7a5a1f] mt-2">
                  {t.cart.couponApplied.replace("{code}", appliedCoupon.code)}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">{t.cart.subtotal}</p>
              <p className="text-lg font-semibold text-gray-900">
                ${subtotal.toFixed(2)}
              </p>
              {discountAmount > 0 && (
                <p className="text-sm text-[#7a5a1f]">
                  {t.cart.discount}: -${discountAmount.toFixed(2)}
                </p>
              )}
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {t.cart.total}: ${totalAfterDiscount.toFixed(2)}
              </p>
            </div>
          </div>
          {freeDeliveryEligible && (
            <div className="mb-4 rounded-2xl border border-[#efe7da] bg-[#f7f4ef] px-4 py-3 text-sm text-gray-700">
              {t.cart.freeDeliveryCheckout}
            </div>
          )}
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
