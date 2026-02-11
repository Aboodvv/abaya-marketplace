"use client";

import React, { createContext, useContext } from "react";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CartItem } from "@/context/CartContext";

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  nameAr: string;
  price: number;
  image: string;
  quantity: number;
  sellerId?: string;
  sellerName?: string;
  storeName?: string;
}

export interface Order {
  id: string;
  userId: string;
  sellerIds?: string[];
  items: OrderItem[];
  total: number;
  subtotal?: number;
  discountAmount?: number;
  couponCode?: string | null;
  totalAfterDiscount?: number;
  status: "pending" | "paid" | "cancelled";
  createdAt: string;
  stripeSessionId?: string;
  freeDeliveryEligible?: boolean;
  freeDeliveryThreshold?: number;
}

interface OrdersContextType {
  createOrder: (params: {
    userId: string;
    items: CartItem[];
    total: number;
    subtotal?: number;
    discountAmount?: number;
    couponCode?: string | null;
    totalAfterDiscount?: number;
    stripeSessionId?: string;
    freeDeliveryEligible?: boolean;
    freeDeliveryThreshold?: number;
  }) => Promise<string>;
  getOrdersByUser: (userId: string) => Promise<Order[]>;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export const OrdersProvider = ({ children }: { children: React.ReactNode }) => {
  const createOrder = async (params: {
    userId: string;
    items: CartItem[];
    total: number;
    subtotal?: number;
    discountAmount?: number;
    couponCode?: string | null;
    totalAfterDiscount?: number;
    stripeSessionId?: string;
    freeDeliveryEligible?: boolean;
    freeDeliveryThreshold?: number;
  }) => {
    const sellerIds = Array.from(
      new Set(
        params.items
          .map((item) => item.sellerId)
          .filter((sellerId): sellerId is string => Boolean(sellerId))
      )
    );

    const payload = {
      userId: params.userId,
      sellerIds,
      items: params.items.map((item) => ({
        id: item.id,
        productId: item.id,
        name: item.name,
        nameAr: item.nameAr,
        price: item.price,
        image: item.image,
        quantity: item.quantity,
        sellerId: item.sellerId || null,
        sellerName: item.sellerName || null,
        storeName: item.storeName || null,
      })),
      total: params.total,
      subtotal: params.subtotal ?? params.total,
      discountAmount: params.discountAmount ?? 0,
      couponCode: params.couponCode || null,
      totalAfterDiscount: params.totalAfterDiscount ?? params.total,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
      stripeSessionId: params.stripeSessionId || null,
      freeDeliveryEligible: params.freeDeliveryEligible ?? false,
      freeDeliveryThreshold: params.freeDeliveryThreshold ?? null,
    };

    const docRef = await addDoc(collection(db, "orders"), payload);
    return docRef.id;
  };

  const getOrdersByUser = async (userId: string) => {
    const ordersQuery = query(
      collection(db, "orders"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(ordersQuery);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Order, "id">),
    }));
  };

  return (
    <OrdersContext.Provider value={{ createOrder, getOrdersByUser }}>
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error("useOrders must be used within OrdersProvider");
  }
  return context;
};
