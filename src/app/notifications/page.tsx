"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationsContext";

export default function NotificationsPage() {
  const { lang, t } = useLanguage();
  const { user, userProfile } = useAuth();
  const { notifications, loadNotifications, markAsRead } = useNotifications();

  useEffect(() => {
    if (user) {
      loadNotifications(user.uid);
    }
  }, [user, loadNotifications]);

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          {t.notifications.title}
        </h1>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
            {t.notifications.empty}
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-lg shadow p-5 border-l-4 ${
                  item.isRead ? "border-gray-200" : "border-blue-500"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-sm">{item.body}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(item.createdAt).toLocaleString(
                        lang === "ar" ? "ar-SA" : "en-US"
                      )}
                    </p>
                  </div>
                  {!item.isRead && (
                    <button
                      onClick={() => markAsRead(item.id)}
                      className="px-3 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800"
                    >
                      {t.notifications.markRead}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
