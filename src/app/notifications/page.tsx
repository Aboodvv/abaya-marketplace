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
      <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center px-4">
        <div className="text-center bg-white rounded-3xl shadow-xl p-10 border border-[#efe7da]">
          <h2 className="text-2xl font-bold mb-4">
            {lang === "ar" ? "يجب تسجيل الدخول" : "Please log in"}
          </h2>
          <Link
            href="/login"
            className="inline-flex px-6 py-3 bg-[#c7a86a] text-black rounded-full hover:bg-[#b59659]"
          >
            {lang === "ar" ? "تسجيل الدخول" : "Login"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ef] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-[#c7a86a] mb-2">
            {lang === "ar" ? "التنبيهات" : "Updates"}
          </p>
          <h1 className="text-4xl font-bold text-gray-900">
            {t.notifications.title}
          </h1>
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-6 text-center text-gray-600 border border-[#efe7da]">
            {t.notifications.empty}
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-3xl shadow-xl p-5 border ${
                  item.isRead ? "border-[#efe7da]" : "border-[#c7a86a]"
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
                      className="px-3 py-2 bg-[#c7a86a] text-black rounded-full text-sm hover:bg-[#b59659]"
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
