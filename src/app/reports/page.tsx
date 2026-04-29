'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Users, Package, ClipboardCheck,
  Calendar, Download, ChevronDown,
} from 'lucide-react';
import { useWorkers } from '@/lib/hooks/useWorkers';
import { useTasks } from '@/lib/hooks/useTasks';
import { useInventory } from '@/lib/hooks/useInventory';
import Badge from '@/components/ui/Badge';
import { formatNumber, calcAttendanceRate, getInitials } from '@/lib/utils';
import { MAIN_TYPE_LABELS } from '@/lib/types';
import * as XLSX from 'xlsx';

// ─── رسم بياني شريطي ───
function BarChart({
  data,
  color = '#7c3aed',
}: {
  data: { label: string; value: number; max?: number }[];
  color?: string;
}) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-3 h-40 pt-4">
      {data.map((item, i) => (
        <div key={item.label} className="flex-1 flex flex-col items-center gap-2">
          <span className="text-[10px] font-black text-slate-500">{item.value}</span>
          <div className="w-full relative flex flex-col justify-end" style={{ height: '100px' }}>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden" style={{ height: '100px' }}>
              <motion.div
                className="absolute bottom-0 right-0 left-0 rounded-xl"
                style={{ backgroundColor: color, opacity: 0.85 }}
                initial={{ height: 0 }}
                animate={{ height: `${(item.value / maxVal) * 100}%` }}
                transition={{ delay: i * 0.07, duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
          <span className="text-[10px] font-black text-slate-400 text-center leading-tight">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── مسار ناعم للمنحنى الخطي ───
function getSmoothPath(data: number[], min: number, max: number, height: number, width: number = 100): { line: string; area: string } {
  if (data.length === 0) return { line: '', area: '' };
  
  // هامش لكي لا تلامس القمة أو القاع تماماً
  const pad = (max - min) * 0.1 || max * 0.1 || 1;
  const pMin = Math.max(0, min - pad);
  const pMax = max + pad;
  const range = pMax - pMin;

  const pts = data.map((v, i) => ({
    x: i * (width / Math.max(1, data.length - 1)),
    y: 100 - ((v - pMin) / range) * height
  }));

  let path = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? 0 : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) * 0.18;
    const cp1y = p1.y + (p2.y - p0.y) * 0.18;
    const cp2x = p2.x - (p3.x - p1.x) * 0.18;
    const cp2y = p2.y - (p3.y - p1.y) * 0.18;
    path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }

  return { line: path, area: `${path} L ${width},100 L 0,100 Z` };
}

// ─── رسم خطي ───
function LineChart({ data, color = '#7c3aed' }: { data: number[]; color?: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data, 1);
  const pad = (max - min) * 0.1 || max * 0.1 || 1;
  const pMin = Math.max(0, min - pad);
  const pMax = max + pad;
  const range = pMax - pMin;
  
  const paths = getSmoothPath(data, min, max, 85);
  const w = 100 / Math.max(1, data.length - 1);

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-32 overflow-visible">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <stop offset="80%" stopColor={color} stopOpacity="0.05" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={paths.area} fill="url(#lineGrad)" />
      <path
        d={paths.line}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.map((v, i) => (
        <circle
          key={i}
          cx={i * w}
          cy={100 - ((v - pMin) / range) * 85}
          r="2.5"
          fill="white"
          stroke={color}
          strokeWidth="2"
          className="dark:fill-slate-900 transition-all hover:r-4"
        />
      ))}
    </svg>
  );
}

// ─── رسم دائري ───
function DonutChart({
  segments,
}: {
  segments: { value: number; color: string; label: string }[];
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = 40;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-36 h-36 -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="hsl(220 13% 91%)" strokeWidth="16" className="dark:stroke-slate-700" />
        {segments.map((seg, i) => {
          const arc = (seg.value / total) * circ;
          const el = (
            <circle
              key={i}
              cx="50" cy="50" r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="16"
              strokeDasharray={`${arc} ${circ}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          );
          offset += arc;
          return el;
        })}
      </svg>
      <div className="flex flex-wrap justify-center gap-3">
        {segments.map(seg => (
          <div key={seg.label} className="flex items-center gap-1.5 text-xs font-black">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-slate-600 dark:text-slate-300">{seg.label}</span>
            <span className="text-slate-400">({Math.round((seg.value / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type Period = 'week' | 'month' | 'quarter';

const PERIOD_LABELS: Record<Period, string> = {
  week: 'هذا الأسبوع',
  month: 'هذا الشهر',
  quarter: 'هذا الربع',
};

export default function ReportsPage() {
  const { workers, presentCount, absentCount, lateCount, loading: wLoad } = useWorkers();
  const { tasks, completedCount, loading: tLoad } = useTasks();
  const { items, totalItems, lowStockItems, loading: iLoad } = useInventory();
  const [period, setPeriod]   = useState<Period>('month');
  const [showPeriod, setShowPeriod] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);

  const loading = wLoad || tLoad || iLoad;

  const exportWorkersToExcel = () => {
    const data = workers.map(w => {
      const pDays = (w.attendance || []).filter(a => a.status === 'present').length;
      const advances = (w.advances || []).reduce((sum, a) => sum + Number(a.amount), 0);
      const discounts = (w.attendance || []).reduce((sum, a) => sum + Number(a.discount_amount || 0), 0);
      const gross = pDays * w.daily_rate;
      return {
        'الاسم': w.name,
        'أيام الحضور': pDays,
        'الأجر اليومي (دج)': w.daily_rate,
        'إجمالي المستحقات': gross,
        'إجمالي السلفيات': advances,
        'الخصومات': discounts,
        'الصافي للدفع': gross - advances - discounts
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الرواتب");
    XLSX.writeFile(wb, `تقرير_الرواتب_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportInventoryToExcel = () => {
    const data = items.map(i => ({
      'الصنف': i.sub_type,
      'القسم': MAIN_TYPE_LABELS[i.main_type],
      'الرصيد المتاح': i.stock?.quantity ?? 0,
      'الوحدة': i.unit,
      'حد التنبيه': i.min_stock_level ?? 50
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المخزون");
    XLSX.writeFile(wb, `جرد_المخزن_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const presentRate = calcAttendanceRate(presentCount, workers.length);

  // حساب أفضل العمال بناءً على بيانات حقيقية
  const topWorkersData = useMemo(() => {
    return workers
      .map(w => {
        const attArr = Array.isArray((w as any).attendance) ? (w as any).attendance : [];
        // تصفية لهذا الشهر
        const thisMonth = new Date().toISOString().substring(0, 7);
        const monthlyAtts = attArr.filter((a: any) => a.date.startsWith(thisMonth));
        const pDays = monthlyAtts.filter((a: any) => a.status === 'present').length;
        const rate = monthlyAtts.length > 0 ? Math.round((pDays / monthlyAtts.length) * 100) : 0;
        return { name: w.name, rate, days: pDays, photo_url: w.photo_url };
      })
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5);
  }, [workers]);

  // حساب الحضور اليومي لآخر 5 أيام
  const attendanceWeekData = useMemo(() => {
    const last5Days = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last5Days.push(d.toISOString().split('T')[0]);
    }

    return last5Days.map(dateStr => {
      let count = 0;
      workers.forEach(w => {
        const attArr = Array.isArray((w as any).attendance) ? (w as any).attendance : [];
        if (attArr.some((a: any) => a.date === dateStr && a.status === 'present')) {
          count++;
        }
      });
      const dayName = new Date(dateStr).toLocaleDateString('ar-DZ', { weekday: 'short' });
      return { label: dayName, value: count };
    });
  }, [workers]);

  const summaryCards = [
    { label: 'نسبة الحضور',       value: `${presentRate}%`, icon: Users,         color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'مهام منجزة',        value: `${completedCount}/${tasks.length}`,    icon: ClipboardCheck, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
    { label: 'إجمالي المخزون',    value: formatNumber(totalItems),               icon: Package,        color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-900/20'   },
    { label: 'أصناف منخفضة',     value: String(lowStockItems.length),            icon: TrendingUp,     color: 'text-rose-600',   bg: 'bg-rose-50 dark:bg-rose-900/20'   },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ─── شريط الأدوات ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">التقارير التحليلية</h1>
          <p className="text-sm text-slate-400 font-medium mt-1">بيانات شاملة لأداء المنشأة بناءً على السجلات الفعلية</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowPeriod(p => !p)}
              className="flex items-center gap-2 px-4 py-2.5 glass-card rounded-2xl text-sm font-black text-slate-600 dark:text-slate-300 border border-white/40 dark:border-slate-700"
            >
              <Calendar size={15} />
              {PERIOD_LABELS[period]}
              <ChevronDown size={14} className={`transition-transform ${showPeriod ? 'rotate-180' : ''}`} />
            </button>
            {showPeriod && (
              <div className="absolute top-full mt-2 left-0 glass-card rounded-2xl border border-white/30 dark:border-slate-700 shadow-xl z-20 min-w-full overflow-hidden">
                {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => { setPeriod(k); setShowPeriod(false); }}
                    className={`flex w-full items-center px-4 py-3 text-sm font-black hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors ${
                      period === k ? 'text-violet-600' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowExportOptions(p => !p)}
              className="flex items-center gap-2 px-4 py-2.5 btn-secondary rounded-2xl text-sm font-black"
            >
              <Download size={15} />
              تصدير البيانات
            </button>
            {showExportOptions && (
              <div className="absolute top-full mt-2 left-0 glass-card rounded-2xl border border-white/30 dark:border-slate-700 shadow-xl z-20 min-w-[200px] overflow-hidden flex flex-col">
                <button
                  onClick={() => { exportWorkersToExcel(); setShowExportOptions(false); }}
                  className="flex text-right w-full items-center px-4 py-3 text-sm font-black hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors text-slate-700 dark:text-slate-200"
                >
                  📄 تصدير رواتب العمال (Excel)
                </button>
                <button
                  onClick={() => { exportInventoryToExcel(); setShowExportOptions(false); }}
                  className="flex text-right w-full items-center px-4 py-3 text-sm font-black hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-slate-700 dark:text-slate-200 border-t border-slate-100 dark:border-slate-800"
                >
                  📦 تصدير جرد المخزن (Excel)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── بطاقات الملخص ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass-card rounded-3xl p-5 group hover:-translate-y-1 transition-all duration-300"
          >
            <div className={`w-11 h-11 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center mb-4 shadow-inner`}>
              <card.icon size={22} />
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
            <p className={`text-2xl font-black mt-1 ${card.color}`}>{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ─── الصف الثاني: رسوم بيانية ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* حضور الأسبوع */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-4xl p-7"
        >
          <h2 className="text-base font-black text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
              <Users size={14} />
            </div>
            الحضور اليومي
          </h2>
          <p className="text-xs text-slate-400 font-medium mb-5">آخر 5 أيام مسجلة فعلياً</p>
          <BarChart data={attendanceWeekData} color="#10b981" />
        </motion.section>

        {/* توزيع الحضور — دونات */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card rounded-4xl p-7 flex flex-col items-center"
        >
          <h2 className="text-base font-black text-slate-900 dark:text-white mb-1 self-start flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 flex items-center justify-center">
              <Users size={14} />
            </div>
            توزيع حضور العمال
          </h2>
          <p className="text-xs text-slate-400 font-medium mb-5 self-start">إحصائيات اليوم الحالي</p>
          <DonutChart segments={[
            { value: presentCount || 0, color: '#10b981', label: 'حاضر' },
            { value: lateCount || 0,   color: '#f59e0b', label: 'متأخر' },
            { value: absentCount || 0, color: '#f43f5e', label: 'غائب' },
          ]} />
        </motion.section>

        {/* توزيع المهام */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-4xl p-7 flex flex-col items-center"
        >
          <h2 className="text-base font-black text-slate-900 dark:text-white mb-1 self-start flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
              <ClipboardCheck size={14} />
            </div>
            تحليل المهام
          </h2>
          <p className="text-xs text-slate-400 font-medium mb-5 self-start">حالة جميع المهام المجدولة</p>
          <DonutChart segments={[
            { value: completedCount || 0, color: '#7c3aed', label: 'منجز' },
            { value: tasks.filter(t => !t.is_completed && t.priority !== 'high').length || 0, color: '#6366f1', label: 'نشط' },
            { value: tasks.filter(t => !t.is_completed && t.priority === 'high').length || 0, color: '#f43f5e', label: 'عاجل' },
          ]} />
        </motion.section>
      </div>

      {/* ─── الصف الرابع: جدول أفضل العمال ─── */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-4xl overflow-hidden shadow-xl"
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
              <Users size={14} />
            </div>
            أفضل العمال حضوراً
          </h2>
          <Badge variant="present" dot size="sm">إحصائيات الشهر</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>اسم العامل</th>
                <th className="text-center">أيام الحضور</th>
                <th className="text-center">نسبة الحضور</th>
                <th className="text-center">التقييم</th>
              </tr>
            </thead>
            <tbody>
              {topWorkersData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400 font-bold">لا توجد بيانات حضور مسجلة لهذا الشهر بعد</td>
                </tr>
              ) : topWorkersData.map((w, i) => (
                <tr key={w.name}>
                  <td>
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                      i === 0 ? 'bg-amber-100 text-amber-600' :
                      i === 1 ? 'bg-slate-100 text-slate-600' :
                      i === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-slate-50 dark:bg-slate-800 text-slate-400'
                    }`}>{i + 1}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 flex items-center justify-center shrink-0 border border-white dark:border-slate-800 shadow-sm overflow-hidden">
                        {w.photo_url ? (
                          <img src={w.photo_url} alt={w.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-black text-violet-600 dark:text-violet-400">
                            {getInitials(w.name)}
                          </span>
                        )}
                      </div>
                      <span className="font-black text-slate-800 dark:text-white text-sm">{w.name}</span>
                    </div>
                  </td>
                  <td className="text-center font-black text-slate-700 dark:text-slate-200">{w.days}</td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-l from-violet-600 to-indigo-400"
                          style={{ width: `${w.rate}%` }}
                        />
                      </div>
                      <span className="text-xs font-black text-slate-600 dark:text-slate-300 w-8">{w.rate}%</span>
                    </div>
                  </td>
                  <td className="text-center">
                    <Badge variant={w.rate >= 95 ? 'present' : w.rate >= 90 ? 'normal' : 'late'} size="sm">
                      {w.rate >= 95 ? 'ممتاز' : w.rate >= 90 ? 'جيد جداً' : 'جيد'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>

    </div>
  );
}
