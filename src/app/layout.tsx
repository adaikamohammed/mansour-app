import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import PageWrapper from '@/components/PageWrapper';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '900'],
  variable: '--font-cairo',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#7c3aed',
};

export const metadata: Metadata = {
  title: 'ألفا ستورج | إدارة المخزن والعمال',
  description: 'نظام متكامل لإدارة المخزن والعمال والمهام — ألفا ستورج',
  keywords: ['مخزن', 'عمال', 'حضور', 'مهام', 'تقارير'],
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable} suppressHydrationWarning>
      {/* منع وميض الثيم — يُشغَّل قبل React hydration */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('theme');
                var p = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                if (t === 'dark' || (!t && p === 'dark')) document.documentElement.classList.add('dark');
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="font-cairo antialiased">
        <ThemeProvider>
          <ToastProvider>
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
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
