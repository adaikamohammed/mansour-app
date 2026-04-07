import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ============================================
// cn — دمج كلاسات Tailwind بأمان
// ============================================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// تنسيق التاريخ
// ============================================
export function formatDate(dateStr: string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA-u-nu-latn', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...opts,
    });
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string | null | undefined): string {
  return formatDate(dateStr, { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('ar-SA-u-nu-latn', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================
// تنسيق الأرقام
// ============================================
export function formatNumber(n: number | null | undefined): string {
  if (n == null) return '0';
  return n.toLocaleString('en-US');
}

export function formatCurrency(n: number | null | undefined): string {
  if (n == null) return '0 دج';
  return `${n.toLocaleString('en-US')} دج`;
}

// ============================================
// حسابات ألفا ستورج
// ============================================

/** حساب مبلغ الخصم بناءً على الأجر اليومي ونسبة الخصم */
export function calcDiscount(dailyRate: number, discountRate: number): number {
  return (dailyRate * discountRate) / 100;
}

/** حساب نسبة الحضور */
export function calcAttendanceRate(present: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
}

/** تحديد لون نسبة الحضور */
export function attendanceRateColor(rate: number): string {
  if (rate >= 90) return 'text-emerald-600';
  if (rate >= 70) return 'text-amber-500';
  return 'text-rose-500';
}

/** تحديد حالة المخزون */
export function getStockStatus(quantity: number): 'low' | 'normal' | 'high' {
  if (quantity <= 50) return 'low';
  if (quantity <= 200) return 'normal';
  return 'high';
}

// ============================================
// مساعدات متنوعة
// ============================================

/** الحصول على الحرف الأول كأفاتار */
export function getInitials(name: string): string {
  return name.trim().charAt(0) || '؟';
}

/** تقليص النص الطويل */
export function truncate(str: string, maxLen = 40): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '...';
}

/** تأخير البرنامجي (للتطوير) */
export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** بناء خطأ Supabase مقروء */
export function supabaseErrorMsg(error: unknown): string {
  if (!error) return 'خطأ غير معروف';
  if (typeof error === 'object' && 'message' in error) {
    return (error as { message: string }).message;
  }
  return String(error);
}
