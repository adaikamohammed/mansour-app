'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, CheckSquare, Square, Calendar, Trash2, Edit2,
  ClipboardCheck, ListTodo, Flame, LayoutGrid, Search, Target,
} from 'lucide-react';
import { useTasks } from '@/lib/hooks/useTasks';
import { useAuth, canEdit } from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Input, { Select, Textarea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { Task, TaskFormData, TaskPriority } from '@/lib/types';
import { formatDateShort } from '@/lib/utils';

type FilterTab = 'all' | 'active' | 'done' | 'high';

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string; dot: string }> = {
  high:   { label: 'عاجلة',    color: 'text-rose-600 dark:text-rose-400',   bg: 'bg-rose-50 dark:bg-rose-900/20',   dot: 'bg-rose-500'   },
  medium: { label: 'متوسطة',   color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', dot: 'bg-amber-500'  },
  low:    { label: 'منخفضة',   color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', dot: 'bg-emerald-500' },
};

const TABS = [
  { key: 'all',    label: 'الكل',   icon: LayoutGrid   },
  { key: 'active', label: 'نشط',    icon: ListTodo     },
  { key: 'done',   label: 'منجز',   icon: ClipboardCheck },
  { key: 'high',   label: 'عاجل',   icon: Flame        },
] as const;

const emptyForm: TaskFormData = { title: '', description: '', target_date: '', priority: 'medium' };

export default function TasksPage() {
  const { tasks, loading, addTask, updateTask, deleteTask, toggleComplete, pendingCount, completedCount, highCount } = useTasks();
  const { role } = useAuth();
  const isManager = canEdit(role);
  const { success, error: toastError } = useToast();

  const [tab, setTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<TaskFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<TaskFormData>>({});

  const filtered = useMemo(() => {
    let list = tasks;
    if (search) list = list.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
    switch (tab) {
      case 'active': return list.filter(t => !t.is_completed);
      case 'done':   return list.filter(t =>  t.is_completed);
      case 'high':   return list.filter(t => !t.is_completed && t.priority === 'high');
      default:       return list;
    }
  }, [tasks, tab, search]);

  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const openAdd = () => { setEditTask(null); setForm(emptyForm); setErrors({}); setShowModal(true); };
  const openEdit = (t: Task) => {
    setEditTask(t);
    setForm({ title: t.title, description: t.description ?? '', target_date: t.target_date ?? '', priority: t.priority });
    setErrors({});
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setErrors({ title: 'العنوان مطلوب' }); return; }
    setSaving(true);
    const ok = editTask ? await updateTask(editTask.id, form) : await addTask(form);
    setSaving(false);
    if (ok) { success(editTask ? 'تم تعديل المهمة ✏️' : 'تمت إضافة المهمة ✅'); setShowModal(false); }
    else toastError('حدث خطأ، حاول مرة أخرى');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const ok = await deleteTask(deleteTarget.id);
    setDeleting(false);
    if (ok) { success('تم حذف المهمة 🗑️'); setDeleteTarget(null); }
    else toastError('فشل الحذف');
  };

  const handleToggle = async (t: Task) => {
    await toggleComplete(t.id);
    success(t.is_completed ? 'أُعيدت المهمة للنشط' : 'أحسنت! تم إنجاز المهمة 🎉');
  };

  return (
    <div className="space-y-6">

      {/* ─── إحصاءات + شريط التقدم ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'مهام متبقية', value: pendingCount,   icon: ListTodo,      color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20',    border: 'border-violet-100 dark:border-violet-900/30' },
          { label: 'مهام عاجلة',  value: highCount,      icon: Flame,         color: 'text-rose-500',   bg: 'bg-rose-50 dark:bg-rose-900/20',          border: 'border-rose-100 dark:border-rose-900/30'   },
          { label: 'تم إنجازها',  value: completedCount, icon: ClipboardCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20',  border: 'border-emerald-100 dark:border-emerald-900/30' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`glass-card rounded-3xl p-5 flex items-center gap-4 border ${s.border} hover:-translate-y-1 transition-all duration-300`}
          >
            <div className={`w-12 h-12 rounded-2xl ${s.bg} ${s.color} flex items-center justify-center shrink-0 shadow-inner`}>
              <s.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
              <p className={`text-3xl font-black mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* شريط التقدم الكلي */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card rounded-3xl p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-violet-500" />
            <span className="text-sm font-black text-slate-700 dark:text-slate-200">نسبة الإنجاز الكلية</span>
          </div>
          <span className="text-2xl font-black text-violet-600">{completionRate}%</span>
        </div>
        <div className="progress-bar h-3 rounded-full">
          <motion.div
            className="progress-bar-fill rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${completionRate}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs font-bold text-slate-400">
          <span>{completedCount} منجز</span>
          <span>{tasks.length} إجمالي</span>
        </div>
      </motion.div>

      {/* ─── شريط التبويبات والبحث ─── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1 p-1.5 glass-card rounded-2xl">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as FilterTab)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 ${
                tab === t.key
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-200 dark:shadow-violet-900/30'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <t.icon size={13} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-52">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="بحث في المهام..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input w-full pr-10 py-2.5 text-sm"
            />
          </div>
          {isManager && (
            <Button onClick={openAdd} icon={<Plus size={16} />} size="sm" className="shrink-0 shadow-lg shadow-violet-200 dark:shadow-violet-900/30">
              مهمة جديدة
            </Button>
          )}
        </div>
      </div>

      {/* ─── قائمة المهام ─── */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 skeleton rounded-3xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
            <ClipboardCheck size={40} className="text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-xl font-black text-slate-700 dark:text-slate-200">لا توجد مهام</p>
          <p className="text-sm text-slate-400 mt-2 mb-6">ابدأ بإضافة مهمة جديدة</p>
          {isManager && <Button onClick={openAdd} icon={<Plus size={16} />} size="sm">إضافة أول مهمة</Button>}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-2.5">
            {filtered.map((task, idx) => {
              const pc = PRIORITY_CONFIG[task.priority];
              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.96, x: 16 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`glass-card rounded-3xl group transition-all duration-300 overflow-hidden ${
                    task.is_completed ? 'opacity-50' : 'hover:shadow-xl hover:shadow-violet-600/5'
                  }`}
                >
                  {/* شريط الأولوية الجانبي */}
                  <div className="flex">
                    <div className={`w-1 shrink-0 ${pc.dot} ${task.is_completed ? 'opacity-30' : ''}`} />
                    <div className="flex-1 flex items-center gap-4 p-4">

                      {/* زر الإنجاز */}
                      <motion.button
                        whileTap={isManager ? { scale: 0.82 } : {}}
                        onClick={() => isManager && handleToggle(task)}
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                          task.is_completed
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30'
                            : `bg-slate-100 dark:bg-slate-800 text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-600 ${isManager ? 'hover:border-violet-400 hover:text-violet-600 cursor-pointer' : 'cursor-default'}`
                        }`}
                      >
                        {task.is_completed ? <CheckSquare size={20} /> : <Square size={20} />}
                      </motion.button>

                      {/* محتوى المهمة */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-black text-sm leading-snug ${task.is_completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">{task.description}</p>
                        )}
                        <div className="flex items-center flex-wrap gap-2 mt-1.5">
                          {task.target_date && (
                            <span className="flex items-center gap-1 text-[11px] font-black text-slate-400">
                              <Calendar size={10} className="text-violet-500" />
                              {formatDateShort(task.target_date)}
                            </span>
                          )}
                          <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${pc.bg} ${pc.color} flex items-center gap-1`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                            {pc.label}
                          </span>
                        </div>
                      </div>

                      {/* أزرار الإجراءات */}
                      {isManager && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                          <button onClick={() => openEdit(task)} className="p-2 rounded-xl text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all" title="تعديل">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => setDeleteTarget(task)} className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all" title="حذف">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}

      {/* Modal الإضافة/التعديل */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editTask ? 'تعديل المهمة' : 'إضافة مهمة جديدة'} size="md">
        <div className="space-y-5">
          <Input label="عنوان المهمة" placeholder="مثال: تجهيز شحنة قارورات..." value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} error={errors.title} />
          <Textarea label="التفاصيل (اختياري)" placeholder="أي ملاحظات أو تعليمات إضافية..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="التاريخ المستهدف" type="date" value={form.target_date} onChange={e => setForm(p => ({ ...p, target_date: e.target.value }))} />
            <Select label="الأولوية" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as TaskPriority }))}>
              <option value="high">🔴 عالية</option>
              <option value="medium">🟡 متوسطة</option>
              <option value="low">🟢 منخفضة</option>
            </Select>
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button onClick={handleSave} loading={saving} className="flex-1">{editTask ? 'حفظ التعديلات' : 'إضافة المهمة'}</Button>
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">إلغاء</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} message={`هل أنت متأكد من حذف المهمة "${deleteTarget?.title}"؟`} />
    </div>
  );
}
