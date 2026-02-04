"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useCart, Product } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useReviews, Review } from "@/context/ReviewsContext";
import Image from "next/image";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="relative h-80 w-full">
        <Image
          src={product.image}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {!product.inStock && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            {t.products.outOfStock}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-xl font-bold mb-2 text-gray-800">{name}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{description}</p>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-yellow-500">★</span>
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
          <span className="text-2xl font-bold text-gray-900">${product.price}</span>
          <button
            onClick={() => addToCart(product)}
            disabled={!product.inStock}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              product.inStock
                ? "bg-gray-900 text-white hover:bg-gray-800"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {t.products.addToCart}
          </button>
        </div>

        {showReviews && (
          <div className="mt-4 border-t pt-4">
            <h4 className="text-lg font-semibold mb-3">{t.reviews.title}</h4>

            {user ? (
              <form onSubmit={handleSubmit} className="mb-4 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">{t.reviews.rating}</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="border rounded px-2 py-1 text-sm"
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
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={2}
                  required
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 rounded-lg text-white text-sm ${
                    submitting ? "bg-gray-400" : "bg-gray-900 hover:bg-gray-800"
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
