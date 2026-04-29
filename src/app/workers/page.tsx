'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus, Search, Camera, Phone, MapPin, Calendar,
  Edit2, Trash2, Users, UserCheck, UserX, Clock,
  X, Plus, ChevronLeft, ChevronRight, CheckCircle2,
} from 'lucide-react';
import { useWorkers } from '@/lib/hooks/useWorkers';
import { useAuth, canEdit } from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { Worker, WorkerFormData } from '@/lib/types';
import { STATUS_LABELS, type AttendanceStatus } from '@/lib/types';
import { formatDate, getInitials, formatCurrency, today } from '@/lib/utils';

type FilterStatus = 'all' | AttendanceStatus;

const STATUS_COLORS: Record<AttendanceStatus, { bg: string; text: string; dot: string }> = {
  present: { bg: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  absent:  { bg: 'bg-rose-500',    text: 'text-rose-700 dark:text-rose-400',       dot: 'bg-rose-500'    },
  late:    { bg: 'bg-amber-500',   text: 'text-amber-700 dark:text-amber-400',     dot: 'bg-amber-500'   },
};

const emptyForm: WorkerFormData = { name: '', phone: '', address: '', join_date: today(), daily_rate: 150 };

// ─── تقويم الحضور الشهري ───
function AttendanceCalendar({
  worker,
  onClose,
  onSave,
}: {
  worker: Worker;
  onClose: () => void;
  onSave: (records: { date: string; status: AttendanceStatus }[]) => Promise<void>;
}) {
  const now = new Date();
  const [viewDate, setViewDate] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [pending, setPending] = useState<Record<string, AttendanceStatus>>({});
  const [saving, setSaving] = useState(false);

  const attendanceMap = useMemo(() => {
    const map: Record<string, AttendanceStatus> = {};
    const atts = (worker as any).attendance ?? [];
    atts.forEach((a: any) => { map[a.date] = a.status; });
    return map;
  }, [worker]);

  const { year, month } = viewDate;
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = today();

  const monthLabel = new Date(year, month).toLocaleDateString('ar-DZ', { month: 'long', year: 'numeric' });

  const prevMonth = () => setViewDate(v => {
    const d = new Date(v.year, v.month - 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const nextMonth = () => setViewDate(v => {
    const d = new Date(v.year, v.month + 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const cycleStatus = (dateStr: string) => {
    const current = pending[dateStr] ?? attendanceMap[dateStr];
    const cycle: (AttendanceStatus | undefined)[] = ['present', 'absent', 'late', undefined];
    const idx = cycle.indexOf(current as any);
    const next = cycle[(idx + 1) % cycle.length];
    setPending(p => {
      const copy = { ...p };
      if (next === undefined) delete copy[dateStr];
      else copy[dateStr] = next;
      return copy;
    });
  };

  const handleSave = async () => {
    const records = Object.entries(pending).map(([date, status]) => ({ date, status }));
    if (!records.length) { onClose(); return; }
    setSaving(true);
    await onSave(records);
    setSaving(false);
    onClose();
  };

  const days = ['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب'];

  return (
    <div className="space-y-4">
      {/* رأس التقويم */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <ChevronRight size={18} className="text-slate-500" />
        </button>
        <span className="font-black text-slate-800 dark:text-white text-sm">{monthLabel}</span>
        <button
          onClick={nextMonth}
          disabled={year === now.getFullYear() && month === now.getMonth()}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30"
        >
          <ChevronLeft size={18} className="text-slate-500" />
        </button>
      </div>

      {/* مفتاح الألوان */}
      <div className="flex items-center justify-center gap-4 text-xs font-bold">
        {(['present', 'absent', 'late'] as AttendanceStatus[]).map(s => (
          <div key={s} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[s].dot}`} />
            <span className="text-slate-500">{STATUS_LABELS[s]}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
          <span className="text-slate-500">غير مسجل</span>
        </div>
      </div>

      {/* أيام الأسبوع */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(d => (
          <div key={d} className="text-center text-[10px] font-black text-slate-400 py-1">{d}</div>
        ))}

        {/* أيام فارغة في البداية */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`e-${i}`} />
        ))}

        {/* أيام الشهر */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isFuture = dateStr > todayStr;
          const isToday = dateStr === todayStr;
          const status = pending[dateStr] ?? attendanceMap[dateStr];
          const color = status ? STATUS_COLORS[status] : null;

          return (
            <motion.button
              key={dateStr}
              whileTap={!isFuture ? { scale: 0.88 } : {}}
              onClick={() => !isFuture && cycleStatus(dateStr)}
              disabled={isFuture}
              className={`
                relative aspect-square rounded-xl flex items-center justify-center text-xs font-black
                transition-all duration-200 select-none
                ${isFuture ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer hover:ring-2 hover:ring-violet-400/50'}
                ${isToday ? 'ring-2 ring-violet-500' : ''}
                ${color ? color.bg + ' text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}
                ${pending[dateStr] ? 'scale-105' : ''}
              `}
            >
              {day}
              {pending[dateStr] && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-violet-500 border border-white" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* ملخص */}
      <div className="flex items-center justify-between text-xs font-bold px-1">
        <span className="text-slate-400">
          {Object.keys(pending).length > 0
            ? `${Object.keys(pending).length} يوم تم تعديله`
            : 'انقر على يوم لتغيير حالته'}
        </span>
        <span className="text-emerald-600">
          حضور: {Object.values({ ...attendanceMap, ...pending }).filter(s => s === 'present').length} يوم
        </span>
      </div>

      <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Button onClick={handleSave} loading={saving} className="flex-1">
          حفظ التعديلات
        </Button>
        <Button variant="secondary" onClick={onClose} className="flex-1">إلغاء</Button>
      </div>
    </div>
  );
}

// ─── بطاقة العامل ───
function WorkerCard({
  worker,
  isManager,
  onEdit,
  onDelete,
  onAttendance,
}: {
  worker: Worker;
  isManager: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onAttendance: () => void;
}) {
  const statusVariant = { present: 'present', absent: 'absent', late: 'late' } as const;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.93 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.93 }}
      className="group relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-indigo-600/10 rounded-4xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
      <div className="glass-card rounded-4xl overflow-hidden border border-white/40 dark:border-slate-800/50">
        {/* شريط علوي ملوّن */}
        <div className="h-20 bg-gradient-to-l from-violet-600 to-indigo-500 relative">
          {isManager && (
            <div className="absolute top-3 left-3 flex gap-1.5">
              <button onClick={onEdit} className="p-1.5 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/40 transition-all" title="تعديل">
                <Edit2 size={13} />
              </button>
              <button onClick={onDelete} className="p-1.5 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-rose-400/60 transition-all" title="حذف">
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 relative">
          {/* صورة وشارة الحالة */}
          <div className="flex justify-between items-end -mt-9 mb-3">
            <div className="w-18 h-18 w-[72px] h-[72px] rounded-3xl border-4 border-white dark:border-slate-900 shadow-xl flex items-center justify-center overflow-hidden bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30">
              {worker.photo_url
                ? <img src={worker.photo_url} alt={worker.name} className="w-full h-full object-cover" />
                : <span className="text-2xl font-black text-violet-600">{getInitials(worker.name)}</span>
              }
            </div>
            {worker.today_status && (
              <Badge variant={statusVariant[worker.today_status]} dot size="sm">
                {STATUS_LABELS[worker.today_status]}
              </Badge>
            )}
          </div>

          <h3 className="text-lg font-black text-slate-800 dark:text-white mb-0.5 group-hover:text-violet-600 transition-colors">{worker.name}</h3>
          <p className="text-xs font-bold text-violet-600 dark:text-violet-400 mb-3">{formatCurrency(worker.daily_rate)} / يوم</p>

          <div className="space-y-1.5 mb-4">
            {worker.phone && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Phone size={11} className="text-violet-400" />
                <span dir="ltr" className="font-bold">{worker.phone}</span>
              </div>
            )}
            {worker.address && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <MapPin size={11} className="text-violet-400" />
                <span className="font-bold truncate">{worker.address}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar size={11} className="text-violet-400" />
              <span className="font-bold">انضم: {formatDate(worker.join_date, { year: 'numeric', month: 'short' })}</span>
            </div>
          </div>

          {/* زر تقويم الحضور */}
          {isManager && (
            <button
              onClick={onAttendance}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl
                bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400
                text-xs font-black hover:bg-violet-100 dark:hover:bg-violet-900/40
                border border-violet-100 dark:border-violet-900/30 transition-all duration-200
                hover:shadow-md hover:shadow-violet-200/50"
            >
              <Calendar size={14} />
              تسجيل الحضور
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── الصفحة الرئيسية ───
export default function WorkersPage() {
  const { workers, loading, addWorker, updateWorker, deleteWorker, updateAttendance, presentCount, absentCount, lateCount } = useWorkers();
  const { role } = useAuth();
  const isManager = canEdit(role);
  const { success, error: toastError } = useToast();

  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editWorker, setEditWorker] = useState<Worker | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Worker | null>(null);
  const [attendanceWorker, setAttendanceWorker] = useState<Worker | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<WorkerFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof WorkerFormData, string>>>({});

  const filtered = useMemo(() => {
    let list = workers;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(w => w.name.toLowerCase().includes(q) || (w.phone ?? '').includes(q));
    }
    if (filter !== 'all') list = list.filter(w => w.today_status === filter);
    return list;
  }, [workers, search, filter]);

  const openAdd = () => { setEditWorker(null); setForm({ ...emptyForm, photo_url: '' }); setErrors({}); setShowModal(true); };
  const openEdit = (w: Worker) => {
    setEditWorker(w);
    setForm({ name: w.name, phone: w.phone ?? '', address: w.address ?? '', join_date: w.join_date, daily_rate: w.daily_rate, photo_url: w.photo_url ?? '' });
    setErrors({});
    setShowModal(true);
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof WorkerFormData, string>> = {};
    if (!form.name.trim()) e.name = 'الاسم مطلوب';
    if (form.phone && !/^0[567]\d{8}$/.test(form.phone)) e.phone = 'رقم الهاتف غير صحيح';
    if (form.daily_rate < 0) e.daily_rate = 'الأجر لا يمكن أن يكون سالباً';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const ok = editWorker ? await updateWorker(editWorker.id, form) : await addWorker(form);
    setSaving(false);
    if (ok) { success(editWorker ? 'تم تعديل بيانات العامل ✏️' : 'تمت إضافة العامل بنجاح ✅'); setShowModal(false); }
    else toastError('حدث خطأ، حاول مرة أخرى');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const ok = await deleteWorker(deleteTarget.id);
    setDeleting(false);
    if (ok) { success('تم حذف العامل 🗑️'); setDeleteTarget(null); }
    else toastError('فشل الحذف');
  };

  const handleAttendanceSave = async (records: { date: string; status: AttendanceStatus }[]) => {
    if (!attendanceWorker) return;
    const ok = await updateAttendance(attendanceWorker.id, records);
    if (ok) success('تم تحديث الحضور بنجاح ✅');
    else toastError('حدث خطأ أثناء الحفظ');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 250;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } } else { if (h > MAX) { w *= MAX / h; h = MAX; } }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) { ctx.drawImage(img, 0, 0, w, h); f('photo_url', canvas.toDataURL('image/jpeg', 0.6)); }
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const f = (key: keyof WorkerFormData, val: string | number) => setForm(p => ({ ...p, [key]: val }));

  const stats = [
    { label: 'إجمالي العمال', value: workers.length,  icon: Users,     color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20', key: 'all' },
    { label: 'حاضر اليوم',   value: presentCount,     icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', key: 'present' },
    { label: 'غائب',          value: absentCount,      icon: UserX,     color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20', key: 'absent' },
    { label: 'متأخر',         value: lateCount,        icon: Clock,     color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', key: 'late' },
  ];

  return (
    <div className="space-y-6">

      {/* بطاقات الإحصاء */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.button
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            onClick={() => setFilter(stat.key as FilterStatus)}
            className={`glass-card rounded-3xl p-4 text-right group hover:-translate-y-1 transition-all duration-300 w-full ${filter === stat.key ? 'ring-2 ring-violet-500/60' : ''}`}
          >
            <div className={`w-10 h-10 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-3 shadow-inner`}>
              <stat.icon size={20} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <p className={`text-2xl font-black mt-0.5 ${stat.color}`}>{stat.value}</p>
          </motion.button>
        ))}
      </div>

      {/* شريط البحث والإضافة */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="بحث بالاسم أو الهاتف..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input w-full pr-11"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={15} />
            </button>
          )}
        </div>
        {isManager && (
          <Button onClick={openAdd} icon={<UserPlus size={16} />} className="shrink-0 shadow-lg shadow-violet-200 dark:shadow-violet-900/30">
            إضافة عامل
          </Button>
        )}
      </div>

      {/* شبكة العمال */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 skeleton rounded-4xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
            <Users size={40} className="text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-xl font-black text-slate-700 dark:text-white">لا يوجد عمال مطابقون</p>
          <p className="text-sm text-slate-400 mt-2 mb-6">جرّب تغيير معايير البحث</p>
          {isManager && <Button onClick={openAdd} icon={<UserPlus size={16} />} size="sm">إضافة عامل جديد</Button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <AnimatePresence>
            {filtered.map(worker => (
              <WorkerCard
                key={worker.id}
                worker={worker}
                isManager={isManager}
                onEdit={() => openEdit(worker)}
                onDelete={() => setDeleteTarget(worker)}
                onAttendance={() => setAttendanceWorker(worker)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal تقويم الحضور */}
      <Modal
        isOpen={!!attendanceWorker}
        onClose={() => setAttendanceWorker(null)}
        title={`تسجيل حضور — ${attendanceWorker?.name ?? ''}`}
        size="sm"
      >
        {attendanceWorker && (
          <AttendanceCalendar
            worker={attendanceWorker}
            onClose={() => setAttendanceWorker(null)}
            onSave={handleAttendanceSave}
          />
        )}
      </Modal>

      {/* Modal الإضافة/التعديل */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editWorker ? 'تعديل بيانات العامل' : 'إضافة عامل جديد'} size="lg">
        <div className="space-y-5">
          <div className="flex justify-center mb-2">
            <label className="relative cursor-pointer group">
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <div className="w-24 h-24 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-900 group-hover:border-violet-500 transition-colors shadow-inner">
                {form.photo_url ? <img src={form.photo_url} className="w-full h-full object-cover" alt="avatar" /> : <Camera size={28} className="text-slate-400 group-hover:text-violet-500" />}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-violet-600 text-white p-1.5 rounded-xl shadow-lg"><Plus size={14} /></div>
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="الاسم الكامل" placeholder="أحمد محمد..." value={form.name} onChange={e => f('name', e.target.value)} error={errors.name} icon={<Users size={16} />} />
            <Input label="رقم الهاتف" placeholder="05xxxxxxxx" value={form.phone} onChange={e => f('phone', e.target.value)} error={errors.phone} icon={<Phone size={16} />} dir="ltr" />
          </div>
          <Input label="العنوان / السكن" placeholder="الحي، الشارع، المدينة" value={form.address} onChange={e => f('address', e.target.value)} icon={<MapPin size={16} />} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="تاريخ الانضمام" type="date" value={form.join_date} onChange={e => f('join_date', e.target.value)} />
            <Input label="الأجر اليومي (دج)" type="number" min="0" value={String(form.daily_rate)} onChange={e => f('daily_rate', Number(e.target.value))} error={errors.daily_rate} />
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button onClick={handleSave} loading={saving} className="flex-1">{editWorker ? 'حفظ التعديلات' : 'إضافة العامل'}</Button>
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">إلغاء</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message={`هل أنت متأكد من حذف العامل "${deleteTarget?.name}"؟ سيتم حذف جميع سجلات حضوره أيضاً.`}
      />
    </div>
  );
}
