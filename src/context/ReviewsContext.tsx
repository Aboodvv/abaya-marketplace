"use client";

import React, { createContext, useContext } from "react";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ReviewsContextType {
  addReview: (data: {
    productId: string;
    userId: string;
    userName: string;
    rating: number;
    comment: string;
  }) => Promise<string>;
  getReviewsByProduct: (productId: string) => Promise<Review[]>;
}

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined);

export const ReviewsProvider = ({ children }: { children: React.ReactNode }) => {
  const addReview = async (data: {
    productId: string;
    userId: string;
    userName: string;
    rating: number;
    comment: string;
  }) => {
    const payload = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, "reviews"), payload);
    return docRef.id;
  };

  const getReviewsByProduct = async (productId: string) => {
    const reviewsQuery = query(
      collection(db, "reviews"),
      where("productId", "==", productId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(reviewsQuery);
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<Review, "id">),
    }));
  };

  return (
    <ReviewsContext.Provider value={{ addReview, getReviewsByProduct }}>
      {children}
    </ReviewsContext.Provider>
  );
};

export const useReviews = () => {
  const context = useContext(ReviewsContext);
  if (!context) {
    throw new Error("useReviews must be used within ReviewsProvider");
  }
  return context;
};
