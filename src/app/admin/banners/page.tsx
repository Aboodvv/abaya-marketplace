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

export default function AdminBannersPage() {
  const { lang } = useLanguage();
  const [adImages, setAdImages] = useState<string[]>(defaultAdImages);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const snapshot = await getDoc(doc(db, "settings", "homeAds"));
        if (snapshot.exists()) {
          const data = snapshot.data() as { adImages?: string[] };
          if (data.adImages && data.adImages.length > 0) {
            setAdImages(
              defaultAdImages.map((fallback, index) => data.adImages?.[index] || fallback)
            );
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
      await setDoc(doc(db, "settings", "homeAds"), { adImages });
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
          className="bg-white rounded-3xl shadow-xl p-6 border border-[#efe7da] space-y-6"
        >
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
