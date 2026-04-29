'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus, Search, Camera, Phone, MapPin, Calendar,
  Edit2, Trash2, Users, UserCheck, UserX, Clock,
  MoreVertical, X, ChevronDown, Plus, Wallet, ReceiptText, DollarSign
} from 'lucide-react';
import { useWorkers } from '@/lib/hooks/useWorkers';
import { useAuth, canEdit } from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Badge from '@/components/ui/Badge';
import Input, { Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { Worker, WorkerFormData } from '@/lib/types';
import { STATUS_LABELS, type AttendanceStatus } from '@/lib/types';
import { formatDate, getInitials, formatCurrency, today } from '@/lib/utils';

type FilterStatus = 'all' | AttendanceStatus;

const statusVariant: Record<AttendanceStatus, 'present' | 'absent' | 'late'> = {
  present: 'present', absent: 'absent', late: 'late',
};

const emptyForm: WorkerFormData = {
  name: '', phone: '', address: '', join_date: today(),
  daily_rate: 150,
};

export default function WorkersPage() {
  const { workers, loading, addWorker, updateWorker, deleteWorker, addAdvance, presentCount, absentCount, lateCount } = useWorkers();
  const { role } = useAuth();
  const isManager = canEdit(role);
  const { success, error: toastError } = useToast();

  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editWorker, setEditWorker] = useState<Worker | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Worker | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<WorkerFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof WorkerFormData, string>>>({});
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = workers;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(w => w.name.toLowerCase().includes(q) || (w.phone ?? '').includes(q));
    }
    if (filter !== 'all') list = list.filter(w => w.today_status === filter);
    return list;
  }, [workers, search, filter]);

  const openAdd = () => {
    setEditWorker(null);
    setForm({ ...emptyForm, photo_url: '' });
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (w: Worker) => {
    setEditWorker(w);
    setForm({
      name: w.name, phone: w.phone ?? '', address: w.address ?? '',
      join_date: w.join_date, daily_rate: w.daily_rate,
      photo_url: w.photo_url ?? '',
    });
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
    const ok = editWorker
      ? await updateWorker(editWorker.id, form)
      : await addWorker(form);
    setSaving(false);
    if (ok) {
      success(editWorker ? 'تم تعديل بيانات العامل ✏️' : 'تمت إضافة العامل بنجاح ✅');
      setShowModal(false);
    } else {
      toastError('حدث خطأ، حاول مرة أخرى');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const ok = await deleteWorker(deleteTarget.id);
    setDeleting(false);
    if (ok) {
      success('تم حذف العامل 🗑️');
      setDeleteTarget(null);
    } else {
      toastError('فشل الحذف');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          f('photo_url', compressedBase64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const f = (key: keyof WorkerFormData, val: string | number) =>
    setForm(p => ({ ...p, [key]: val }));

  return (
    <div className="space-y-8">

      {/* ─── بطاقات الإحصاء ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        {[
          { label: 'إجمالي العمال', value: workers.length, icon: Users,     color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20', key: 'all' },
          { label: 'حاضر اليوم',   value: presentCount,   icon: UserCheck,  color: 'text-emerald-600',bg: 'bg-emerald-50 dark:bg-emerald-900/20', key: 'present' },
          { label: 'غائب',          value: absentCount,    icon: UserX,      color: 'text-rose-600',   bg: 'bg-rose-50 dark:bg-rose-900/20',    key: 'absent' },
          { label: 'متأخر',         value: lateCount,      icon: Clock,      color: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-900/20',  key: 'late' },
        ].map((stat, i) => (
          <motion.button
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            onClick={() => setFilter(stat.key as FilterStatus)}
            className={`glass-card rounded-3xl p-5 text-right group hover:-translate-y-1 transition-all duration-300 w-full
              ${filter === stat.key ? 'ring-2 ring-violet-500/50' : ''}`}
          >
            <div className={`w-11 h-11 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 shadow-inner`}>
              <stat.icon size={22} />
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <p className={`text-3xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
          </motion.button>
        ))}
      </div>

      {/* ─── شريط البحث والإجراءات ─── */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="بحث بالاسم أو رقم الهاتف..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input w-full pr-12"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          )}
        </div>
        {isManager && (
          <Button onClick={openAdd} icon={<UserPlus size={16} />} className="shrink-0 shadow-lg shadow-violet-200 dark:shadow-violet-900/30">
            إضافة عامل
          </Button>
        )}
      </div>

      {/* ─── شبكة العمال ─── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-72 skeleton rounded-4xl" />)}
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filtered.map((worker, idx) => (
              <motion.div
                key={worker.id}
                layout
                initial={{ opacity: 0, scale: 0.93 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.93 }}
                transition={{ delay: idx * 0.05 }}
                className="group relative"
              >
                {/* بريق عند الـ hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-indigo-600/10 rounded-4xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

                <div className="glass-card rounded-4xl overflow-hidden border border-white/40 dark:border-slate-800/50">
                  {/* الجزء العلوي الملوّن */}
                  <div className="h-24 bg-gradient-to-l from-violet-600 to-indigo-500 relative">
                    {/* قائمة الخيارات */}
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      {isManager && (
                        <>
                          <button
                            onClick={() => openEdit(worker)}
                            className="p-2 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/40 transition-all"
                            title="تعديل"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(worker)}
                            className="p-2 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-rose-400/60 transition-all"
                            title="حذف"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="px-6 pb-6 relative">
                    {/* الصورة والشارة */}
                    <div className="flex justify-between items-end -mt-10 mb-4">
                      <div className="w-20 h-20 rounded-3xl border-4 border-white dark:border-slate-900 shadow-xl flex items-center justify-center overflow-hidden bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 group-hover:scale-105 transition-transform duration-300">
                        {worker.photo_url ? (
                          <img src={worker.photo_url} alt={worker.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl font-black text-violet-600 dark:text-violet-400">
                            {getInitials(worker.name)}
                          </span>
                        )}
                      </div>
                      {worker.today_status && (
                        <Badge variant={statusVariant[worker.today_status]} dot size="sm">
                          {STATUS_LABELS[worker.today_status]}
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-1 group-hover:text-violet-600 transition-colors">
                      {worker.name}
                    </h3>
                    <p className="text-xs font-bold text-violet-600 dark:text-violet-400 mb-4">
                      {formatCurrency(worker.daily_rate)} / يوم
                    </p>

                    <div className="space-y-2.5">
                      {worker.phone && (
                        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                          <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600">
                            <Phone size={13} />
                          </div>
                          <span className="font-bold" dir="ltr">{worker.phone}</span>
                        </div>
                      )}
                      {worker.address && (
                        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                          <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600">
                            <MapPin size={13} />
                          </div>
                          <span className="font-bold truncate">{worker.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                        <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600">
                          <Calendar size={13} />
                        </div>
                        <span className="font-bold">انضم: {formatDate(worker.join_date, { year: 'numeric', month: 'long' })}</span>
                      </div>
                    </div>

                    {/* أزرار السلفة وتصفية الراتب نُقلت لصفحة المالية */}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ─── Modal الإضافة/التعديل ─── */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editWorker ? 'تعديل بيانات العامل' : 'إضافة عامل جديد'}
        size="lg"
      >
        <div className="space-y-5">
          {/* Avatar Area */}
          <div className="flex justify-center mb-2">
            <label className="relative cursor-pointer group">
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <div className="w-24 h-24 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-900 group-hover:border-violet-500 transition-colors shadow-inner object-cover">
                {form.photo_url ? (
                  <img src={form.photo_url} className="w-full h-full object-cover" alt="Worker Avatar" />
                ) : (
                  <Camera size={28} className="text-slate-400 group-hover:text-violet-500" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-violet-600 text-white p-1.5 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <Plus size={14} />
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="الاسم الكامل"
              placeholder="مثال: أحمد محمد الزهراني"
              value={form.name}
              onChange={e => f('name', e.target.value)}
              error={errors.name}
              icon={<Users size={16} />}
            />
            <Input
              label="رقم الهاتف"
              placeholder="05xxxxxxxx"
              value={form.phone}
              onChange={e => f('phone', e.target.value)}
              error={errors.phone}
              icon={<Phone size={16} />}
              dir="ltr"
            />
          </div>

          <Input
            label="العنوان / السكن"
            placeholder="الحي، الشارع، المدينة"
            value={form.address}
            onChange={e => f('address', e.target.value)}
            icon={<MapPin size={16} />}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="تاريخ الانضمام"
              type="date"
              value={form.join_date}
              onChange={e => f('join_date', e.target.value)}
            />
            <Input
              label="الأجر اليومي (دج)"
              type="number"
              min="0"
              value={String(form.daily_rate)}
              onChange={e => f('daily_rate', Number(e.target.value))}
              error={errors.daily_rate}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button onClick={handleSave} loading={saving} className="flex-1">
              {editWorker ? 'حفظ التعديلات' : 'إضافة العامل'}
            </Button>
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
              إلغاء
            </Button>
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
