import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // استعلام خفيف جداً لتنشيط قاعدة البيانات
    const { data, error } = await supabase
      .from('inventory_categories')
      .select('id')
      .limit(1);

    if (error) {
      return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      status: 'active',
      message: 'Supabase database pinged successfully to prevent pausing',
      timestamp: new Date().toISOString(),
      recordCount: data?.length ?? 0
    });
  } catch (err: any) {
    return NextResponse.json({ status: 'error', message: err?.message || 'Unknown error' }, { status: 500 });
  }
}
