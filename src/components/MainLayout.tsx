'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import PageWrapper from '@/components/PageWrapper';
import { Menu } from 'lucide-react';

function MansourLogoMini() {
  return (
    <svg width="28" height="28" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ml-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="ml-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="ml-purple" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#ml-bg)" />
      <rect x="12" y="32" width="40" height="20" rx="2" fill="url(#ml-purple)" opacity="0.9" />
      <path d="M8 33 L32 16 L56 33 Z" fill="url(#ml-gold)" />
      <rect x="26" y="40" width="12" height="12" rx="2" fill="#0f172a" opacity="0.7" />
      <circle cx="32" cy="16" r="3" fill="#fbbf24" />
    </svg>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // إذا كانت الصفحة الحالية هي تسجيل الدخول، اعرضها بدون الشريط الجانبي والعلوي
  if (pathname === '/login') {
    return <main className="min-h-screen bg-slate-50 dark:bg-slate-950">{children}</main>;
  }

  return (
    <div className="flex bg-slate-50 dark:bg-slate-950 overflow-hidden font-cairo h-screen w-full" dir="rtl">
      {/* الشريط الجانبي */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* المحتوى الرئيسي */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* الهيدر العلوي للموبايل */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-violet-600 dark:text-violet-400"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <MansourLogoMini />
              <span className="font-black text-sm text-slate-800 dark:text-white">مخزن منصور</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-[1400px] mx-auto w-full">
            <Topbar />
            <PageWrapper>
              {children}
            </PageWrapper>
          </div>
        </main>
      </div>
    </div>
  );
}
