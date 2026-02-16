import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // حماية أعمق: منع الوصول لـ /seller إذا لم يكن التاجر approved
  const approved = req.cookies.get("seller_approved")?.value;
  const exemptPages = [
    "/seller/login",
    "/seller/register",
    "/seller/agreement"
  ];
  if (
    pathname.startsWith("/seller") &&
    approved !== "true" &&
    !exemptPages.some((page) => pathname.startsWith(page))
  ) {
    return NextResponse.redirect(new URL("/seller/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/seller/:path*"],
};
