'use client';

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Package, Box, FlaskConical, CircleDot,
  Droplets, AlertTriangle, Edit2, Trash2, X, History, Minus,
  ArrowDownToLine, ArrowUpFromLine
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useInventory } from '@/lib/hooks/useInventory';
import { useAuth, canEdit } from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Input, { Select } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { InventoryFormData, InventoryMainType } from '@/lib/types';
import { MAIN_TYPE_LABELS } from '@/lib/types';
import { formatNumber, getStockStatus } from '@/lib/utils';

const CATEGORY_ICONS: Record<InventoryMainType, React.ElementType> = {
  carton: Box,
  bottle: FlaskConical,
  cap: CircleDot,
  material: Droplets,
};

const CATEGORY_COLORS: Record<InventoryMainType, { color: string; bg: string; ring: string; border: string }> = {
  carton:   { color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/20',   ring: 'ring-amber-200 dark:ring-amber-800',     border: 'border-amber-500' },
  bottle:   { color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20',     ring: 'ring-blue-200 dark:ring-blue-800',       border: 'border-blue-500' },
  cap:      { color: 'text-blue-600',  bg: 'bg-blue-50 dark:bg-blue-900/20', ring: 'ring-blue-200 dark:ring-blue-800',   border: 'border-blue-500' },
  material: { color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', ring: 'ring-emerald-200 dark:ring-emerald-800', border: 'border-emerald-500' },
};

const emptyForm: InventoryFormData = { main_type: 'carton', sub_type: '', unit: 'قطعة', initial_quantity: 0, min_stock_level: 50 };

export default function InventoryPage() {
  const router = useRouter();
  const { items, loading, error: inventoryError, addItem, editItem, recordTransaction, deleteItem, lowStockItems, forecasts } = useInventory();
  const { role } = useAuth();
  const isManager = canEdit(role);
  const { success, error: toastError } = useToast();

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<InventoryFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<InventoryFormData>>({});

  // حالة التعديل
  const [editTargetId, setEditTargetId] = useState<string | null>(null);

  // حالة الحركات (Transactions)
  const [txTarget, setTxTarget] = useState<any>(null);
  const [txType, setTxType] = useState<'in' | 'out'>('in');
  const [txQty, setTxQty] = useState('');
  const [txNote, setTxNote] = useState('');
  const [recordingTx, setRecordingTx] = useState(false);

  const filtered = useMemo(() => {
    let list = items;
    if (search) list = list.filter(i => i.sub_type.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [items, search]);

  const validate = (): boolean => {
    const e: Partial<InventoryFormData> = {};
    if (!form.sub_type.trim()) (e as Record<string, string>).sub_type = 'اسم الصنف مطلوب';
    if (!form.unit.trim()) (e as Record<string, string>).unit = 'الوحدة مطلوبة';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    setSaving(true);
    let ok = false;
    const formToSave = { ...form };
    if (editTargetId) {
      ok = await editItem(editTargetId, formToSave);
    } else {
      ok = await addItem(formToSave);
    }
    setSaving(false);
    if (ok) {
      success(editTargetId ? 'تم تعديل الصنف بنجاح ✅' : 'تمت إضافة الصنف بنجاح ✅');
      setShowAddModal(false);
      setForm(emptyForm);
      setEditTargetId(null);
    } else toastError(editTargetId ? 'فشل التعديل' : 'فشلت الإضافة');
  };

  const openEditModal = (item: any) => {
    setEditTargetId(item.id);
    setForm({
      main_type: item.main_type,
      sub_type: item.sub_type,
      unit: item.unit,
      initial_quantity: item.stock?.quantity ?? 0,
      min_stock_level: item.min_stock_level ?? 50
    });
    setShowAddModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const ok = await deleteItem(deleteTarget);
    setDeleting(false);
    if (ok) { success('تم حذف الصنف 🗑️'); setDeleteTarget(null); }
    else toastError('فشل الحذف');
  };

  const openTransactionModal = (item: any, defaultType: 'in' | 'out') => {
    setTxTarget(item);
    setTxType(defaultType);
    setTxQty('');
    setTxNote('');
  };

  const handleTransaction = async () => {
    if (!txTarget) return;
    const qty = Number(txQty);
    if (isNaN(qty) || qty <= 0) {
      toastError('يرجى إدخال كمية صحيحة أكبر من الصفر');
      return;
    }
    const currentStock = txTarget.stock?.quantity ?? 0;
    if (txType === 'out' && qty > currentStock) {
      toastError('الكمية المتاحة لا تكفي لهذا الاستخراج');
      return;
    }

    setRecordingTx(true);
    const ok = await recordTransaction(txTarget.id, currentStock, qty, txType, txNote);
    setRecordingTx(false);
    
    if (ok) {
      success('تم تسجيل الحركة وتحديث المخزون بنجاح ✅');
      setTxTarget(null);
    } else {
      toastError(inventoryError || 'فشل التسجيل. ربما لم تقم بإنشاء جدول الحركات (inventory_transactions) في Supabase!');
    }
  };

  const f = (key: keyof InventoryFormData, val: string | number) =>
    setForm(p => ({ ...p, [key]: val }));

  return (
    <div className="space-y-8">

      {/* ─── التنبيهات ─── */}
      {lowStockItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-5 border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
            <h3 className="font-black text-amber-700 dark:text-amber-400">
              تنبيه: {lowStockItems.length} أصناف بمخزون منخفض
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockItems.map(item => {
              const qty = item.stock?.quantity ?? 0;
              const minLvl = item.min_stock_level ?? 50;
              const ratio = Math.min(1, Math.max(0, qty / minLvl));
              const r = 16;
              const circ = 2 * Math.PI * r;
              const strokeDashoffset = circ - ratio * circ;

              return (
                <div key={item.id} className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-amber-100 dark:border-amber-900/30 group hover:-translate-y-0.5 transition-transform">
                  <div className="relative w-12 h-12 shrink-0">
                    <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
                      <circle cx="20" cy="20" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-100 dark:text-slate-700" />
                      <circle 
                        cx="20" cy="20" r={r} 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="4" 
                        className={ratio > 0.5 ? 'text-amber-500' : 'text-rose-500'} 
                        strokeDasharray={circ}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-black text-slate-700 dark:text-slate-200">
                        {Math.round(ratio * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-800 dark:text-white truncate">{item.sub_type}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs font-bold text-slate-500">{qty} / {minLvl} {item.unit}</span>
                    </div>
                    {forecasts[item.id] !== undefined && (
                      <div className="mt-1.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-black bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-2 py-0.5 rounded-md">
                          ⚡ يكفي لـ {forecasts[item.id] === 0 ? 'أقل من يوم' : `${forecasts[item.id]} يوم`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ─── شريط الأدوات ─── */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="بحث في جميع أصناف المخزون..."
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
          <div className="flex gap-3 shrink-0">
            <Button variant="secondary" onClick={() => router.push('/inventory/history')} icon={<History size={16} />}>
              سجل الحركات
            </Button>
            <Button onClick={() => { setEditTargetId(null); setForm(emptyForm); setShowAddModal(true); }} icon={<Plus size={16} />} className="shadow-lg shadow-blue-200 dark:shadow-blue-900/30">
              إضافة صنف
            </Button>
          </div>
        )}
      </div>

      {/* ─── 4 صناديق للأصناف (الجدول الجديد) ─── */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-80 skeleton rounded-4xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(Object.keys(MAIN_TYPE_LABELS) as InventoryMainType[]).map((type, idx) => {
            const Icon = CATEGORY_ICONS[type];
            const { color, bg, border } = CATEGORY_COLORS[type];
            const typeItems = filtered.filter(x => x.main_type === type);
            const typeTotal = typeItems.reduce((s, x) => s + (x.stock?.quantity ?? 0), 0);

            return (
              <motion.div 
                key={type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`glass-card rounded-4xl p-6 border-t-4 border-slate-200 dark:border-slate-800 ${border} shadow-xl flex flex-col h-[480px]`}
              >
                {/* رأس الصندوق */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl ${bg} ${color} flex items-center justify-center shadow-inner`}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <h2 className={`text-xl font-black ${color}`}>{MAIN_TYPE_LABELS[type]}</h2>
                      <p className="text-xs text-slate-500 font-bold">{typeItems.length} أنواع مسجلة</p>
                    </div>
                  </div>
                  <div className="text-left bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 font-bold mb-0.5">إجمالي الوحدات المستهلكة/المتبقية</p>
                    <p className={`text-2xl font-black ${color}`}>{formatNumber(typeTotal)}</p>
                  </div>
                </div>

                {/* قائمة الأصناف الحية */}
                {typeItems.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <Package size={48} className="mb-4 opacity-30" />
                    <p className="text-sm font-bold">لا يوجد أصناف مطابقة</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                    <AnimatePresence>
                      {typeItems.map(item => {
                        const qty = item.stock?.quantity ?? 0;
                        const stockStatus = getStockStatus(qty);

                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800 hover:shadow-md transition-all flex flex-col gap-4 group relative overflow-hidden"
                          >
                            {stockStatus === 'low' && (
                              <div className="absolute top-0 right-0 w-1.5 h-full bg-rose-500" title="مخزون منخفض" />
                            )}
                            
                            <div className="flex items-start justify-between w-full">
                              <div className="flex-1 min-w-0 pr-2">
                                <p className="font-black text-slate-800 dark:text-white text-base truncate" title={item.sub_type}>{item.sub_type}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                                    الوحدة: {item.unit}
                                  </span>
                                </div>
                              </div>
                              
                              {/* أزرار الإجراءات - ظاهرة دائما */}
                              {isManager && (
                                <div className="flex gap-1.5 shrink-0">
                                  <button onClick={() => openEditModal(item)} className="p-2 w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 transition-colors bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800" title="تعديل تفاصيل الصنف">
                                    <Edit2 size={16} />
                                  </button>
                                  <button onClick={() => { setDeleteTarget(item.id); setDeleteTargetName(item.sub_type); }} className="p-2 w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-900/30 transition-colors bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800" title="حذف الصنف">
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* متحكمات الكمية بشكل بارز للموبايل والشاشات */}
                            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/40 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 mt-auto">
                              {isManager ? (
                                <button
                                  onClick={() => openTransactionModal(item, 'out')}
                                  className="flex-1 h-11 sm:h-10 rounded-lg text-rose-600 bg-rose-100/50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 flex items-center justify-center transition-all font-bold gap-1.5 active:scale-95"
                                  title="سحب (استخراج)"
                                >
                                  <Minus size={18} strokeWidth={2.5} />
                                  <span className="text-sm">سحب</span>
                                </button>
                              ) : <div className="flex-1" />}
                              
                              <button
                                onClick={() => isManager && openTransactionModal(item, 'in')}
                                className={`flex-[1.2] text-center font-black text-2xl sm:text-xl ${isManager ? 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400' : 'cursor-default'} text-slate-900 dark:text-white truncate px-2`}
                                title="الرصيد المتاح"
                              >
                                {formatNumber(qty)}
                              </button>
                              
                              {isManager ? (
                                <button
                                  onClick={() => openTransactionModal(item, 'in')}
                                  className="flex-1 h-11 sm:h-10 rounded-lg text-emerald-600 bg-emerald-100/50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 flex items-center justify-center transition-all font-bold gap-1.5 active:scale-95"
                                  title="إضافة"
                                >
                                  <Plus size={18} strokeWidth={2.5} />
                                  <span className="text-sm">إضافة</span>
                                </button>
                              ) : <div className="flex-1" />}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ─── Modal الإضافة/التعديل ─── */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={editTargetId ? "تعديل الصنف" : "إضافة صنف جديد للرصيد"} size="md">
        <div className="space-y-5">
          <Select
            label="نوع الصندوق (الصنف)"
            value={form.main_type}
            onChange={e => f('main_type', e.target.value)}
          >
            {(Object.entries(MAIN_TYPE_LABELS) as [InventoryMainType, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>

          <Input
            label="تفاصيل أو اسم الصنف"
            placeholder="مثال: قارورة بلاستيك 250مل شفاف"
            value={form.sub_type}
            onChange={e => f('sub_type', e.target.value)}
            error={(errors as Record<string, string>).sub_type}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="وحدة القياس"
              placeholder="قطعة، لتر، كجم..."
              value={form.unit}
              onChange={e => f('unit', e.target.value)}
              error={(errors as Record<string, string>).unit}
            />
            {/* أزلنا حقل السعر لأن المخزن لا يحتوي على بيع/شراء فعلي بالأموال هنا */}
            <div className={editTargetId ? "hidden" : "block"}>
               <Input
                 label="الكمية الابتدائية (الرصيد المتاح)"
                 type="number"
                 min="0"
                 value={String(form.initial_quantity)}
                 onChange={e => f('initial_quantity', Number(e.target.value))}
               />
            </div>
            <Input
              label="حد التنبيه (أدنى كمية)"
              type="number"
              min="0"
              value={String(form.min_stock_level)}
              onChange={e => f('min_stock_level', Number(e.target.value))}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button onClick={handleAdd} loading={saving} className="flex-1">{editTargetId ? 'حفظ التعديلات' : 'إضافة وتأكيد'}</Button>
            <Button variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1">إلغاء</Button>
          </div>
        </div>
      </Modal>

      {/* ─── Modal العمليات (إدخال وإخراج) ─── */}
      <Modal isOpen={!!txTarget} onClose={() => setTxTarget(null)} title={txType === 'in' ? "إدخال للمخزن" : "استخراج للمشروع"} size="sm">
        {txTarget && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <p className="font-black text-slate-800 dark:text-white mb-1">{txTarget.sub_type}</p>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">الرصيد الحالي:</span>
                <span className="font-bold text-blue-600">{txTarget.stock?.quantity ?? 0} {txTarget.unit}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${txType === 'in' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 hover:bg-slate-200'}`}
                onClick={() => setTxType('in')}
              >
                إدخال (+)
              </button>
              <button 
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${txType === 'out' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 hover:bg-slate-200'}`}
                onClick={() => setTxType('out')}
              >
                استخراج (-)
              </button>
            </div>

            <Input
              label="الكمية المطلوبة (ارقام صحيحة)"
              type="number"
              min="1"
              value={txQty}
              onChange={e => setTxQty(e.target.value)}
              placeholder="أدخل الكمية هنا..."
              autoFocus
            />

            <Input
              label="ملاحظات (طبيعة الاستهلاك، اسم المستلم، رقم الشحنة...)"
              placeholder="اختياري..."
              value={txNote}
              onChange={e => setTxNote(e.target.value)}
            />

            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button 
                onClick={handleTransaction} 
                loading={recordingTx} 
                className={`flex-1 !text-white ${txType === 'in' ? '!bg-emerald-500 hover:!bg-emerald-600' : '!bg-rose-500 hover:!bg-rose-600'}`}
              >
                تأكيد {txType === 'in' ? 'الإدخال' : 'الاستخراج'}
              </Button>
              <Button variant="secondary" onClick={() => setTxTarget(null)} className="flex-1">إلغاء</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── حوار الحذف ─── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message={`هل أنت متأكد من حذف هذا الصنف "${deleteTargetName}" بشكل نهائي من المخزن؟`}
      />

    </div>
  );
}

