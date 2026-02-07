"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useCart, Product } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useReviews, Review } from "@/context/ReviewsContext";
import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { lang, t } = useLanguage();
  const { addToCart } = useCart();
  const { user, userProfile } = useAuth();
  const { addReview, getReviewsByProduct } = useReviews();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviews, setShowReviews] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const name = lang === "ar" ? product.nameAr : product.name;
  const description = lang === "ar" ? product.descriptionAr : product.description;

  useEffect(() => {
    const load = async () => {
      const data = await getReviewsByProduct(product.id);
      setReviews(data);
    };

    load();
  }, [getReviewsByProduct, product.id]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return total / reviews.length;
  }, [reviews]);

  const fallbackName =
    userProfile?.name ||
    user?.displayName ||
    (user?.email ? user.email.split("@")[0] : lang === "ar" ? "مستخدم" : "User");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    await addReview({
      productId: product.id,
      userId: user.uid,
      userName: fallbackName,
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
    <div className="group bg-white rounded-2xl shadow-md overflow-hidden border border-[#efe7da] hover:shadow-xl transition">
      <Link href={`/products/${product.id}`} className="relative h-80 w-full block">
        <Image
          src={product.image}
          alt={name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-transparent" />
        {!product.inStock && (
          <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            {t.products.outOfStock}
          </div>
        )}
        <div className="absolute bottom-3 left-3 bg-white/90 text-black px-3 py-1 rounded-full text-xs font-semibold">
          ${product.price}
        </div>
      </Link>
      <div className="p-5">
        <Link href={`/products/${product.id}`} className="block">
          <h3 className="text-lg font-bold mb-2 text-gray-900 line-clamp-1 hover:text-[#c7a86a] transition">
            {name}
          </h3>
        </Link>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{description}</p>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[#c7a86a]">★</span>
          <span className="text-sm text-gray-700">
            {averageRating.toFixed(1)} ({reviews.length})
          </span>
          <button
            onClick={() => setShowReviews((prev) => !prev)}
            className="text-sm text-gray-700 underline"
          >
            {t.reviews.title}
          </button>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm uppercase tracking-[0.2em] text-[#c7a86a]">
            {product.inStock ? t.products.inStock : t.products.outOfStock}
          </span>
          <button
            onClick={() => addToCart(product)}
            disabled={!product.inStock}
            className={`px-5 py-2 rounded-full font-semibold transition ${
              product.inStock
                ? "bg-[#c7a86a] text-black hover:bg-[#b59659]"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {t.products.addToCart}
          </button>
        </div>

        {showReviews && (
          <div className="mt-4 border-t border-[#efe7da] pt-4">
            <h4 className="text-lg font-semibold mb-3">{t.reviews.title}</h4>

            {user ? (
              <form onSubmit={handleSubmit} className="mb-4 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">{t.reviews.rating}</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="border border-[#efe7da] rounded px-2 py-1 text-sm"
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
                  className="w-full border border-[#efe7da] rounded-lg px-3 py-2 text-sm"
                  rows={2}
                  required
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 rounded-full text-black text-sm ${
                    submitting ? "bg-gray-300" : "bg-[#c7a86a] hover:bg-[#b59659]"
                  }`}
                >
                  {submitting ? t.common.loading : t.reviews.submit}
                </button>
              </form>
            ) : (
              <p className="text-sm text-gray-600 mb-3">{t.reviews.loginToReview}</p>
            )}

            {reviews.length === 0 ? (
              <p className="text-sm text-gray-600">{t.reviews.empty}</p>
            ) : (
              <div className="space-y-3">
                {reviews.slice(0, 3).map((review) => (
                  <div key={review.id} className="text-sm text-gray-700">
                    <p className="font-semibold">
                      {review.userName} - {"★".repeat(review.rating)}
                    </p>
                    <p>{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
