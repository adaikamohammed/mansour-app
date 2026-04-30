'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Package, ClipboardCheck, AlertTriangle, CheckCircle2, Clock, UserX, TrendingUp } from 'lucide-react';
import { useWorkers } from '@/lib/hooks/useWorkers';
import { useTasks } from '@/lib/hooks/useTasks';
import { useInventory } from '@/lib/hooks/useInventory';
import Badge from '@/components/ui/Badge';
import { formatDate, formatNumber, calcAttendanceRate, today } from '@/lib/utils';
import { PRIORITY_LABELS, type TaskPriority } from '@/lib/types';
import Link from 'next/link';

// ── رسم دائري بسيط لنسبة الحضور ──
function AttendanceRing({ present, absent, late }: { present: number; absent: number; late: number }) {
  const total = present + absent + late || 1;
  const rate = Math.round((present / total) * 100);

  const r = 54;
  const circ = 2 * Math.PI * r;
  const presentArc = (present / total) * circ;
  const lateArc = (late / total) * circ;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(220 13% 91%)" strokeWidth="10" className="dark:stroke-slate-700" />
          {/* Absent */}
          <circle cx="60" cy="60" r={r} fill="none" stroke="#f43f5e" strokeWidth="10"
            strokeDasharray={`${(absent / total) * circ} ${circ}`}
            strokeDashoffset={0} strokeLinecap="round" />
          {/* Late */}
          <circle cx="60" cy="60" r={r} fill="none" stroke="#f59e0b" strokeWidth="10"
            strokeDasharray={`${lateArc} ${circ}`}
            strokeDashoffset={-((absent / total) * circ)} strokeLinecap="round" />
          {/* Present */}
          <circle cx="60" cy="60" r={r} fill="none" stroke="#10b981" strokeWidth="10"
            strokeDasharray={`${presentArc} ${circ}`}
            strokeDashoffset={-(((absent + late) / total) * circ)} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
          <span className="text-3xl font-black text-slate-900 dark:text-white">{rate}%</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">حضور</span>
        </div>
      </div>
      <div className="flex gap-4 text-xs font-black">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-slate-600 dark:text-slate-300">حاضر {present}</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"  /><span className="text-slate-600 dark:text-slate-300">متأخر {late}</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"   /><span className="text-slate-600 dark:text-slate-300">غائب {absent}</span></div>
      </div>
    </div>
  );
}

// ── رسم بياني شريطي لمهام الأسبوع ──
function WeeklyBar({ tasks }: { tasks: any[] }) {
  const bars = useMemo(() => {
    const last5Days = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last5Days.push(d.toISOString().split('T')[0]);
    }

    return last5Days.map(dateStr => {
      const dayTasks = tasks.filter(t => t.target_date === dateStr);
      const done = dayTasks.filter(t => t.is_completed).length;
      const total = dayTasks.length;
      const dayName = new Date(dateStr).toLocaleDateString('ar-DZ', { weekday: 'short' });
      return { label: dayName, done, total };
    });
  }, [tasks]);

  const max = Math.max(...bars.map(b => b.total), 1);

  return (
    <div className="flex items-end gap-3 pt-4 min-h-[130px]">
      {bars.map((bar, i) => {
        const totalH = Math.round((bar.total / max) * 90);
        const doneH  = bar.total > 0 ? Math.round((bar.done / bar.total) * totalH) : 0;
        return (
          <div key={bar.label} className="flex-1 flex flex-col items-center gap-1.5 h-[110px]">
            <div className="flex-1 w-full flex items-end">
              <div
                className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden relative"
                style={{ height: `${totalH}px` }}
              >
                <motion.div
                  className="absolute bottom-0 right-0 left-0 rounded-xl"
                  style={{ background: 'linear-gradient(to top, #2563eb, #38bdf8)' }}
                  initial={{ height: 0 }}
                  animate={{ height: `${doneH}px` }}
                  transition={{ delay: i * 0.08 + 0.2, duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </div>
            <span className="text-[10px] font-black text-slate-400 shrink-0">{bar.label}</span>
          </div>
        );
      })}
    </div>
  );
}

const priorityBadge: Record<TaskPriority, 'absent' | 'late' | 'normal'> = {
  high: 'absent', medium: 'late', low: 'normal',
};

export default function Dashboard() {
  const { workers, loading: wLoad, presentCount, absentCount, lateCount } = useWorkers();
  const { tasks, loading: tLoad, pendingCount, completedCount, highCount } = useTasks();
  const { items, loading: iLoad, lowStockItems, totalItems } = useInventory();

  const stats = [
    {
      name: 'العمال اليوم',
      value: `${presentCount}/${workers.length}`,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      trend: `${workers.length > 0 ? Math.round((presentCount/workers.length)*100) : 0}%`,
      trendColor: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30',
    },
    {
      name: 'تنبيهات المخزن',
      value: `${lowStockItems.length} أصناف`,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      trend: 'عاجل',
      trendColor: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30',
    },
    {
      name: 'المهام المنجزة',
      value: `${completedCount}/${tasks.length}`,
      icon: ClipboardCheck,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      trend: tasks.length > 0 ? `${Math.round((completedCount/tasks.length)*100)}%` : '0%',
      trendColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30',
    },
    {
      name: 'إجمالي المخزون',
      value: formatNumber(totalItems),
      icon: Package,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      trend: `${items.length} صنف`,
      trendColor: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30',
    },
  ];

  const urgentTasks = tasks.filter(t => !t.is_completed && t.priority === 'high').slice(0, 4);

  return (
    <div className="space-y-8">

      {/* ─── بطاقات الإحصاء ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-3xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300"
          >
            {/* بريق خلفي */}
            <div className={`absolute top-0 right-0 w-28 h-28 ${stat.bg} opacity-30 rounded-full blur-3xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-5">
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner`}>
                  <stat.icon size={24} />
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${stat.trendColor}`}>
                  {stat.trend}
                </span>
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{stat.name}</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ─── الصف الثاني ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* رسم الحضور الدائري */}
        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-4xl p-8 flex flex-col items-center"
        >
          <div className="flex items-center justify-between w-full mb-6">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                <Users size={16} />
              </div>
              حضور اليوم
            </h2>
            <Link href="/workers" prefetch={true} className="text-xs font-black text-blue-600 hover:underline underline-offset-4">
              التفاصيل
            </Link>
          </div>
          {wLoad ? (
            <div className="w-40 h-40 skeleton rounded-full" />
          ) : (
            <AttendanceRing present={presentCount} absent={absentCount} late={lateCount} />
          )}
        </motion.section>

        {/* مهام عاجلة */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card rounded-4xl p-8 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center">
                <AlertTriangle size={16} />
              </div>
              مهام عاجلة ({highCount})
            </h2>
            <Link href="/tasks" prefetch={true} className="text-xs font-black text-blue-600 hover:underline underline-offset-4">
              كل المهام
            </Link>
          </div>

          {tLoad ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 skeleton rounded-2xl" />)}</div>
          ) : urgentTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle2 size={40} className="text-emerald-500 mb-3" />
              <p className="font-black text-slate-600 dark:text-slate-300">لا توجد مهام عاجلة</p>
              <p className="text-xs text-slate-400 mt-1">أحسنت! كل شيء تحت السيطرة 👏</p>
            </div>
          ) : (
            <div className="space-y-3">
              {urgentTasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.07 }}
                  className="flex items-center justify-between p-4 bg-white/60 dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-rose-500 rounded-full group-hover:h-10 transition-all" />
                    <div>
                      <p className="font-black text-sm text-slate-800 dark:text-white leading-snug">{task.title}</p>
                      {task.target_date && (
                        <p className="text-[11px] text-slate-400 font-bold mt-0.5">{formatDate(task.target_date, { month: 'short', day: 'numeric' })}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={priorityBadge[task.priority]} size="sm">عاجلة</Badge>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </div>

      {/* ─── الصف الثالث: تنبيهات مخزون + مخطط أسبوعي ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* تنبيهات المخزن */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card rounded-4xl p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
                <Package size={16} />
              </div>
              تنبيهات المخزون
            </h2>
            <Link href="/inventory" prefetch={true} className="text-xs font-black text-blue-600 hover:underline underline-offset-4">
              المخزن
            </Link>
          </div>

          {iLoad ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 skeleton rounded-2xl" />)}</div>
          ) : lowStockItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 size={36} className="text-emerald-500 mb-3" />
              <p className="font-black text-slate-600 dark:text-slate-300 text-sm">المخزون في حالة جيدة</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockItems.slice(0, 4).map((item, i) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-amber-50/60 dark:bg-amber-900/10 rounded-3xl border border-amber-100 dark:border-amber-900/30">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-amber-500 rounded-full" />
                    <div>
                      <p className="font-black text-sm text-slate-800 dark:text-white">{item.sub_type}</p>
                      <p className="text-[11px] text-amber-600 font-black">باقي {item.stock?.quantity ?? 0} {item.unit}</p>
                    </div>
                  </div>
                  <Badge variant="late" size="sm">منخفض</Badge>
                </div>
              ))}
            </div>
          )}
        </motion.section>

        {/* مخطط أسبوعي للمهام */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-4xl p-8"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
              إنجاز المهام الأسبوعي
            </h2>
            <Link href="/reports" prefetch={true} className="text-xs font-black text-blue-600 hover:underline underline-offset-4">
              التقارير
            </Link>
          </div>
          <div className="mt-4">
            <WeeklyBar tasks={tasks} />
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs font-black text-slate-400">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-gradient-to-t from-blue-600 to-sky-400" />
              منجز
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700" />
              الكلي
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

