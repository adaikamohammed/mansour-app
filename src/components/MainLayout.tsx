'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import PageWrapper from '@/components/PageWrapper';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // إذا كانت الصفحة الحالية هي تسجيل الدخول، اعرضها بدون الشريط الجانبي والعلوي
  if (pathname === '/login') {
    return <main className="min-h-screen bg-slate-50 dark:bg-slate-950">{children}</main>;
  }

  return (
    <div className="flex min-h-screen">
      {/* الشريط الجانبي */}
      <Sidebar />

      {/* المحتوى الرئيسي */}
      <main className="flex-1 transition-all duration-300 min-h-screen" style={{ marginRight: 'var(--sidebar-width, 0px)' }}>
        <div className="p-5 sm:p-8 max-w-[1400px] mx-auto">
          <Topbar />
          <PageWrapper>
            {children}
          </PageWrapper>
        </div>
      </main>
    </div>
  );
}
