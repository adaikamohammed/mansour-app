'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowRight, Phone, MapPin, Calendar, Wallet,
  CheckCircle2, XCircle, Clock, TrendingUp, Edit2,
} from 'lucide-react';
import { useWorkers } from '@/lib/hooks/useWorkers';
import Badge from '@/components/ui/Badge';
import { formatDate, formatCurrency, calcAttendanceRate, getInitials } from '@/lib/utils';
import type { AttendanceStatus } from '@/lib/types';
import { STATUS_LABELS } from '@/lib/types';

const statusConfig: Record<AttendanceStatus, { icon: React.ReactNode; label: string; variant: 'present' | 'absent' | 'late' }> = {
  present: { icon: <CheckCircle2 size={14} />, label: 'حاضر',  variant: 'present' },
  absent:  { icon: <XCircle size={14} />,      label: 'غائب',  variant: 'absent'  },
  late:    { icon: <Clock size={14} />,         label: 'متأخر', variant: 'late'    },
};

export default function WorkerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { workers, loading } = useWorkers();
  const worker = workers.find(w => w.id === params.id);

  const attendanceArr = useMemo(() => {
    if (!worker) return [];
    return Array.isArray((worker as any).attendance) ? (worker as any).attendance : [];
  }, [worker]);

  const stats = useMemo(() => {
    if (!worker) return { present: 0, absent: 0, late: 0, rate: 0, expected: 0, net: 0, deductions: 0 };
    
    // حساب الأيام منذ الانضمام
    const start = new Date(worker.join_date);
    start.setHours(0,0,0,0);
    const end = new Date();
    end.setHours(0,0,0,0);
    const diff = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
    const expected = Math.max(0, diff);

    const present = attendanceArr.filter((a: any) => a.status === 'present').length;
    const absent  = attendanceArr.filter((a: any) => a.status === 'absent').length;
    const late    = attendanceArr.filter((a: any) => a.status === 'late').length;
    
    // الأيام غير المسجلة تعتبر غياب
    const unrecorded = Math.max(0, expected - (present + absent + late));
    const totalAbsent = absent + unrecorded;
    
    const rate = expected > 0 ? Math.round((present / expected) * 100) : 0;
    
    const basic = expected * worker.daily_rate;
    const deductions = (totalAbsent * worker.daily_rate) + (late * worker.daily_rate * 0.25);
    const net = Math.max(0, basic - deductions);

    return { present, absent: totalAbsent, late, rate, expected, net, deductions };
  }, [worker, attendanceArr]);

  if (loading) return <div className="flex justify-center p-20"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  if (!worker) {
    return (
      <div className="empty-state">
        <p className="text-xl font-black text-slate-700 dark:text-white">لم يتم العثور على العامل</p>
        <button onClick={() => router.back()} className="btn btn-primary mt-4 px-6 py-2.5 rounded-2xl text-sm">
          <ArrowRight size={16} /> رجوع
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">

      {/* ── زر الرجوع ── */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-black text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        <ArrowRight size={18} />
        العودة للعمال
      </button>

      {/* ── بطاقة المعلومات الرئيسية ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-4xl overflow-hidden shadow-xl"
      >
        <div className="h-32 bg-gradient-to-l from-blue-600 to-sky-500 relative">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        </div>

        <div className="px-8 pb-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-6 -mt-12 mb-6">
            <div className="w-24 h-24 rounded-3xl border-4 border-white dark:border-slate-900 shadow-xl flex items-center justify-center bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-900/30 dark:to-sky-900/30 shrink-0 overflow-hidden relative group">
              {worker.photo_url ? (
                <img src={worker.photo_url} alt={worker.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              ) : (
                <span className="text-4xl font-black text-blue-600 dark:text-blue-400">
                  {getInitials(worker.name)}
                </span>
              )}
            </div>
            <div className="pb-1">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">{worker.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {worker.today_status && (
                  <Badge variant={statusConfig[worker.today_status].variant} dot>
                    {STATUS_LABELS[worker.today_status]}
                  </Badge>
                )}
                <span className="text-sm font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg">
                  {formatCurrency(worker.daily_rate)} / يوم
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: <Phone size={16} />,    label: 'رقم الهاتف',    value: worker.phone ?? '—', ltr: true  },
              { icon: <MapPin size={16} />,   label: 'العنوان',        value: worker.address ?? '—'          },
              { icon: <Calendar size={16} />, label: 'تاريخ الانضمام', value: formatDate(worker.join_date, { year: 'numeric', month: 'long', day: 'numeric' }) },
            ].map(item => (
              <div key={item.label} className="p-4 bg-slate-50/80 dark:bg-slate-900/40 rounded-2xl border border-white/50 dark:border-slate-800/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-blue-500">{item.icon}</span>
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                </div>
                <p className="font-black text-slate-800 dark:text-white text-sm" dir={item.ltr ? 'ltr' : undefined}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── إحصاء الأداء ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'أيام الحضور', value: stats.present, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: <CheckCircle2 size={20} /> },
          { label: 'أيام الغياب',  value: stats.absent,  color: 'text-rose-600',    bg: 'bg-rose-50 dark:bg-rose-900/20',     icon: <XCircle size={20} />      },
          { label: 'تأخر',          value: stats.late,    color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/20',   icon: <Clock size={20} />        },
          { label: 'نسبة الحضور', value: `${stats.rate}%`, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: <TrendingUp size={20} /> },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`glass-card rounded-3xl p-5 ${stat.bg} border-none shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className={`${stat.color} mb-3`}>{stat.icon}</div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <p className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── ملخص الراتب ── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-4xl p-8 shadow-lg"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
            <Wallet size={18} />
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">ملخص الاستحقاقات</h2>
        </div>

        <div className="space-y-3">
          {[
            { label: 'الأجر اليومي', value: formatCurrency(worker.daily_rate), color: 'text-slate-700 dark:text-slate-200' },
            { label: `إجمالي الأيام (منذ الانضمام: ${stats.expected})`, value: formatCurrency(stats.expected * worker.daily_rate), color: 'text-slate-700 dark:text-slate-200' },
            { label: `خصم الغياب (${stats.absent} يوم)`, value: `− ${formatCurrency(stats.absent * worker.daily_rate)}`, color: 'text-rose-500' },
            { label: `خصم التأخر (${stats.late} يوم = ربع يوم خصم)`, value: `− ${formatCurrency(stats.late * worker.daily_rate * 0.25)}`, color: 'text-rose-500' },
          ].map(row => (
            <div key={row.label} className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{row.label}</span>
              <span className={`text-sm font-black ${row.color}`}>{row.value}</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-4 mt-2 bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-2xl">
            <span className="text-base font-black text-slate-700 dark:text-slate-200">الصافي المستحق حتى الآن</span>
            <span className="text-2xl font-black text-emerald-600">{formatCurrency(stats.net)}</span>
          </div>
        </div>
      </motion.section>

      {/* ── سجل الحضور الحقيقي ── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-4xl overflow-hidden shadow-xl"
      >
        <div className="flex items-center gap-3 px-8 py-6 border-b border-slate-100 dark:border-slate-800">
          <div className="w-9 h-9 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
            <Calendar size={18} />
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">سجل الحضور الكامل</h2>
          <span className="mr-auto text-xs font-black text-slate-400">{attendanceArr.length} سجل مسجل</span>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>التاريخ</th>
                <th className="text-center">الحالة</th>
                <th className="text-center">الخصم المحتسب</th>
              </tr>
            </thead>
            <tbody>
              {attendanceArr.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-10 text-slate-400 font-bold">لا يوجد سجلات مسجلة</td></tr>
              ) : attendanceArr.sort((a: any, b: any) => b.date.localeCompare(a.date)).map((rec: any, i: number) => {
                const cfg = statusConfig[rec.status as AttendanceStatus];
                const disc = rec.status === 'absent' ? worker.daily_rate : rec.status === 'late' ? worker.daily_rate * 0.25 : 0;
                return (
                  <tr key={i}>
                    <td className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                      {formatDate(rec.date, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="text-center">
                      <Badge variant={cfg.variant} dot size="sm">{cfg.label}</Badge>
                    </td>
                    <td className="text-center text-sm font-black">
                      {disc > 0 ? (
                        <span className="text-rose-500">− {disc} دج</span>
                      ) : (
                        <span className="text-emerald-500">✓ لا يوجد خصم</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.section>
    </div>
  );
}
