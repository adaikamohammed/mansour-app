'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Package, ClipboardList, TrendingUp, Wallet,
  X, ChevronRight, Sun, Moon, CalendarCheck, LogOut,
} from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useInventory } from '@/lib/hooks/useInventory';

/* ─── لوغو مخزن منصور ─── */
function MansourLogo({ size = 40 }: { size?: number }) {
  return (
    <div className="relative flex items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100 p-1" style={{ width: size, height: size }}>
      <Image 
        src="/logo.png" 
        alt="Mansour Logo" 
        width={size} 
        height={size} 
        className="object-contain"
        priority
      />
    </div>
  );
}

const navItems = [
  { name: 'لوحة التحكم', href: '/',                   icon: LayoutDashboard, badge: null },
  { name: 'العمال',      href: '/workers',             icon: Users,           badge: null },
  { name: 'الحضور',      href: '/workers/attendance',  icon: CalendarCheck,   badge: null },
  { name: 'المخزن',      href: '/inventory',           icon: Package,         badge: null },
  { name: 'المهام',      href: '/tasks',               icon: ClipboardList,   badge: null },
  { name: 'التقارير',    href: '/reports',             icon: TrendingUp,      badge: null },
  { name: 'المالية',     href: '/finance',             icon: Wallet,          badge: null },
];

export default function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen?: boolean; setMobileOpen?: (v: boolean) => void }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { role, signOut } = useAuth();
  const { lowStockItems } = useInventory();
  const [collapsed, setCollapsed] = useState(false);

  // استعادة حالة الطي من localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === 'true') setCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    setCollapsed(prev => {
      localStorage.setItem('sidebar-collapsed', String(!prev));
      return !prev;
    });
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="h-full flex flex-col py-5 px-3 gap-2">

      {/* الشعار والعنوان */}
      <div className={cn(
        'flex items-center px-2 mb-4',
        collapsed && !mobile ? 'justify-center' : 'justify-between'
      )}>
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <MansourLogo size={collapsed && !mobile ? 36 : 40} />
          </div>
          {(!collapsed || mobile) && (
            <div>
              <h1 className="text-lg font-black tracking-tight bg-gradient-to-l from-blue-600 to-sky-500 bg-clip-text text-transparent leading-none">
                مخزن منصور
              </h1>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">إدارة المخزن والعمال</p>
            </div>
          )}
        </div>

        {/* زر إغلاق الموبايل */}
        {mobile && setMobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        )}

        {/* زر الطي في الديسكتوب */}
        {!mobile && (
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            aria-label={collapsed ? 'فتح الشريط' : 'طي الشريط'}
          >
            <motion.div animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.3 }}>
              <ChevronRight size={18} />
            </motion.div>
          </button>
        )}
      </div>

      {/* خط فاصل */}
      <div className="h-px bg-slate-200 dark:bg-slate-800 mx-2 mb-2" />

      {/* قائمة التنقل */}
      <nav className="flex-1 space-y-2 px-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href + '/') && 
             !navItems.some(n => n.href !== item.href && pathname.startsWith(n.href)));
          const dynamicBadge = item.href === '/inventory' && lowStockItems.length > 0 ? String(lowStockItems.length) : item.badge;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onClick={() => mobile && setMobileOpen && setMobileOpen(false)}
              title={collapsed && !mobile ? item.name : undefined}
            >
              <motion.div
                whileHover={{ x: collapsed && !mobile ? 0 : 3 }}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  'sidebar-item relative group',
                  collapsed && !mobile ? 'justify-center px-2' : '',
                  isActive ? 'active' : '',
                )}
              >
                {/* نقطة الحالة النشطة بالـ Spring */}
                {isActive && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-2xl bg-gradient-to-l from-blue-600 to-sky-500 shadow-md shadow-blue-500/30 -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 35 }}
                  />
                )}

                <item.icon
                  size={20}
                  className={cn(
                    'shrink-0 transition-transform duration-300',
                    isActive ? 'text-white' : 'group-hover:text-blue-600',
                  )}
                />

                {(!collapsed || mobile) && (
                  <span className={cn('font-bold text-sm', isActive ? 'text-white font-black' : '')}>
                    {item.name}
                  </span>
                )}

                {/* Badge */}
                {dynamicBadge && (!collapsed || mobile) && (
                  <span className={cn(
                    'mr-auto text-[10px] font-black px-2 py-0.5 rounded-full',
                       isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  )}>
                    {dynamicBadge}
                  </span>
                )}

                {/* Tooltip عند الطي */}
                {collapsed && !mobile && (
                  <div className="absolute right-full ml-3 translate-x-1 group-hover:scale-100 group-hover:translate-x-3 transition-all origin-left z-50 pointer-events-none">
                    <div className="bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-xl ml-2">
                      {item.name}
                    </div>
                  </div>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* خط فاصل */}
      <div className="h-px bg-slate-200 dark:bg-slate-800 mx-2 mb-2" />

      {/* أسفل الشريط: ثيم + معلومات */}
      <div className={cn('space-y-2', collapsed && !mobile ? 'flex flex-col items-center' : '')}>
        {/* زر الثيم */}
        <button
          onClick={toggleTheme}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-3 rounded-2xl',
            'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
            'transition-all duration-300 font-bold text-sm',
            collapsed && !mobile ? 'justify-center' : '',
          )}
          aria-label="تبديل الوضع الليلي"
        >
          <AnimatePresence mode="wait">
            {theme === 'dark' ? (
              <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Sun size={20} className="text-amber-500" />
              </motion.div>
            ) : (
              <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Moon size={20} />
              </motion.div>
            )}
          </AnimatePresence>
          {(!collapsed || mobile) && (
            <span>{theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}</span>
          )}
        </button>

        {/* زر تسجيل الخروج */}
        <button
          onClick={signOut}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-3 rounded-2xl',
            'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20',
            'transition-all duration-300 font-bold text-sm',
            collapsed && !mobile ? 'justify-center' : '',
          )}
          aria-label="تسجيل الخروج"
          title={role === 'manager' ? 'تسجيل خروج مدير المخزن' : 'تسجيل الخروج'}
        >
          <LogOut size={20} />
          {(!collapsed || mobile) && <span>تسجيل الخروج</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ═══ الشريط الجانبي — ديسكتوب ═══ */}
      <aside
        className={cn(
          'hidden lg:flex shrink-0 h-screen sticky top-0 z-40',
          'flex-col transition-all duration-300',
          collapsed ? 'w-[5.5rem]' : 'w-[18rem]',
        )}
      >
        <div className="h-[calc(100vh-1.5rem)] my-3 mx-2 rounded-3xl overflow-hidden glass-card border border-slate-200/50 dark:border-slate-800/50 shadow-xl bg-white/50 dark:bg-slate-900/50 shadow-slate-200/20 dark:shadow-slate-900/20 flex flex-col">
          <SidebarContent />
        </div>
      </aside>

      {/* ═══ الشريط الجانبي — موبايل ═══ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen && setMobileOpen(false)}
              className="fixed inset-0 bg-slate-950/60 z-[60] lg:hidden"
            />
            <motion.aside
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
              className="fixed top-0 right-0 h-full w-72 z-[70] lg:hidden overflow-hidden bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl"
              style={{ willChange: 'transform' }}
            >
              <SidebarContent mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

