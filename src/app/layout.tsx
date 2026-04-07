import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import MainLayout from '@/components/MainLayout';
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
  title: 'مخزن منصور | إدارة المخزن والعمال',
  description: 'نظام متكامل لإدارة المخزن والعمال والمهام — مخزن منصور',
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
            <MainLayout>
              {children}
            </MainLayout>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
