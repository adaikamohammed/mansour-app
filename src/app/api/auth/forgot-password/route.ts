import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'البريد الإلكتروني مطلوب' }, { status: 400 });
    }

    // 1. Initialize Supabase Admin (needed to generate links)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 2. Generate Recovery Link
    // redirectTo must be the page where the user enters the new password
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`
      }
    });

    if (error) {
      // If user not found, we still return 200 to prevent enumeration
      if (error.message.includes("User not found")) {
        return NextResponse.json({ success: true });
      }
      throw error;
    }

    // 3. Send Email via our custom helper
    const resetLink = data.properties.action_link;
    const emailSent = await sendPasswordResetEmail(email, resetLink);

    if (!emailSent) {
      return NextResponse.json({ error: 'فشل إرسال البريد الإلكتروني' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Forgot password API error:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}
