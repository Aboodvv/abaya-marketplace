
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

export async function POST(req: NextRequest) {
  try {
    const { items, couponCode, userId } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in cart" }, { status: 400 });
    }

    const normalizedCoupon = typeof couponCode === "string" ? couponCode.trim().toUpperCase() : "";
    const normalizedUserId = typeof userId === "string" ? userId.trim() : "";

    const normalizeList = (list?: string[] | null) =>
      (list || [])
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);

    const rawLineItems = items.map((item: any) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: [item.image],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const totalUnits = items.reduce(
      (sum: number, item: any) => sum + (item.quantity || 0),
      0
    );

    const subtotalCents = rawLineItems.reduce(
      (sum: number, item: any) => sum + item.price_data.unit_amount * item.quantity,
      0
    );

    let discountCents = 0;
    let appliedCouponId: string | null = null;
    let appliedCouponCode: string | null = null;
    let eligibleFlags: boolean[] = rawLineItems.map(() => true);
    let eligibleSubtotalCents = subtotalCents;

    if (normalizedCoupon) {
      const snapshot = await getDocs(
        query(collection(db, "coupons"), where("code", "==", normalizedCoupon), limit(1))
      );
      if (!snapshot.empty) {
        const couponSnap = snapshot.docs[0];
        const coupon = couponSnap.data() as {
          code: string;
          type: "percent" | "fixed";
          value: number;
          active: boolean;
          usageLimit?: number | null;
          usageCount?: number | null;
          usageLimitPerCustomer?: number | null;
          allowedProductIds?: string[] | null;
          allowedCategories?: string[] | null;
          startsAt?: string | null;
          endsAt?: string | null;
        };
        const now = Date.now();
        const startsAt = coupon.startsAt ? new Date(coupon.startsAt).getTime() : null;
        const endsAt = coupon.endsAt ? new Date(coupon.endsAt).getTime() : null;
        const usageCount = coupon.usageCount || 0;
        const allowedProductIds = normalizeList(coupon.allowedProductIds);
        const allowedCategories = normalizeList(coupon.allowedCategories);
        const hasRestrictions = allowedProductIds.length > 0 || allowedCategories.length > 0;
        eligibleFlags = rawLineItems.map((_item: any, index: number) => {
          if (!hasRestrictions) return true;
          const item = items[index];
          const itemId = typeof item?.id === "string" ? item.id.toLowerCase() : "";
          const itemCategory = typeof item?.category === "string" ? item.category.toLowerCase() : "";
          return (
            (allowedProductIds.length > 0 && allowedProductIds.includes(itemId)) ||
            (allowedCategories.length > 0 && allowedCategories.includes(itemCategory))
          );
        });
        eligibleSubtotalCents = rawLineItems.reduce((sum: number, item: any, index: number) => {
          if (!eligibleFlags[index]) return sum;
          return sum + item.price_data.unit_amount * item.quantity;
        }, 0);

        let withinCustomerLimit = true;
        if (coupon.usageLimitPerCustomer && normalizedUserId) {
          const usageRef = doc(db, "couponUsage", `${couponSnap.id}_${normalizedUserId}`);
          const usageSnap = await getDoc(usageRef);
          const usageCountForUser = usageSnap.exists()
            ? (usageSnap.data()?.usageCount as number | undefined) || 0
            : 0;
          withinCustomerLimit = usageCountForUser < coupon.usageLimitPerCustomer;
        }

        const isValid =
          coupon.active &&
          (!startsAt || now >= startsAt) &&
          (!endsAt || now <= endsAt) &&
          (!coupon.usageLimit || usageCount < coupon.usageLimit) &&
          (!hasRestrictions || eligibleSubtotalCents > 0) &&
          withinCustomerLimit;

        if (isValid) {
          const rawDiscount =
            coupon.type === "percent"
              ? Math.round((eligibleSubtotalCents * coupon.value) / 100)
              : Math.round(coupon.value * 100);
          const eligibleUnits = Math.max(
            1,
            rawLineItems.reduce(
              (sum: number, item: any, index: number) =>
                eligibleFlags[index] ? sum + Math.max(1, item.quantity || 1) : sum,
              0
            )
          );
          const minTotalCents = Math.max(1, eligibleUnits);
          const maxDiscountCents = Math.max(0, eligibleSubtotalCents - minTotalCents);
          discountCents = Math.min(rawDiscount, maxDiscountCents);
          appliedCouponId = couponSnap.id;
          appliedCouponCode = coupon.code;
        }
      }
    }

    const discountedEligibleTotalCents = eligibleSubtotalCents - discountCents;
    let remainingEligibleCents = discountedEligibleTotalCents;
    const lastEligibleIndex = eligibleFlags.lastIndexOf(true);

    const lineItems = discountCents
      ? rawLineItems.map((item: any, index: number) => {
          if (!eligibleFlags[index]) return item;
          const quantity = Math.max(1, item.quantity || 1);
          const baseTotal = item.price_data.unit_amount * quantity;
          const isLastEligible = index === lastEligibleIndex;
          const adjustedTotal = isLastEligible
            ? remainingEligibleCents
            : Math.round((baseTotal / eligibleSubtotalCents) * discountedEligibleTotalCents);
          const adjustedUnit = Math.max(1, Math.round(adjustedTotal / quantity));
          const finalTotal = adjustedUnit * quantity;
          remainingEligibleCents = Math.max(0, remainingEligibleCents - finalTotal);
          return {
            ...item,
            price_data: {
              ...item.price_data,
              unit_amount: adjustedUnit,
            },
          };
        })
      : rawLineItems;

    const totalItems = items.reduce(
      (sum: number, item: any) => sum + (item.quantity || 0),
      0
    );
    const freeDeliveryEligible = totalItems >= 3;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      metadata: {
        free_delivery: freeDeliveryEligible ? "yes" : "no",
        free_delivery_threshold: "3",
        coupon_code: appliedCouponCode || "",
        discount_cents: discountCents ? String(discountCents) : "0",
      },
      success_url: `${req.nextUrl.origin}/success?session_id={CHECKOUT_SESSION_ID}&free_delivery=${
        freeDeliveryEligible ? "1" : "0"
      }`,
      cancel_url: `${req.nextUrl.origin}/cart`,
    });

    if (appliedCouponId && discountCents > 0) {
      await updateDoc(doc(db, "coupons", appliedCouponId), {
        usageCount: increment(1),
        lastUsedAt: new Date().toISOString(),
      });
      if (normalizedUserId) {
        await setDoc(
          doc(db, "couponUsage", `${appliedCouponId}_${normalizedUserId}`),
          {
            couponId: appliedCouponId,
            userId: normalizedUserId,
            usageCount: increment(1),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
