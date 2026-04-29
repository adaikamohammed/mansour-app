'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, Calculator, Coins, TrendingUp, Users,
  CalendarDays, Download, Filter, FileText
} from 'lucide-react';
import { useWorkers } from '@/lib/hooks/useWorkers';
import { useInventory } from '@/lib/hooks/useInventory';
import Badge from '@/components/ui/Badge';
import { formatCurrency, formatNumber, getInitials } from '@/lib/utils';
import { Select } from '@/components/ui/Input';
import { useAuth, canEdit } from '@/lib/auth';

// دالة لتوليد أيام الشهر بالكامل بناءً على (YYYY-MM)
function getMonthRange(yearMonth: string) {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0); // آخر يوم في الشهر
  return { start, end };
}

export default function FinancePage() {
  const { workers, loading: wLoad } = useWorkers();
  const { items, loading: iLoad } = useInventory();
  const { role } = useAuth();
  const isManager = canEdit(role);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [absentPenalty, setAbsentPenalty] = useState(1);
  const [latePenalty, setLatePenalty] = useState(0.25);

  // حسابات الرواتب
  const payrollData = useMemo(() => {
    const { start: monthStart, end: monthEnd } = getMonthRange(selectedMonth);
    const todayDate = new Date();
    todayDate.setHours(0,0,0,0);

    // الحد الأقصى للحساب هو إما نهاية الشهر أو اليوم (أيهما أسبق)
    const calculationEnd = monthEnd > todayDate ? todayDate : monthEnd;

    return workers.map((w) => {
      const attendances = Array.isArray((w as any).attendance) ? (w as any).attendance : [];
      
      const joinDate = new Date(w.join_date);
      joinDate.setHours(0,0,0,0);
      
      // بداية الحساب للعامل في هذا الشهر هي (بداية الشهر) أو (تاريخ انضمامه) أيهما أحدث
      const effectiveStart = new Date(Math.max(monthStart.getTime(), joinDate.getTime()));
      effectiveStart.setHours(0,0,0,0);

      let expectedDays = 0;
      if (calculationEnd >= effectiveStart) {
         const diffTime = calculationEnd.getTime() - effectiveStart.getTime();
         expectedDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      }

      // تصفية السجلات المسجلة بداخل الشهر المختار
      const validAtts = attendances.filter((r: any) => {
        const d = new Date(r.date);
        d.setHours(0,0,0,0);
        return d >= effectiveStart && d <= calculationEnd;
      });
      
      const presentDays = validAtts.filter((r: any) => r.status === 'present').length;
      const lateDays = validAtts.filter((r: any) => r.status === 'late').length;
      const recordedAbsent = validAtts.filter((r: any) => r.status === 'absent').length;
      
      // الأيام الغائبة = المسجلة غياب + أيام مفقودة في السجل ضمن الفترة المتوقعة
      const unrecordedDays = Math.max(0, expectedDays - (presentDays + lateDays + recordedAbsent));
      const absentDays = recordedAbsent + unrecordedDays;

      const basicSalary = expectedDays * w.daily_rate;
      const absentDiscount = absentDays * w.daily_rate * absentPenalty;
      const lateDiscount = lateDays * w.daily_rate * latePenalty;
      const totalDiscount = absentDiscount + lateDiscount;
      const netSalary = Math.max(0, basicSalary - totalDiscount);

      return {
        ...w,
        totalDays: expectedDays, presentDays, absentDays, lateDays,
        basicSalary, totalDiscount, netSalary
      };
    });
  }, [workers, selectedMonth, absentPenalty, latePenalty]);

  const totalNetSalaries = payrollData.reduce((sum, w) => sum + w.netSalary, 0);
  const totalDeductions = payrollData.reduce((sum, w) => sum + w.totalDiscount, 0);



  const loading = wLoad || iLoad;

  return (
    <div className="space-y-8">
      {/* ─── الترويسة والفلاتر ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 flex items-center justify-center shrink-0">
              <Wallet size={20} />
            </div>
            الإدارة المالية
          </h1>
          <p className="text-sm text-slate-500 font-bold max-w-lg">
            إدارة رواتب العمال آلياً والخصومات.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          {/* إعدادات الخصم */}
          {isManager && (
            <div className="flex bg-white dark:bg-slate-900 shadow-sm p-1 rounded-2xl items-center border border-slate-100 dark:border-slate-800" title="تخصيص نسبة الخصم من الأجر لحالات الغياب والتأخر">
               <div className="flex items-center px-3">
                <span className="text-xs font-bold text-slate-500 mr-2">غياب:</span>
                <input type="number" step="0.1" min="0" value={absentPenalty} title="نسبة الخصم لكل يوم غياب" aria-label="نسبة خصم الغياب" onChange={e => setAbsentPenalty(Number(e.target.value))} className="w-12 text-sm font-black text-rose-600 bg-transparent outline-none dir-ltr" />
              </div>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center px-3">
                <span className="text-xs font-bold text-slate-500 mr-2">تأخر:</span>
                <input type="number" step="0.1" min="0" value={latePenalty} title="نسبة الخصم لكل يوم تأخر" aria-label="نسبة خصم التأخر" onChange={e => setLatePenalty(Number(e.target.value))} className="w-12 text-sm font-black text-amber-600 bg-transparent outline-none dir-ltr" />
              </div>
            </div>
          )}

          <div className="relative">
            <CalendarDays size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="month"
              value={selectedMonth}
              max={new Date().toISOString().substring(0, 7)}
              onChange={e => setSelectedMonth(e.target.value || new Date().toISOString().substring(0, 7))}
              className="form-input py-2.5 pr-10 text-sm font-bold bg-white dark:bg-slate-900 shadow-sm cursor-pointer"
            />
          </div>
          <button className="btn btn-primary px-4 py-2.5 text-sm shadow-lg shadow-violet-200 dark:shadow-violet-900/40 shrink-0">
            <Download size={16} />
            تصدير كشف
          </button>
        </div>
      </div>

      {/* ─── بطاقات الإحصاء ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-6 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 opacity-10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center mb-4">
            <Calculator size={24} />
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي الرواتب الصافية</p>
          <p className="text-3xl font-black text-emerald-600">{formatCurrency(totalNetSalaries)}</p>
          <p className="text-xs font-bold text-slate-400 mt-2">عن شهر: {selectedMonth}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card rounded-3xl p-6 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500 opacity-10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center mb-4">
            <TrendingUp size={24} />
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي الخصومات</p>
          <p className="text-3xl font-black text-rose-600">{formatCurrency(totalDeductions)}</p>
          <p className="text-xs font-bold text-slate-400 mt-2">بسبب الغياب والتأخر</p>
        </motion.div>


      </div>

      {/* ─── جدول الرواتب ─── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass-card rounded-4xl overflow-hidden shadow-xl"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="text-violet-500" size={18} />
            كشف الرواتب - {selectedMonth}
          </h2>
          <Badge variant="normal" size="sm">{payrollData.length} عمال</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>العامل</th>
                <th className="text-center">الأجر اليومي</th>
                <th className="text-center">أيام العمل</th>
                <th className="text-center">غياب / تأخر</th>
                <th className="text-center">الخصم</th>
                <th className="text-center">الصافي المستحق</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="py-4 px-6"><div className="h-10 skeleton w-full rounded-xl" /></td>
                  </tr>
                ))
              ) : payrollData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 font-bold text-slate-400">لا يوجد عمال لعرض الرواتب</td>
                </tr>
              ) : (
                <AnimatePresence>
                  {payrollData.map((worker) => (
                    <motion.tr
                      key={worker.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 flex items-center justify-center shrink-0 border-2 border-white dark:border-slate-900 shadow-sm overflow-hidden">
                            {worker.photo_url ? (
                              <img src={worker.photo_url} alt={worker.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm font-black text-violet-600 dark:text-violet-400">
                                {getInitials(worker.name)}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 dark:text-white text-sm">{worker.name}</p>
                            <p className="text-[11px] text-slate-400 font-bold mt-0.5">الأساسي: {formatCurrency(worker.basicSalary)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center font-bold text-slate-600 dark:text-slate-300">
                        {worker.daily_rate} دج
                      </td>
                      <td className="text-center">
                        <span className="font-black text-emerald-600">{worker.presentDays}</span>
                        <span className="text-xs text-slate-400 mx-1">/</span>
                        <span className="text-xs font-bold text-slate-400">{worker.totalDays}</span>
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-2 text-xs font-bold">
                          {worker.absentDays > 0 ? (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 rounded-md">
                              {worker.absentDays} غ
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">-</span>
                          )}
                          {worker.lateDays > 0 && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-md">
                              {worker.lateDays} ت
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        {worker.totalDiscount > 0 ? (
                          <span className="font-black text-rose-500">− {formatCurrency(worker.totalDiscount)}</span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                      <td className="text-center">
                        <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-black rounded-lg">
                          {formatCurrency(worker.netSalary)}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
          <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center text-sm">
            <span className="font-bold text-slate-500">إجمالي الصافي للمستحقات</span>
            <span className="text-xl font-black text-emerald-600 tracking-tight">{formatCurrency(totalNetSalaries)}</span>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
