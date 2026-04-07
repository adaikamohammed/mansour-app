'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, CheckSquare, Square, Calendar, Trash2, Edit2,
  ClipboardCheck, ListTodo, Flame, LayoutGrid, Search,
} from 'lucide-react';
import { useTasks } from '@/lib/hooks/useTasks';
import { useAuth, canEdit } from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Badge from '@/components/ui/Badge';
import Input, { Select, Textarea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { Task, TaskFormData, TaskPriority } from '@/lib/types';
import { formatDate, formatDateShort } from '@/lib/utils';

type FilterTab = 'all' | 'active' | 'done' | 'high';

const priorityBadge: Record<TaskPriority, { variant: 'absent' | 'late' | 'normal'; label: string }> = {
  high:   { variant: 'absent', label: 'عالية 🔴' },
  medium: { variant: 'late',   label: 'متوسطة 🟡' },
  low:    { variant: 'normal', label: 'منخفضة 🟢' },
};

const TABS = [
  { key: 'all',    label: 'الكل',    icon: LayoutGrid  },
  { key: 'active', label: 'نشط',     icon: ListTodo    },
  { key: 'done',   label: 'منجز',    icon: ClipboardCheck },
  { key: 'high',   label: 'عاجل',    icon: Flame       },
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

  const openAdd = () => {
    setEditTask(null);
    setForm(emptyForm);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (task: Task) => {
    setEditTask(task);
    setForm({ title: task.title, description: task.description ?? '', target_date: task.target_date ?? '', priority: task.priority });
    setErrors({});
    setShowModal(true);
  };

  const validate = (): boolean => {
    const e: Partial<TaskFormData> = {};
    if (!form.title.trim()) e.title = 'العنوان مطلوب';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const ok = editTask
      ? await updateTask(editTask.id, form)
      : await addTask(form);
    setSaving(false);
    if (ok) {
      success(editTask ? 'تم تعديل المهمة ✏️' : 'تمت إضافة المهمة ✅');
      setShowModal(false);
    } else {
      toastError('حدث خطأ، حاول مرة أخرى');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const ok = await deleteTask(deleteTarget.id);
    setDeleting(false);
    if (ok) {
      success('تم حذف المهمة 🗑️');
      setDeleteTarget(null);
    } else {
      toastError('فشل الحذف');
    }
  };

  const handleToggle = async (task: Task) => {
    await toggleComplete(task.id);
    success(task.is_completed ? 'أُعيدت المهمة للنشط' : 'أحسنت! تم إنجاز المهمة 🎉');
  };

  return (
    <div className="space-y-8">

      {/* ─── بطاقات الإحصاء ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'مهام متبقية', value: pendingCount, icon: ListTodo,      color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
          { label: 'مهام عاجلة',  value: highCount,    icon: Flame,         color: 'text-rose-500',   bg: 'bg-rose-50 dark:bg-rose-900/20'     },
          { label: 'تم إنجازها',  value: completedCount, icon: ClipboardCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-3xl p-6 flex items-center gap-5 group hover:-translate-y-1 transition-transform duration-300"
          >
            <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 shadow-inner`}>
              <stat.icon size={26} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className={`text-4xl font-black mt-0.5 ${stat.color}`}>{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ─── شريط الأدوات ─── */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* تبويبات الفلتر */}
        <div className="flex gap-1 p-1.5 glass-card rounded-2xl">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as FilterTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 ${
                tab === t.key
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-200 dark:shadow-violet-900/30'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          {/* بحث */}
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="بحث في المهام..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input w-full pr-10 py-2.5 text-sm"
            />
          </div>

          {/* زر الإضافة */}
          {isManager && (
            <Button onClick={openAdd} icon={<Plus size={16} />} size="sm" className="shrink-0 shadow-lg shadow-violet-200 dark:shadow-violet-900/30">
              مهمة جديدة
            </Button>
          )}
        </div>
      </div>

      {/* ─── قائمة المهام ─── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 skeleton rounded-3xl" />
          ))}
        </div>
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
          <div className="space-y-3">
            {filtered.map((task, idx) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.96, x: 16 }}
                transition={{ delay: idx * 0.04 }}
                className={`glass-card rounded-3xl p-2 group transition-all duration-300 ${
                  task.is_completed ? 'opacity-55' : 'hover:shadow-xl hover:shadow-violet-600/5'
                }`}
              >
                <div className="flex items-center gap-4 p-3">
                  {/* زر الإنجاز */}
                  <motion.button
                    whileTap={isManager ? { scale: 0.82 } : {}}
                    onClick={() => isManager && handleToggle(task)}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                      task.is_completed
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30'
                        : `bg-slate-100 dark:bg-slate-800 text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-600 ${isManager ? 'hover:border-violet-400 hover:text-violet-600 cursor-pointer' : 'cursor-default'}`
                    }`}
                    aria-label={task.is_completed ? 'إلغاء الإنجاز' : 'تحديد كمنجز'}
                  >
                    {task.is_completed ? <CheckSquare size={22} /> : <Square size={22} />}
                  </motion.button>

                  {/* محتوى المهمة */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-black text-base leading-snug transition-all ${
                      task.is_completed
                        ? 'line-through text-slate-400'
                        : 'text-slate-800 dark:text-white'
                    }`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-xs text-slate-400 font-medium mt-1 truncate">{task.description}</p>
                    )}
                    <div className="flex items-center flex-wrap gap-3 mt-2">
                      {task.target_date && (
                        <span className="flex items-center gap-1.5 text-[11px] font-black text-slate-400">
                          <Calendar size={11} className="text-violet-500" />
                          {formatDateShort(task.target_date)}
                        </span>
                      )}
                      <Badge variant={priorityBadge[task.priority].variant} size="sm" dot>
                        {priorityBadge[task.priority].label}
                      </Badge>
                    </div>
                  </div>

                  {/* أزرار الإجراءات */}
                  {isManager && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                      <button
                        onClick={() => openEdit(task)}
                        className="p-2.5 rounded-xl text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
                        title="تعديل"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(task)}
                        className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                        title="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* ─── Modal الإضافة/التعديل ─── */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editTask ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}
        size="md"
      >
        <div className="space-y-5">
          <Input
            label="عنوان المهمة"
            placeholder="مثال: تجهيز شحنة قارورات ياسمين..."
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            error={errors.title}
          />

          <Textarea
            label="التفاصيل (اختياري)"
            placeholder="أي ملاحظات أو تعليمات إضافية..."
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="التاريخ المستهدف"
              type="date"
              value={form.target_date}
              onChange={e => setForm(p => ({ ...p, target_date: e.target.value }))}
            />
            <Select
              label="الأولوية"
              value={form.priority}
              onChange={e => setForm(p => ({ ...p, priority: e.target.value as TaskPriority }))}
            >
              <option value="high">🔴 عالية</option>
              <option value="medium">🟡 متوسطة</option>
              <option value="low">🟢 منخفضة</option>
            </Select>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button onClick={handleSave} loading={saving} className="flex-1">
              {editTask ? 'حفظ التعديلات' : 'إضافة المهمة'}
            </Button>
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
              إلغاء
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── حوار الحذف ─── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message={`هل أنت متأكد من حذف المهمة "${deleteTarget?.title}"؟ لا يمكن التراجع عن هذا الإجراء.`}
      />
    </div>
  );
}
