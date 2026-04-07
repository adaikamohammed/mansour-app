'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Calendar, Package } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';
import { useInventory } from '@/lib/hooks/useInventory';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';

const PAGE_TITLES: Record<string, string> = {
  '/':          'لوحة التحكم',
  '/workers':   'إدارة العمال',
  '/workers/attendance': 'الحضور اليومي',
  '/inventory': 'إدارة المخزن',
  '/tasks':     'المهام والجدول',
  '/reports':   'التقارير والإحصاء',
};

export default function Topbar() {
  const pathname = usePathname();
  const [now, setNow] = useState(new Date());
  const { lowStockItems } = useInventory();
  const { role } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);

  // الاسم الظاهر: فقط "منصور" للمدير، وأيقونة مجهولة للمراقب
  const displayName = role === 'manager' ? 'منصور' : '•••';
  const displayRole = role === 'manager' ? 'مدير المخزن' : 'مراقب';

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path)
  )?.[1] ?? 'مخزن منصور';

  return (
    <header className="flex items-center justify-between mb-8 pb-6 border-b border-slate-200/60 dark:border-slate-800/60 relative z-30">
      {/* عنوان الصفحة */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {title}
        </h1>
        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 font-medium">
          <Calendar size={13} />
          <span>{formatDate(now.toISOString())}</span>
          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
          <span dir="ltr">{formatTime(now)}</span>
        </div>
      </div>

      {/* الجانب الأيسر: إشعارات */}
      <div className="flex items-center gap-3 relative">
        <button
          onClick={() => setShowNotifs(!showNotifs)}
          aria-label="الإشعارات"
          className="relative p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-200 dark:hover:border-violet-700 shadow-sm transition-all duration-300"
        >
          <Bell size={18} />
          {/* نقطة الإشعار الحقيقية بناءً على المخزون المنخفض */}
          {lowStockItems.length > 0 && (
            <span className="absolute top-2.5 left-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-800" />
          )}
        </button>

        {/* قائمة الإشعارات */}
        <AnimatePresence>
          {showNotifs && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute left-full -translate-x-12 sm:translate-x-0 sm:left-auto sm:right-0 top-full mt-3 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 shadow-2xl rounded-3xl p-4 z-50 overflow-hidden"
              >
                <div className="flex justify-between items-center mb-3 px-1">
                  <h3 className="font-black text-slate-800 dark:text-white">الإشعارات</h3>
                  {lowStockItems.length > 0 && (
                    <span className="text-[10px] font-black bg-rose-100 text-rose-600 dark:bg-rose-900/30 px-2 py-0.5 rounded-lg">
                      {lowStockItems.length} جديد
                    </span>
                  )}
                </div>
                {lowStockItems.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-sm font-medium border-t border-slate-100 dark:border-slate-800 mt-2">
                    لا توجد إشعارات حالياً
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {lowStockItems.map(item => (
                      <div key={item.id} className="flex gap-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center shrink-0">
                          <Package size={14} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white text-xs mb-1">{item.sub_type}</p>
                          <p className="text-[10px] text-amber-600 font-bold">المتبقي: {item.stock?.quantity ?? 0} {item.unit} فقط</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* بطاقة المستخدم */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm relative z-30">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm">
            {displayName[0] ?? 'م'}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-black text-slate-700 dark:text-slate-200 leading-none">{displayName}</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{displayRole}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
