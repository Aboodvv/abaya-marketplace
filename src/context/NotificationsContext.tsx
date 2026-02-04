"use client";

import React, { createContext, useContext, useState } from "react";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loadNotifications: (userId: string) => Promise<void>;
  createNotification: (data: {
    userId: string;
    title: string;
    body: string;
  }) => Promise<string>;
  markAsRead: (id: string) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(
  undefined
);

export const NotificationsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const loadNotifications = async (userId: string) => {
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(notificationsQuery);
    const list = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<NotificationItem, "id">),
    }));
    setNotifications(list);
  };

  const createNotification = async (data: {
    userId: string;
    title: string;
    body: string;
  }) => {
    const payload = {
      ...data,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, "notifications"), payload);
    return docRef.id;
  };

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, "notifications", id), { isRead: true });
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
  };

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, loadNotifications, createNotification, markAsRead }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return context;
};
