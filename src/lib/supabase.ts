import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// إنشاء العميل فقط إذا كانت المتغيرات موجودة (لتجنب فشل البناء الثابت)
const getSupabase = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('متغيرات Supabase البيئية مفقودة. تحقق من NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = (() => {
  try {
    return createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-key'
    );
  } catch {
    return createClient('https://placeholder.supabase.co', 'placeholder-key');
  }
})();
