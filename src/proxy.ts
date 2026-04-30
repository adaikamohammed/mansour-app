import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;

  // المسارات المفتوحة (تسجيل الدخول، استعادة كلمة المرور، روابط الأوت)
  const isAuthPath = pathname.startsWith('/login') || 
                     pathname.startsWith('/forgot-password') || 
                     pathname.startsWith('/reset-password') ||
                     pathname.startsWith('/auth/callback');

  if (isAuthPath) {
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

  // ملاحظة: يمكنك هنا إضافة تحقق إضافي من البريد الإلكتروني أو الدور
  // لضمان دخول مدير المخزن فقط.
  // const userEmail = session.user.email;
  // if (userEmail !== 'mansour@mansour.com') { ... }

  return res;
}

export const config = {
  matcher: [
    /*
     * نطبق الحماية على جميع المسارات ماعدا:
     * - _next (ملفات Next.js الداخلية)
     * - الأيقونات والصور الثابتة
     * - login, forgot-password, reset-password, auth/callback
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|login|forgot-password|reset-password|auth/callback).*)',
  ],
};

