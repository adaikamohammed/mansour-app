import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;

  // صفحة تسجيل الدخول مفتوحة للجميع
  if (pathname.startsWith('/login')) {
    return res;
  }

  // التحقق من الجلسة
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * نطبق الحماية على جميع المسارات ماعدا:
     * - _next (ملفات Next.js الداخلية)
     * - الأيقونات والصور الثابتة
     * - login
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|login).*)',
  ],
};
