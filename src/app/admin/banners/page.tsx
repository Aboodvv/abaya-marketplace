"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLanguage } from "@/context/LanguageContext";

const defaultAdImages = [
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=900&auto=format&fit=crop",
];
const defaultAdItems = [
  {
    title: "Hero Banner",
    titleAr: "بنر البطل",
    subtitle: "Top exposure across all visitors",
    subtitleAr: "أعلى نسبة ظهور لكل الزوار",
    size: "Full Width",
    sizeAr: "عرض كامل",
    link: "https://iwtsp.com/966550514533",
  },
  {
    title: "Mega Deals Slot",
    titleAr: "مساحة عروض الميجا",
    subtitle: "Right under the countdown",
    subtitleAr: "أسفل المؤقت مباشرة",
    size: "Wide Card",
    sizeAr: "بطاقة عريضة",
    link: "https://iwtsp.com/966550514533",
  },
  {
    title: "Side Spotlight",
    titleAr: "واجهة جانبية",
    subtitle: "Perfect for product launches",
    subtitleAr: "مثالية لإطلاق المنتجات",
    size: "Tall Banner",
    sizeAr: "بنر طولي",
    link: "https://iwtsp.com/966550514533",
  },
  {
    title: "Footer Strip",
    titleAr: "شريط الفوتر",
    subtitle: "Always visible at scroll end",
    subtitleAr: "ظهور دائم في نهاية الصفحة",
    size: "Ribbon",
    sizeAr: "شريط",
    link: "https://iwtsp.com/966550514533",
  },
];

export default function AdminBannersPage() {
  const { lang } = useLanguage();
  const [adImages, setAdImages] = useState<string[]>(defaultAdImages);
  const [adItems, setAdItems] = useState(defaultAdItems);
  const [bookingLink, setBookingLink] = useState("https://iwtsp.com/966550514533");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const snapshot = await getDoc(doc(db, "settings", "homeAds"));
        if (snapshot.exists()) {
          const data = snapshot.data() as {
            adImages?: string[];
            adItems?: typeof defaultAdItems;
            bookingLink?: string;
          };
          if (data.adImages && data.adImages.length > 0) {
            setAdImages(
              defaultAdImages.map((fallback, index) => data.adImages?.[index] || fallback)
            );
          }
          if (data.adItems && data.adItems.length > 0) {
            setAdItems(
              defaultAdItems.map((fallback, index) => ({
                ...fallback,
                ...(data.adItems?.[index] || {}),
              }))
            );
          }
          if (data.bookingLink) {
            setBookingLink(data.bookingLink);
          }
        }
      } catch (error) {
        console.error("Failed to load banner settings", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleChange = (index: number, value: string) => {
    setAdImages((prev) => prev.map((item, idx) => (idx === index ? value : item)));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "homeAds"), {
        adImages,
        adItems,
        bookingLink,
      });
    } catch (error) {
      console.error("Failed to save banner settings", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center">
        <p className="text-gray-600">{lang === "ar" ? "جاري التحميل..." : "Loading..."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ef] py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-sm uppercase tracking-[0.3em] text-[#c7a86a] hover:underline"
          >
            {lang === "ar" ? "عودة للإدارة" : "Back to admin"}
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mt-4">
            {lang === "ar" ? "لوحة التحكم بالبنرات" : "Banner Control Panel"}
          </h1>
          <p className="text-gray-600 mt-2">
            {lang === "ar"
              ? "عدلي صور البنرات الإعلانية في الصفحة الرئيسية."
              : "Update the ad banner images shown on the home page."}
          </p>
        </div>

        <form
          onSubmit={handleSave}
          className="bg-white rounded-3xl shadow-xl p-6 border border-[#efe7da] space-y-8"
        >
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              {lang === "ar" ? "رابط الحجز العام" : "Global booking link"}
            </label>
            <input
              value={bookingLink}
              onChange={(event) => setBookingLink(event.target.value)}
              className="w-full border border-[#efe7da] rounded-full px-4 py-3"
              placeholder="https://..."
            />
          </div>

          {adImages.map((image, index) => (
            <div key={`ad-image-${index}`} className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                {lang === "ar" ? `صورة البنر ${index + 1}` : `Banner image ${index + 1}`}
              </label>
              <input
                value={image}
                onChange={(event) => handleChange(index, event.target.value)}
                className="w-full border border-[#efe7da] rounded-full px-4 py-3"
                placeholder="https://..."
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={adItems[index]?.title || ""}
                  onChange={(event) =>
                    setAdItems((prev) =>
                      prev.map((item, idx) =>
                        idx === index ? { ...item, title: event.target.value } : item
                      )
                    )
                  }
                  className="w-full border border-[#efe7da] rounded-full px-4 py-3"
                  placeholder={lang === "ar" ? "العنوان (EN)" : "Title (EN)"}
                />
                <input
                  value={adItems[index]?.titleAr || ""}
                  onChange={(event) =>
                    setAdItems((prev) =>
                      prev.map((item, idx) =>
                        idx === index ? { ...item, titleAr: event.target.value } : item
                      )
                    )
                  }
                  className="w-full border border-[#efe7da] rounded-full px-4 py-3"
                  placeholder={lang === "ar" ? "العنوان (AR)" : "Title (AR)"}
                />
                <input
                  value={adItems[index]?.subtitle || ""}
                  onChange={(event) =>
                    setAdItems((prev) =>
                      prev.map((item, idx) =>
                        idx === index ? { ...item, subtitle: event.target.value } : item
                      )
                    )
                  }
                  className="w-full border border-[#efe7da] rounded-full px-4 py-3"
                  placeholder={lang === "ar" ? "الوصف (EN)" : "Subtitle (EN)"}
                />
                <input
                  value={adItems[index]?.subtitleAr || ""}
                  onChange={(event) =>
                    setAdItems((prev) =>
                      prev.map((item, idx) =>
                        idx === index ? { ...item, subtitleAr: event.target.value } : item
                      )
                    )
                  }
                  className="w-full border border-[#efe7da] rounded-full px-4 py-3"
                  placeholder={lang === "ar" ? "الوصف (AR)" : "Subtitle (AR)"}
                />
                <input
                  value={adItems[index]?.size || ""}
                  onChange={(event) =>
                    setAdItems((prev) =>
                      prev.map((item, idx) =>
                        idx === index ? { ...item, size: event.target.value } : item
                      )
                    )
                  }
                  className="w-full border border-[#efe7da] rounded-full px-4 py-3"
                  placeholder={lang === "ar" ? "الحجم (EN)" : "Size (EN)"}
                />
                <input
                  value={adItems[index]?.sizeAr || ""}
                  onChange={(event) =>
                    setAdItems((prev) =>
                      prev.map((item, idx) =>
                        idx === index ? { ...item, sizeAr: event.target.value } : item
                      )
                    )
                  }
                  className="w-full border border-[#efe7da] rounded-full px-4 py-3"
                  placeholder={lang === "ar" ? "الحجم (AR)" : "Size (AR)"}
                />
                <input
                  value={adItems[index]?.link || ""}
                  onChange={(event) =>
                    setAdItems((prev) =>
                      prev.map((item, idx) =>
                        idx === index ? { ...item, link: event.target.value } : item
                      )
                    )
                  }
                  className="w-full border border-[#efe7da] rounded-full px-4 py-3 md:col-span-2"
                  placeholder={lang === "ar" ? "رابط مخصص (اختياري)" : "Custom link (optional)"}
                />
              </div>
            </div>
          ))}
          <button
            type="submit"
            disabled={saving}
            className={`w-full py-3 rounded-full font-semibold transition ${
              saving ? "bg-gray-300" : "bg-[#c7a86a] text-black hover:bg-[#b59659]"
            }`}
          >
            {saving
              ? lang === "ar"
                ? "جاري الحفظ..."
                : "Saving..."
              : lang === "ar"
                ? "حفظ التعديلات"
                : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
