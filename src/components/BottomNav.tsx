"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, Sparkles, Tag, User } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const navItems = [
  { href: "/", key: "home", icon: Home },
  { href: "/offers", key: "offers", icon: Tag },
  { href: "/daily-picks", key: "dailyPick", icon: Sparkles },
  { href: "/favorites", key: "favorites", icon: Heart },
  { href: "/profile", key: "account", icon: User },
] as const;

export default function BottomNav() {
  const { t, dir } = useLanguage();
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#efe7da] bg-white shadow-[0_-8px_24px_-18px_rgba(0,0,0,0.35)]">
      <div
        className={`mx-auto grid max-w-6xl grid-cols-5 items-center px-4 pt-2 ${
          dir === "rtl" ? "direction-rtl" : ""
        }`}
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)" }}
      >
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition sm:text-xs ${
                isActive ? "text-[#c7a86a]" : "text-gray-500"
              }`}
            >
              <Icon size={22} className="sm:h-6 sm:w-6" />
              <span>{t.nav[item.key]}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
