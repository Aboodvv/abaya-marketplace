import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // حماية أعمق: منع الوصول لـ /seller إذا لم يكن التاجر approved
  const approved = req.cookies.get("seller_approved")?.value;
  if (pathname.startsWith("/seller") && approved !== "true") {
    return NextResponse.redirect(new URL("/seller/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/seller/:path*"],
};
