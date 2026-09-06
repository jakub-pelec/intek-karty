import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const publicPaths = ["/login", "/reveal"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user?.id;
  const isAdmin = req.auth?.user?.role === "admin";

  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/twitch") ||
    pathname.startsWith("/api/reveal")
  ) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    const dest = isLoggedIn ? "/dashboard" : "/login";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  if (publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    if (pathname === "/login" && isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const login = new URL("/login", req.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|cards/|boosters/|uploads/|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
