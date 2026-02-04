"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useCart, Product } from "@/context/CartContext";
import Image from "next/image";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { lang, t } = useLanguage();
  const { addToCart } = useCart();

  const name = lang === "ar" ? product.nameAr : product.name;
  const description = lang === "ar" ? product.descriptionAr : product.description;

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
      </div>
    </div>
  );
}
