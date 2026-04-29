import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// الصفحات العامة التي لا تحتاج تسجيل دخول
const PUBLIC_PATHS = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // السماح للمسارات العامة
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // التحقق من وجود كوكي الجلسة (Supabase)
  const hasSession =
    request.cookies.has('sb-access-token') ||
    request.cookies.has('sb-refresh-token') ||
    // Supabase v2 cookie pattern
    [...request.cookies.getAll()].some(c => c.name.includes('supabase') || c.name.includes('sb-'));

  if (!hasSession) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * تطابق كل المسارات ما عدا:
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - الملفات العامة (api, images...)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
