'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import PageWrapper from '@/components/PageWrapper';
import { Menu, BoxesIcon } from 'lucide-react';

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
              <BoxesIcon className="text-violet-600" size={20} />
              <span className="font-black text-sm text-slate-800 dark:text-white mt-1">مخزن منصور</span>
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
