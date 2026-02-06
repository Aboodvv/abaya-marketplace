"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { products as localProducts } from "@/data/products";
import { useLanguage } from "@/context/LanguageContext";
import { useCart, Product } from "@/context/CartContext";
import ProductCard from "@/components/ProductCard";
import { useAuth } from "@/context/AuthContext";
import { useReviews, Review } from "@/context/ReviewsContext";

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { lang, t } = useLanguage();
  const { addToCart } = useCart();
  const { user, userProfile } = useAuth();
  const { addReview, getReviewsByProduct } = useReviews();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const docRef = doc(db, "products", id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setProduct({ id: snapshot.id, ...(snapshot.data() as Omit<Product, "id">) });
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Failed to fetch product", error);
      }

      const local = localProducts.find((item) => item.id === id);
      setProduct(local || null);
      setLoading(false);
    };

    loadProduct();
  }, [id]);

  useEffect(() => {
    const loadReviews = async () => {
      if (!product) return;
      const data = await getReviewsByProduct(product.id);
      setReviews(data);
    };

    loadReviews();
  }, [getReviewsByProduct, product]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return total / reviews.length;
  }, [reviews]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center">
        <p className="text-gray-600">{t.common.loading}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 text-center border border-[#efe7da]">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {lang === "ar" ? "المنتج غير موجود" : "Product not found"}
          </h1>
          <Link
            href="/products"
            className="inline-flex px-6 py-3 bg-[#c7a86a] text-black rounded-full hover:bg-[#b59659]"
          >
            {t.products.title}
          </Link>
        </div>
      </div>
    );
  }

  const name = lang === "ar" ? product.nameAr : product.name;
  const description = lang === "ar" ? product.descriptionAr : product.description;
  const category = lang === "ar" ? product.categoryAr : product.category;
  const relatedProducts = localProducts
    .filter((item) => item.id !== product.id)
    .filter((item) => item.category === product.category)
    .slice(0, 3);
  const fallbackProducts = localProducts.filter((item) => item.id !== product.id).slice(0, 3);

  const handleSubmitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !userProfile) return;
    setSubmitting(true);
    await addReview({
      productId: product.id,
      userId: user.uid,
      userName: userProfile.name,
      rating,
      comment,
    });
    const data = await getReviewsByProduct(product.id);
    setReviews(data);
    setComment("");
    setRating(5);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#f7f4ef]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link
          href="/products"
          className="text-sm uppercase tracking-[0.3em] text-[#c7a86a] hover:underline"
        >
          {lang === "ar" ? "عودة للمنتجات" : "Back to products"}
        </Link>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <div className="relative h-[480px] w-full rounded-3xl overflow-hidden shadow-xl border border-[#efe7da] bg-white">
              <Image
                src={product.image}
                alt={name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              {!product.inStock && (
                <div className="absolute top-5 right-5 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  {t.products.outOfStock}
                </div>
              )}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[0, 1, 2].map((index) => (
                <div
                  key={`${product.id}-thumb-${index}`}
                  className="relative h-28 w-full rounded-2xl overflow-hidden border border-[#efe7da] bg-white"
                >
                  <Image
                    src={product.image}
                    alt={name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 33vw, 25vw"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#efe7da]">
            <p className="text-xs uppercase tracking-[0.3em] text-[#c7a86a] mb-2">
              {category}
            </p>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{name}</h1>
            <p className="text-gray-600 mb-6 leading-relaxed">{description}</p>

            <div className="flex items-center justify-between mb-6">
              <span className="text-3xl font-bold text-gray-900">${product.price}</span>
              <span className="text-sm uppercase tracking-[0.2em] text-[#c7a86a]">
                {product.inStock ? t.products.inStock : t.products.outOfStock}
              </span>
            </div>

            <button
              onClick={() => addToCart(product)}
              disabled={!product.inStock}
              className={`w-full py-4 rounded-full font-semibold text-lg transition ${
                product.inStock
                  ? "bg-[#c7a86a] text-black hover:bg-[#b59659]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {t.products.addToCart}
            </button>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[#efe7da] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#c7a86a] mb-2">
                  {lang === "ar" ? "الخامة" : "Fabric"}
                </p>
                <p className="text-gray-700">
                  {lang === "ar"
                    ? "قماش فاخر مع لمسات ناعمة وانسيابية."
                    : "Premium fabric with a soft, flowing finish."}
                </p>
              </div>
              <div className="rounded-2xl border border-[#efe7da] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#c7a86a] mb-2">
                  {lang === "ar" ? "العناية" : "Care"}
                </p>
                <p className="text-gray-700">
                  {lang === "ar"
                    ? "تنظيف جاف للحفاظ على الجودة والشكل."
                    : "Dry clean recommended to preserve quality."}
                </p>
              </div>
              <div className="rounded-2xl border border-[#efe7da] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#c7a86a] mb-2">
                  {lang === "ar" ? "الشحن" : "Shipping"}
                </p>
                <p className="text-gray-700">
                  {lang === "ar"
                    ? "توصيل سريع خلال 2-4 أيام عمل."
                    : "Fast delivery within 2-4 business days."}
                </p>
              </div>
              <div className="rounded-2xl border border-[#efe7da] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#c7a86a] mb-2">
                  {lang === "ar" ? "الإرجاع" : "Returns"}
                </p>
                <p className="text-gray-700">
                  {lang === "ar"
                    ? "إرجاع خلال 7 أيام بحالتها الأصلية."
                    : "Returns accepted within 7 days."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#efe7da]">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#c7a86a] mb-2">
                  {lang === "ar" ? "التقييمات" : "Reviews"}
                </p>
                <h2 className="text-3xl font-bold text-gray-900">
                  {t.reviews.title}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <span className="text-[#c7a86a] text-xl">★</span>
                <span className="font-semibold">{averageRating.toFixed(1)}</span>
                <span className="text-sm">({reviews.length})</span>
              </div>
            </div>

            {user ? (
              <form onSubmit={handleSubmitReview} className="mb-6 space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600">{t.reviews.rating}</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="border border-[#efe7da] rounded-full px-3 py-1 text-sm"
                  >
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t.reviews.comment}
                  className="w-full border border-[#efe7da] rounded-3xl px-4 py-3 text-sm"
                  rows={3}
                  required
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-6 py-3 rounded-full text-black text-sm font-semibold ${
                    submitting ? "bg-gray-300" : "bg-[#c7a86a] hover:bg-[#b59659]"
                  }`}
                >
                  {submitting ? t.common.loading : t.reviews.submit}
                </button>
              </form>
            ) : (
              <p className="text-sm text-gray-600 mb-4">{t.reviews.loginToReview}</p>
            )}

            {reviews.length === 0 ? (
              <p className="text-sm text-gray-600">{t.reviews.empty}</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border border-[#efe7da] rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-900">
                        {review.userName}
                      </p>
                      <p className="text-[#c7a86a]">{"★".repeat(review.rating)}</p>
                    </div>
                    <p className="text-gray-700 text-sm">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#efe7da]">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[#c7a86a] mb-2">
                {lang === "ar" ? "المقاسات" : "Sizing"}
              </p>
              <h2 className="text-2xl font-bold text-gray-900">
                {lang === "ar" ? "دليل المقاسات" : "Size guide"}
              </h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <div className="flex items-center justify-between border-b border-[#efe7da] pb-3">
                <span>{lang === "ar" ? "الطول" : "Length"}</span>
                <span className="font-semibold">{lang === "ar" ? "140-150 سم" : "140-150 cm"}</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#efe7da] pb-3">
                <span>{lang === "ar" ? "عرض الأكمام" : "Sleeve"}</span>
                <span className="font-semibold">{lang === "ar" ? "واسع" : "Relaxed"}</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#efe7da] pb-3">
                <span>{lang === "ar" ? "القصة" : "Fit"}</span>
                <span className="font-semibold">{lang === "ar" ? "مستقيم" : "Straight"}</span>
              </div>
              <p className="text-sm text-gray-600">
                {lang === "ar"
                  ? "المقاسات تقريبية وقد تختلف بحسب القماش."
                  : "Measurements are approximate and may vary by fabric."}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#efe7da]">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[#c7a86a] mb-2">
                {lang === "ar" ? "الأسئلة الشائعة" : "FAQ"}
              </p>
              <h2 className="text-2xl font-bold text-gray-900">
                {lang === "ar" ? "معلومات سريعة" : "Quick answers"}
              </h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <div className="border border-[#efe7da] rounded-2xl p-4">
                <p className="font-semibold text-gray-900">
                  {lang === "ar" ? "هل يوجد شحن سريع؟" : "Do you offer express shipping?"}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {lang === "ar"
                    ? "نعم، الشحن السريع متاح في معظم المدن."
                    : "Yes, express shipping is available in most cities."}
                </p>
              </div>
              <div className="border border-[#efe7da] rounded-2xl p-4">
                <p className="font-semibold text-gray-900">
                  {lang === "ar" ? "هل يمكن استبدال المنتج؟" : "Can I exchange the item?"}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {lang === "ar"
                    ? "يمكن الاستبدال خلال 7 أيام وفقًا للسياسة."
                    : "Exchanges are available within 7 days per policy."}
                </p>
              </div>
              <div className="border border-[#efe7da] rounded-2xl p-4">
                <p className="font-semibold text-gray-900">
                  {lang === "ar" ? "كيف أختار المقاس؟" : "How do I choose my size?"}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {lang === "ar"
                    ? "راجعي دليل المقاسات أو تواصلي معنا للمساعدة."
                    : "Use the size guide or contact us for help."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#efe7da]">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[#c7a86a] mb-2">
                {lang === "ar" ? "الدفع" : "Payments"}
              </p>
              <h2 className="text-2xl font-bold text-gray-900">
                {lang === "ar" ? "طرق الدفع المتاحة" : "Available payment methods"}
              </h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <div className="border border-[#efe7da] rounded-2xl p-4">
                <p className="font-semibold text-gray-900">{lang === "ar" ? "بطاقات" : "Cards"}</p>
                <p className="text-sm text-gray-600 mt-2">
                  {lang === "ar" ? "Visa / MasterCard / Mada" : "Visa / MasterCard / Mada"}
                </p>
              </div>
              <div className="border border-[#efe7da] rounded-2xl p-4">
                <p className="font-semibold text-gray-900">{lang === "ar" ? "الدفع الآمن" : "Secure checkout"}</p>
                <p className="text-sm text-gray-600 mt-2">
                  {lang === "ar"
                    ? "مدفوعات مشفرة عبر Stripe."
                    : "Encrypted payments powered by Stripe."}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#efe7da]">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[#c7a86a] mb-2">
                {lang === "ar" ? "الاسترجاع" : "Returns"}
              </p>
              <h2 className="text-2xl font-bold text-gray-900">
                {lang === "ar" ? "ضمان الاسترجاع السريع" : "Fast return guarantee"}
              </h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <div className="border border-[#efe7da] rounded-2xl p-4">
                <p className="font-semibold text-gray-900">
                  {lang === "ar" ? "7 أيام" : "7 days"}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {lang === "ar"
                    ? "استرجاع سريع خلال 7 أيام من الاستلام."
                    : "Quick returns within 7 days of delivery."}
                </p>
              </div>
              <div className="border border-[#efe7da] rounded-2xl p-4">
                <p className="font-semibold text-gray-900">
                  {lang === "ar" ? "سهلة وبسيطة" : "Easy process"}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {lang === "ar"
                    ? "تواصل معنا وسيتم ترتيب الاسترجاع فورًا."
                    : "Contact us and we’ll arrange the return promptly."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#efe7da]">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[#c7a86a] mb-2">
                {lang === "ar" ? "الضمان" : "Warranty"}
              </p>
              <h2 className="text-2xl font-bold text-gray-900">
                {lang === "ar" ? "سياسة الضمان التفصيلية" : "Detailed warranty policy"}
              </h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <div className="border border-[#efe7da] rounded-2xl p-4">
                <p className="font-semibold text-gray-900">
                  {lang === "ar" ? "مدة الضمان" : "Coverage period"}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {lang === "ar"
                    ? "ضمان 14 يوماً ضد عيوب التصنيع."
                    : "14-day warranty against manufacturing defects."}
                </p>
              </div>
              <div className="border border-[#efe7da] rounded-2xl p-4">
                <p className="font-semibold text-gray-900">
                  {lang === "ar" ? "ما يشمله الضمان" : "What’s covered"}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {lang === "ar"
                    ? "التطريز، الخياطة، وثبات اللون."
                    : "Embroidery, stitching, and color durability."}
                </p>
              </div>
              <div className="border border-[#efe7da] rounded-2xl p-4">
                <p className="font-semibold text-gray-900">
                  {lang === "ar" ? "طريقة الاستفادة" : "How to claim"}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {lang === "ar"
                    ? "تواصلي مع الدعم وارفق رقم الطلب وصورة واضحة."
                    : "Contact support with order ID and clear photos."}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#efe7da]">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[#c7a86a] mb-2">
                {lang === "ar" ? "التخصيص" : "Customization"}
              </p>
              <h2 className="text-2xl font-bold text-gray-900">
                {lang === "ar" ? "تخصيص العباية بالألوان" : "Color customization"}
              </h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <div className="border border-[#efe7da] rounded-2xl p-4">
                <p className="font-semibold text-gray-900">
                  {lang === "ar" ? "لوحة الألوان" : "Color palette"}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {lang === "ar"
                    ? "متوفر: أسود، كحلي، رملي، موف."
                    : "Available: black, navy, sand, mauve."}
                </p>
              </div>
              <div className="border border-[#efe7da] rounded-2xl p-4">
                <p className="font-semibold text-gray-900">
                  {lang === "ar" ? "مدة التنفيذ" : "Lead time"}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {lang === "ar"
                    ? "التخصيص يحتاج 3-5 أيام عمل إضافية."
                    : "Customization takes 3-5 additional business days."}
                </p>
              </div>
              <div className="border border-[#efe7da] rounded-2xl p-4">
                <p className="font-semibold text-gray-900">
                  {lang === "ar" ? "الطلب" : "How to request"}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {lang === "ar"
                    ? "اكتبي اللون المطلوب في ملاحظات الطلب."
                    : "Add your preferred color in order notes."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#efe7da]">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[#c7a86a] mb-2">
                {lang === "ar" ? "اختيار المقاس" : "Size tips"}
              </p>
              <h2 className="text-2xl font-bold text-gray-900">
                {lang === "ar" ? "توصيات المقاسات حسب الطول" : "Height-based sizing"}
              </h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <div className="flex items-center justify-between border-b border-[#efe7da] pb-3">
                <span>{lang === "ar" ? "155-160 سم" : "155-160 cm"}</span>
                <span className="font-semibold">{lang === "ar" ? "طول 54" : "Length 54"}</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#efe7da] pb-3">
                <span>{lang === "ar" ? "160-168 سم" : "160-168 cm"}</span>
                <span className="font-semibold">{lang === "ar" ? "طول 56" : "Length 56"}</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#efe7da] pb-3">
                <span>{lang === "ar" ? "168-175 سم" : "168-175 cm"}</span>
                <span className="font-semibold">{lang === "ar" ? "طول 58" : "Length 58"}</span>
              </div>
              <p className="text-sm text-gray-600">
                {lang === "ar"
                  ? "يمكن تعديل الطول حسب الطلب."
                  : "Length can be adjusted on request."}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#efe7da]">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[#c7a86a] mb-2">
                {lang === "ar" ? "قصص العملاء" : "Customer stories"}
              </p>
              <h2 className="text-2xl font-bold text-gray-900">
                {lang === "ar" ? "تجارب من عملائنا" : "Loved by customers"}
              </h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <div className="border border-[#efe7da] rounded-2xl p-4">
                <p className="font-semibold text-gray-900">
                  {lang === "ar" ? "سارة" : "Sara"}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {lang === "ar"
                    ? "الخامة رائعة والتفصيل أنيق جداً. وصلتني بسرعة!"
                    : "Beautiful fabric and elegant tailoring. Arrived fast!"}
                </p>
              </div>
              <div className="border border-[#efe7da] rounded-2xl p-4">
                <p className="font-semibold text-gray-900">
                  {lang === "ar" ? "ريم" : "Reem"}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {lang === "ar"
                    ? "لون فخم ومقاس مناسب تماماً."
                    : "Luxurious color and perfect fit."}
                </p>
              </div>
              <div className="border border-[#efe7da] rounded-2xl p-4">
                <p className="font-semibold text-gray-900">
                  {lang === "ar" ? "نورة" : "Noura"}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {lang === "ar"
                    ? "أول مرة أشتري منكم وبالتأكيد ليست الأخيرة."
                    : "My first order, definitely not the last."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#efe7da]">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[#c7a86a] mb-2">
                {lang === "ar" ? "خدمات ما بعد البيع" : "After-sale"}
              </p>
              <h2 className="text-2xl font-bold text-gray-900">
                {lang === "ar" ? "خدمة ما بعد البيع" : "After-sales support"}
              </h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <div className="border border-[#efe7da] rounded-2xl p-4">
                <p className="font-semibold text-gray-900">
                  {lang === "ar" ? "تعديلات بسيطة" : "Minor adjustments"}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {lang === "ar"
                    ? "نوفر تعديلات بسيطة حسب الطلب خلال 48 ساعة."
                    : "We offer minor adjustments on request within 48 hours."}
                </p>
              </div>
              <div className="border border-[#efe7da] rounded-2xl p-4">
                <p className="font-semibold text-gray-900">
                  {lang === "ar" ? "دعم فني" : "Customer support"}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {lang === "ar"
                    ? "فريق الدعم جاهز لخدمتك عبر البريد أو الواتساب."
                    : "Our support team is available via email or WhatsApp."}
                </p>
              </div>
              <div className="border border-[#efe7da] rounded-2xl p-4">
                <p className="font-semibold text-gray-900">
                  {lang === "ar" ? "تجربة آمنة" : "Safe experience"}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {lang === "ar"
                    ? "خدمة موثوقة مع متابعة حتى استلام الطلب."
                    : "Reliable service with order tracking until delivery."}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#efe7da]">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[#c7a86a] mb-2">
                {lang === "ar" ? "ضمان الجودة" : "Quality"}
              </p>
              <h2 className="text-2xl font-bold text-gray-900">
                {lang === "ar" ? "ضمان الجودة" : "Quality assurance"}
              </h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <div className="border border-[#efe7da] rounded-2xl p-4">
                <p className="font-semibold text-gray-900">
                  {lang === "ar" ? "فحص الجودة" : "Quality checks"}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {lang === "ar"
                    ? "يتم فحص كل قطعة بعناية قبل الشحن."
                    : "Each piece is inspected carefully before shipping."}
                </p>
              </div>
              <div className="border border-[#efe7da] rounded-2xl p-4">
                <p className="font-semibold text-gray-900">
                  {lang === "ar" ? "خامات موثوقة" : "Trusted fabrics"}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {lang === "ar"
                    ? "خامات مختارة لضمان نعومة وثبات اللون."
                    : "Selected materials for softness and color durability."}
                </p>
              </div>
              <div className="border border-[#efe7da] rounded-2xl p-4">
                <p className="font-semibold text-gray-900">
                  {lang === "ar" ? "تغليف فاخر" : "Premium packaging"}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {lang === "ar"
                    ? "تغليف أنيق يحافظ على المنتج أثناء الشحن."
                    : "Elegant packaging that protects your order."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              {lang === "ar" ? "منتجات مشابهة" : "You may also like"}
            </h2>
            <Link
              href="/products"
              className="text-[#c7a86a] font-semibold hover:underline"
            >
              {t.products.title}
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(relatedProducts.length > 0 ? relatedProducts : fallbackProducts).map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
