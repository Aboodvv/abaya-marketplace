"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { OrdersProvider } from "@/context/OrdersContext";
import { ReviewsProvider } from "@/context/ReviewsContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { dir } = useLanguage();

  return (
    <html lang={dir === "rtl" ? "ar" : "en"} dir={dir}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <LanguageProvider>
        <CartProvider>
          <OrdersProvider>
            <ReviewsProvider>
              <NotificationsProvider>
                <LayoutContent>{children}</LayoutContent>
              </NotificationsProvider>
            </ReviewsProvider>
          </OrdersProvider>
        </CartProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
