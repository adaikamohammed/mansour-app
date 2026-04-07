'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronLeft, CheckCircle2, XCircle, Clock,
  Save, Calendar, ClipboardList, LayoutGrid
} from 'lucide-react';
import { useWorkers } from '@/lib/hooks/useWorkers';
import { useToast } from '@/components/ui/Toast';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Select, Textarea } from '@/components/ui/Input';
import { formatDate, today, getInitials, formatCurrency, calcDiscount } from '@/lib/utils';
import type { AttendanceStatus } from '@/lib/types';
import { STATUS_LABELS } from '@/lib/types';

interface DayRecord {
  workerId: string;
  status: AttendanceStatus;
  reason: string;
  note:   string;
}

const STATUS_CYCLE: AttendanceStatus[] = ['present', 'absent', 'late'];

const statusConfig: Record<AttendanceStatus, { icon: React.ReactNode; bg: string; text: string; border: string; dotColor: string }> = {
  present: {
    icon: <CheckCircle2 size={20} />,
    bg:   'bg-emerald-500 text-white',
    text: 'text-emerald-600',
    border: 'border-emerald-300 dark:border-emerald-700',
    dotColor: 'bg-emerald-500',
  },
  absent:  {
    icon: <XCircle size={20} />,
    bg:   'bg-rose-500 text-white',
    text: 'text-rose-600',
    border: 'border-rose-300 dark:border-rose-700',
    dotColor: 'bg-rose-500',
  },
  late:    {
    icon: <Clock size={20} />,
    bg:   'bg-amber-500 text-white',
    text: 'text-amber-600',
    border: 'border-amber-300 dark:border-amber-700',
    dotColor: 'bg-amber-500',
  },
};

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

// دالة لتوليد أيام الشهر بالكامل بناءً على (YYYY-MM)
function generateMonthDates(yearMonth: string) {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const dates = [];
  const daysInMonth = new Date(year, month, 0).getDate(); 
  
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month - 1, i, 12, 0, 0); // 12 PM لتجنب فرق التوقيت
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export default function AttendancePage() {
  const { workers, loading } = useWorkers();
  const { success, error: toastError } = useToast();
  
  // Tabs State
  const [activeTab, setActiveTab] = useState<'daily' | 'history'>('daily');

  // Daily Mode State
  const [date, setDate] = useState(today());
  const [records, setRecords] = useState<Record<string, DayRecord>>({});
  const [saving, setSaving] = useState(false);
  const [expandedWorker, setExpandedWorker] = useState<string | null>(null);

  // History Mode State
  const [historyMonth, setHistoryMonth] = useState(today().substring(0, 7));

  // تهيئة تسجيل اليوم
  useEffect(() => {
    if (!workers.length) return;
    const init: Record<string, DayRecord> = {};
    workers.forEach(w => {
      init[w.id] = {
        workerId: w.id,
        status: w.today_status ?? 'present',
        reason: '',
        note: '',
      };
    });
    setRecords(init);
  }, [workers]);

  const setStatus = (workerId: string, status: AttendanceStatus) => {
    setRecords(prev => ({
      ...prev,
      [workerId]: { ...prev[workerId], status, workerId },
    }));
  };

  const cycleStatus = (workerId: string) => {
    const cur = records[workerId]?.status ?? 'present';
    const idx = STATUS_CYCLE.indexOf(cur);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    setStatus(workerId, next);
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      const allRecords: { date: string; status: AttendanceStatus; note?: string; workerId: string }[] = [];
      Object.values(records).forEach(rec => {
        allRecords.push({ workerId: rec.workerId, date: date, status: rec.status, note: rec.note });
      });
      
      // التجميع والمزامنة مع Supabase (إذا كان هناك العديد، يتم استدعاؤهم بشكل متوازٍ لتجنب بطء الحلقة)
      await Promise.all(
        workers.map(w => {
          const wRecord = allRecords.find(r => r.workerId === w.id);
          if (wRecord) {
             return updateAttendance(w.id, [{ date: wRecord.date, status: wRecord.status, note: wRecord.note }]);
          }
          return Promise.resolve();
        })
      );

      success(`✅ تم دمج وحفظ حضور ${allRecords.length} عامل ليوم ${formatDate(date, { weekday: 'long', month: 'long', day: 'numeric' })}`);
    } catch (e) {
      toastError('فشل حفظ الحضور الشامل');
    } finally {
      setSaving(false);
    }
  };

  const markAll = (status: AttendanceStatus) => {
    const updated: Record<string, DayRecord> = {};
    workers.forEach(w => {
      updated[w.id] = { ...records[w.id], workerId: w.id, status };
    });
    setRecords(updated);
  };

  // بيانات السجل الحقيقية من قاعدة البيانات
  const historyData = useMemo(() => {
    const dates = generateMonthDates(historyMonth);
    
    // بناء مصفوفة: workerId => { date: { status, note } | null }
    const matrix: Record<string, Record<string, { status: AttendanceStatus, note?: string } | null>> = {};
    
    workers.forEach(w => {
      matrix[w.id] = {};
      const attArr = Array.isArray((w as any).attendance) ? (w as any).attendance : [];
      dates.forEach(d => {
        const found = attArr.find((a: any) => a.date === d);
        matrix[w.id][d] = found ? { status: found.status, note: found.note } : null;
      });
    });
    return { dates, matrix };
  }, [workers, historyMonth]);

  const { updateAttendance } = useWorkers();

  // دالة تحويل وضبط الحضور بضغطة زر
  const toggleHistoryStatus = async (worker: any, dateStr: string) => {
    const attArr = Array.isArray(worker.attendance) ? [...worker.attendance] : [];
    const idx = attArr.findIndex((a: any) => a.date === dateStr);
    let currentStatus = idx >= 0 ? attArr[idx].status : null;
    
    let nextStatus: AttendanceStatus = 'present';
    if (currentStatus === 'present') nextStatus = 'absent';
    else if (currentStatus === 'absent') nextStatus = 'late';
    else if (currentStatus === 'late') nextStatus = 'present';
    
    // إرسال التحديث لـ Supabase (اليوم المحدد فقط بدلاً من المصفوفة كاملة)
    await updateAttendance(worker.id, [{ date: dateStr, status: nextStatus, note: idx >= 0 ? attArr[idx].note : '' }]);
  };

  const presentCount = Object.values(records).filter(r => r.status === 'present').length;
  const absentCount  = Object.values(records).filter(r => r.status === 'absent').length;
  const lateCount    = Object.values(records).filter(r => r.status === 'late').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* ─── أزرار التحكم بالتبويبات ─── */}
      <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-2xl w-full max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-black rounded-xl transition-all ${activeTab === 'daily' ? 'bg-white dark:bg-slate-800 shadow-sm text-violet-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <ClipboardList size={18} />
          تسجيل اليوم
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-black rounded-xl transition-all ${activeTab === 'history' ? 'bg-white dark:bg-slate-800 shadow-sm text-violet-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <LayoutGrid size={18} />
          السجل التاريخي
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'daily' ? (
          <motion.div key="daily" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6 max-w-4xl mx-auto">
            
            {/* ─── منتقي التاريخ ─── */}
            <div className="glass-card rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDate(addDays(date, -1))}
                  className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-violet-100 hover:text-violet-600 dark:hover:bg-violet-900/30 transition-all"
                >
                  <ChevronRight size={20} />
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 flex items-center justify-center">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h2 className="font-black text-slate-900 dark:text-white text-lg lg:text-xl">
                      {formatDate(date, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h2>
                    {date === today() && (
                      <span className="text-[11px] font-black text-violet-600">اليوم</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setDate(addDays(date, 1))}
                  disabled={date >= today()}
                  className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-violet-100 hover:text-violet-600 dark:hover:bg-violet-900/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={20} />
                </button>
              </div>

              <input
                type="date"
                value={date}
                max={today()}
                title="اختر التاريخ يدويًا"
                aria-label="منتقي التاريخ"
                onChange={e => setDate(e.target.value)}
                className="form-input w-auto text-sm"
              />
            </div>

            {/* ─── شريط الإحصاء السريع ─── */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'حاضر',  count: presentCount, variant: 'present' as const, color: 'text-emerald-600' },
                { label: 'غائب',  count: absentCount,  variant: 'absent'  as const, color: 'text-rose-600'    },
                { label: 'متأخر', count: lateCount,    variant: 'late'    as const, color: 'text-amber-600'   },
              ].map(s => (
                <div key={s.label} className="glass-card rounded-2xl p-4 text-center">
                  <p className={`text-3xl font-black ${s.color}`}>{s.count}</p>
                  <Badge variant={s.variant} dot size="sm" className="mt-2">{s.label}</Badge>
                </div>
              ))}
            </div>

            {/* ─── أزرار وضع الكل ─── */}
            <div className="flex flex-wrap gap-2 px-2">
              <span className="text-xs font-black text-slate-400 self-center ml-2">تحديد الكل:</span>
              {(['present', 'absent', 'late'] as AttendanceStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => markAll(s)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    s === 'present' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    s === 'absent'  ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400' :
                                      'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}
                >
                  {statusConfig[s].icon}
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            {/* ─── قائمة العمال ─── */}
            {loading ? (
              <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-20 skeleton rounded-3xl" />)}</div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {workers.map((worker, idx) => {
                    const rec = records[worker.id];
                    const status: AttendanceStatus = rec?.status ?? 'present';
                    const cfg = statusConfig[status];
                    const isExpanded = expandedWorker === worker.id;
                    const discount = status === 'absent' ? worker.daily_rate : status === 'late' ? worker.daily_rate * 0.25 : 0;

                    return (
                      <motion.div
                        key={worker.id}
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className={`glass-card rounded-3xl border-2 transition-all duration-300 overflow-hidden ${cfg.border}`}
                      >
                        <div className="flex items-center gap-4 p-4">
                          {/* زر الحالة */}
                          <button
                            onClick={() => cycleStatus(worker.id)}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${cfg.bg}`}
                            title={`تغيير حالة حضور ${worker.name} (حاضر/غائب/متأخر)`}
                            aria-label={`تغيير حالة حضور ${worker.name}`}
                          >
                            {cfg.icon}
                          </button>

                          {/* الأفاتار والاسم */}
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 flex items-center justify-center shrink-0 overflow-hidden">
                            {worker.photo_url ? (
                              <img src={worker.photo_url} alt={worker.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-black text-violet-600 dark:text-violet-400">{getInitials(worker.name)}</span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-black text-slate-800 dark:text-white text-sm truncate">{worker.name}</p>
                            <p className="text-[11px] text-slate-400 font-bold">{formatCurrency(worker.daily_rate)} / يوم</p>
                          </div>

                          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4 shrink-0">
                            {status === 'absent' && discount > 0 && (
                              <span className="text-[11px] font-black text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded-md">
                                -{formatCurrency(discount)}
                              </span>
                            )}
                            {status === 'late' && discount > 0 && (
                              <span className="text-[11px] font-black text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-md">
                                -{formatCurrency(discount)}
                              </span>
                            )}
                            
                            <Badge variant={status} dot size="sm">{STATUS_LABELS[status]}</Badge>

                            {status !== 'present' && (
                              <button
                                onClick={() => setExpandedWorker(isExpanded ? null : worker.id)}
                                className="text-[10px] font-black text-violet-600 hover:underline underline-offset-4"
                              >
                                {isExpanded ? 'إخفاء' : 'إضافة ملاحظة'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* حقل الملاحظات */}
                        <AnimatePresence>
                          {isExpanded && status !== 'present' && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-slate-100 dark:border-slate-800 px-4 pb-4 pt-4 bg-slate-50/50 dark:bg-slate-900/30"
                            >
                              <Textarea
                                label="ملاحظات توضيحية (اختياري)"
                                placeholder="اكتب سبب الغياب أو التأخر هنا..."
                                value={rec?.note ?? ''}
                                rows={2}
                                onChange={e => setRecords(prev => ({
                                  ...prev,
                                  [worker.id]: { ...prev[worker.id], note: e.target.value },
                                }))}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {workers.length > 0 && (
              <div className="sticky bottom-6 flex justify-center pt-4">
                <Button onClick={saveAttendance} loading={saving} icon={<Save size={18} />} size="lg" className="shadow-2xl shadow-violet-500/30 px-12">
                  حفظ حضور اليوم ({workers.length} عامل)
                </Button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="history" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
            
            {/* ─── فلتر السجل التاريخي ─── */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Calendar size={18} className="text-violet-500" />
                سجل الحضور الشهري
              </h3>
              <input 
                type="month" 
                value={historyMonth} 
                title="اختر الشهر لعرض السجل"
                aria-label="منتقي الشهر للسجل"
                onChange={(e) => setHistoryMonth(e.target.value || today().substring(0, 7))} 
                className="form-input w-48 bg-white cursor-pointer shadow-sm text-sm font-bold"
              />
            </div>

            {/* ─── شبكة الحضور ─── */}
            <div className="glass-card rounded-4xl overflow-hidden shadow-xl overflow-x-auto pb-4" dir="rtl">
              {loading ? (
                <div className="p-8 text-center text-slate-400">تحميل السجل...</div>
              ) : workers.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-bold">لا يوجد عمال لعرض السجل</div>
              ) : (
                <div className="min-w-max p-4 sm:p-6 w-full overflow-x-auto pb-8">
                  {/* الرأس: التواريخ */}
                  <div className="flex mb-3 pr-[230px]">
                    <div className="flex gap-1">
                      {historyData.dates.map((d) => {
                        const day = d.split('-')[2];
                        const theDate = new Date(d);
                        return (
                          <div key={d} className="w-9 shrink-0 flex flex-col items-center justify-end leading-tight">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{theDate.toLocaleString('ar-DZ', {month: 'short'})}</span>
                            <span className="text-sm font-black text-slate-700 dark:text-slate-300">{day}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* الصفوف: العمال */}
                  <div className="space-y-2">
                    {workers.map((worker) => (
                      <div key={worker.id} className="flex items-center group relative w-max">
                        {/* اسم العامل */}
                        <div className="w-[220px] shrink-0 sticky right-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md px-3 py-1.5 flex items-center gap-3 z-20 border-l border-slate-100 dark:border-slate-800 rounded-l-2xl shadow-sm h-12 ml-2">
                          <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                            {worker.photo_url ? (
                              <img src={worker.photo_url} alt={worker.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-black text-xs">{getInitials(worker.name)}</span>
                            )}
                          </div>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{worker.name}</span>
                        </div>

                        {/* نقاط الحضور */}
                        <div className="flex gap-1">
                          {historyData.dates.map(date => {
                            const rec = historyData.matrix[worker.id]?.[date];
                            const status = rec?.status;
                            
                            // تحقق من تاريخ الانضمام
                            const isJoined = new Date(date) >= new Date(worker.join_date);
                            
                            const conf = status ? statusConfig[status] : null;
                            const bgStyle = conf ? conf.bg.replace('text-white', '') : 'bg-slate-100 dark:bg-slate-800/50';
                            
                            if (!isJoined) {
                              return (
                                <div key={date} className="w-9 h-9 rounded-xl flex items-center justify-center opacity-20 cursor-not-allowed bg-slate-50 dark:bg-slate-900/20" title="لم يكن منضماً">
                                  <div className="w-1 h-3 bg-slate-300 dark:bg-slate-700 rotate-45" />
                                </div>
                              );
                            }

                            return (
                              <button
                                key={date}
                                onClick={() => toggleHistoryStatus(worker, date)}
                                className={`w-9 h-9 rounded-xl flex items-center justify-center relative group/dot transition-all hover:scale-110 hover:shadow-lg focus:outline-none ${bgStyle}`}
                              >
                                {!status && <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 opacity-50" />}
                                
                                {/* نافذة تلميح للملاحظات (Tooltip) */}
                                <div className="absolute bottom-full mb-3 bg-slate-800 text-white text-xs px-3 py-2 rounded-xl shadow-xl w-max right-1/2 translate-x-1/2 opacity-0 group-hover/dot:opacity-100 pointer-events-none transition-all scale-95 group-hover/dot:scale-100 z-[100]">
                                  {status && <div className="font-black border-b border-slate-600/50 pb-1.5 mb-1.5">{STATUS_LABELS[status]}</div>}
                                  <div className="text-slate-300 font-bold leading-tight">{!status ? 'تسجيل/تعديل الحضور' : (rec?.note || 'انقر لتعديل الحالة')}</div>
                                  <div className="absolute top-full right-1/2 translate-x-1/2 border-[5px] border-transparent border-t-slate-800" />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* المفتاح / الدليل */}
                  <div className="mt-8 flex gap-6 items-center justify-center pt-6 border-t border-slate-100 dark:border-slate-800 dir-rtl">
                    <div className="flex items-center gap-2">
                       <div className="w-3.5 h-3.5 rounded-md bg-emerald-500" />
                       <span className="text-sm font-black text-slate-500">حاضر</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-3.5 h-3.5 rounded-md bg-amber-500" />
                       <span className="text-sm font-black text-slate-500">متأخر</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-3.5 h-3.5 rounded-md bg-rose-500" />
                       <span className="text-sm font-black text-slate-500">غائب</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-3.5 h-3.5 rounded-md bg-slate-200 dark:bg-slate-800" />
                       <span className="text-sm font-black text-slate-500">لم يسجل</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
