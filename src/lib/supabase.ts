import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * createBrowserClient (من @supabase/ssr) يخزّن الجلسة في Cookies
 * بدلاً من localStorage، بحيث يستطيع الـ proxy الخادم قراءتها.
 * هذا هو سبب حل مشكلة إعادة التوجيه اللانهائية.
 */
export const supabase = createBrowserClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
