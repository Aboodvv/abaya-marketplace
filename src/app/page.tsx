"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { products as localProducts } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import MarketingTool from "@/components/MarketingTool";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/context/CartContext";

export default function Home() {
  const { t, lang } = useLanguage();
  const [products, setProducts] = useState<Product[]>(localProducts);
  const megaDealHours = 24; // عدّل الرقم لتغيير مدة المؤقت
  const [timeLeftMs, setTimeLeftMs] = useState(megaDealHours * 60 * 60 * 1000);
  const defaultBookingLink = "https://iwtsp.com/966550514533";
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
      link: defaultBookingLink,
    },
    {
      title: "Mega Deals Slot",
      titleAr: "مساحة عروض الميجا",
      subtitle: "Right under the countdown",
      subtitleAr: "أسفل المؤقت مباشرة",
      size: "Wide Card",
      sizeAr: "بطاقة عريضة",
      link: defaultBookingLink,
    },
    {
      title: "Side Spotlight",
      titleAr: "واجهة جانبية",
      subtitle: "Perfect for product launches",
      subtitleAr: "مثالية لإطلاق المنتجات",
      size: "Tall Banner",
      sizeAr: "بنر طولي",
      link: defaultBookingLink,
    },
    {
      title: "Footer Strip",
      titleAr: "شريط الفوتر",
      subtitle: "Always visible at scroll end",
      subtitleAr: "ظهور دائم في نهاية الصفحة",
      size: "Ribbon",
      sizeAr: "شريط",
      link: defaultBookingLink,
    },
  ];
  const [adImages, setAdImages] = useState<string[]>(defaultAdImages);
  const [adItems, setAdItems] = useState(defaultAdItems);
  const [bookingLink, setBookingLink] = useState(defaultBookingLink);

  useEffect(() => {
    const fetchProducts = async () => {
      const snapshot = await getDocs(collection(db, "products"));
      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Product, "id">),
      }));
      if (list.length > 0) {
        setProducts(list);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchAdImages = async () => {
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
        console.error("Failed to load ad images", error);
      }
    };

    fetchAdImages();
  }, []);

  useEffect(() => {
    const endTime = Date.now() + megaDealHours * 60 * 60 * 1000;
    const interval = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      setTimeLeftMs(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [megaDealHours]);

  const featuredProducts = products.slice(0, 3);
  const offersProducts = useMemo(
    () =>
      products.filter(
        (product) => product.category === "offers" || product.categoryAr === "عروض"
      ),
    [products]
  );
  const timeParts = useMemo(() => {
    const totalSeconds = Math.floor(timeLeftMs / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return { hours, minutes, seconds };
  }, [timeLeftMs]);
  const resolveText = (item: (typeof defaultAdItems)[number], key: "title" | "subtitle" | "size") =>
    lang === "ar" ? item[`${key}Ar` as const] || item[key] : item[key] || item[`${key}Ar` as const];
  const resolveLink = (item: (typeof defaultAdItems)[number]) => item.link || bookingLink;

  return (
    <div className="min-h-screen bg-[#f7f4ef] text-[#1a1a1a]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-black/55" />
          <div
            className="h-full w-full bg-cover bg-center"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=2400&auto=format&fit=crop)",
            }}
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 md:py-36">
          <div className="max-w-2xl">
            <p className="uppercase tracking-[0.3em] text-[#c7a86a] text-sm mb-4">
              {lang === "ar" ? "مجموعة فاخرة" : "Luxury Collection"}
            </p>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              {t.home.hero.title}
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-8">
              {t.home.hero.subtitle}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#c7a86a] text-black rounded-full font-semibold text-lg hover:bg-[#b59659] transition"
              >
                {t.home.hero.cta}
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-8 py-4 border border-white/40 text-white rounded-full font-semibold text-lg hover:border-[#c7a86a] hover:text-[#c7a86a] transition"
              >
                {t.products.title}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingTool />

      {/* Banners */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 pb-12">
        <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              {t.home.banners.title}
            </h2>
            <Link
              href="/products"
              className="text-[#c7a86a] font-semibold hover:underline"
            >
              {t.products.title}
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {t.home.banners.items.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className="group rounded-2xl border border-[#eee4d6] bg-gradient-to-br from-white to-[#f7f4ef] p-6 hover:shadow-lg transition"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-[#c7a86a] mb-3">
                  {index === 0 ? "NEW" : index === 1 ? "PREMIUM" : "SECURE"}
                </p>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 mb-4">{item.subtitle}</p>
                <Link
                  href={item.href}
                  className="inline-flex items-center text-gray-900 font-semibold group-hover:text-[#c7a86a]"
                >
                  {item.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mega Deals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10 border border-[#efe7da]">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {t.home.mega.title}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {t.home.mega.timerLabel} {timeParts.hours}:{timeParts.minutes}:{timeParts.seconds}
              </p>
            </div>
            <Link
              href="/products"
              className="text-[#c7a86a] font-semibold hover:underline"
            >
              {t.products.title}
            </Link>
          </div>

          {offersProducts.length === 0 ? (
            <p className="text-gray-600 text-sm">{t.home.mega.empty}</p>
          ) : (
            <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
              {offersProducts.map((product) => (
                <div
                  key={product.id}
                  className="min-w-[260px] sm:min-w-[280px] md:min-w-[320px] snap-start"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Ad Banners */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {t.home.ads.title}
            </h2>
            <p className="text-gray-600 text-sm mt-2">{t.home.ads.subtitle}</p>
          </div>
          <Link
            href={bookingLink}
            className="inline-flex items-center px-6 py-3 rounded-full bg-[#c7a86a] text-black font-semibold hover:bg-[#b59659] transition"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.home.ads.cta}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div
            className="lg:col-span-7 text-white rounded-3xl p-8 border border-[#1e1e1e] relative overflow-hidden"
            style={{
              backgroundImage: `url(${adImages[0]})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-black/60" />
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top,_#c7a86a,_transparent_65%)]" />
            <div className="relative">
              <p className="text-xs uppercase tracking-[0.3em] text-[#c7a86a] mb-3">
                {lang === "ar" ? "بنر إعلاني" : "Sponsored"}
              </p>
              <h3 className="text-3xl font-bold mb-3">{resolveText(adItems[0], "title")}</h3>
              <p className="text-white/70 mb-6">{resolveText(adItems[0], "subtitle")}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">{resolveText(adItems[0], "size")}</span>
                  <Link
                    href={resolveLink(adItems[0])}
                    className="px-4 py-2 rounded-full border border-[#c7a86a] text-[#c7a86a] hover:bg-[#c7a86a] hover:text-black transition text-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t.home.ads.cta}
                  </Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {adItems.slice(1, 3).map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className="rounded-3xl border border-[#efe7da] bg-white p-6 shadow-lg relative overflow-hidden"
                style={{
                  backgroundImage: `url(${adImages[index + 1]})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute inset-0 bg-white/85" />
                <div className="relative">
                <p className="text-xs uppercase tracking-[0.2em] text-[#c7a86a] mb-2">
                  {lang === "ar" ? "مساحة" : "Slot"}
                </p>
                <h4 className="text-xl font-bold text-gray-900 mb-2">{resolveText(item, "title")}</h4>
                <p className="text-gray-600 mb-4">{resolveText(item, "subtitle")}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{resolveText(item, "size")}</span>
                  <Link
                    href={resolveLink(item)}
                    className="text-sm font-semibold text-[#c7a86a] hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t.home.ads.cta}
                  </Link>
                </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="mt-8 rounded-3xl border border-[#efe7da] shadow-lg overflow-hidden"
          style={{
            backgroundImage: `url(${adImages[3]})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="bg-black/55 p-6 md:p-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-2xl md:text-3xl font-bold text-white">
                  {resolveText(adItems[3], "title")}
                </h4>
                <p className="text-sm text-white/70">{resolveText(adItems[3], "size")}</p>
              </div>
              <Link
                href={resolveLink(adItems[3])}
                className="px-5 py-2 rounded-full bg-[#c7a86a] text-black font-semibold hover:bg-[#b59659] transition"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t.home.ads.cta}
              </Link>
            </div>

            <div className="marquee">
              <div className="marquee-track">
                {[...Array(2)].map((_, trackIndex) => (
                  <div key={`track-${trackIndex}`} className="flex items-center gap-6 pr-6">
                    {[...Array(6)].map((__, index) => (
                      <div
                        key={`ad-chip-${trackIndex}-${index}`}
                        className="min-w-[220px] rounded-2xl bg-white/90 p-4 text-gray-900"
                      >
                        <p className="text-xs uppercase tracking-[0.2em] text-[#c7a86a] mb-2">
                          {lang === "ar" ? "إعلان" : "Ad"}
                        </p>
                        <p className="text-sm mb-3">
                          {lang === "ar"
                            ? "بنر متحرك واسع لحملاتك الإعلانية."
                            : "Wide moving banner for your campaigns."}
                        </p>
                        <Link
                          href={resolveLink(adItems[3])}
                          className="text-sm font-semibold text-[#c7a86a] hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {t.home.ads.cta}
                        </Link>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-4xl font-bold text-gray-900">{t.home.featured}</h2>
          <Link
            href="/products"
            className="text-[#c7a86a] font-semibold hover:underline"
          >
            {t.products.title}
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}

