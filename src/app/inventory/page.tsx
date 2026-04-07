'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Package, Box, FlaskConical, CircleDot,
  Droplets, AlertTriangle, Edit2, Trash2, Minus, X,
  ArrowUpRight, ArrowDownRight, ShoppingCart, DollarSign
} from 'lucide-react';
import { useInventory } from '@/lib/hooks/useInventory';
import { useAuth, canEdit } from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Badge from '@/components/ui/Badge';
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

const CATEGORY_COLORS: Record<InventoryMainType, { color: string; bg: string; ring: string }> = {
  carton:   { color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/20',   ring: 'ring-amber-200 dark:ring-amber-800'   },
  bottle:   { color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20',     ring: 'ring-blue-200 dark:ring-blue-800'     },
  cap:      { color: 'text-violet-600',  bg: 'bg-violet-50 dark:bg-violet-900/20', ring: 'ring-violet-200 dark:ring-violet-800' },
  material: { color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', ring: 'ring-emerald-200 dark:ring-emerald-800' },
};

const emptyForm: InventoryFormData = { main_type: 'carton', sub_type: '', unit: 'قطعة', unit_price: 0, initial_quantity: 0 };

export default function InventoryPage() {
  const { items, loading, addItem, editItem, sellItem, updateQuantity, deleteItem, totalItems, lowStockItems } = useInventory();
  const { role } = useAuth();
  const isManager = canEdit(role);
  const { success, error: toastError, warning } = useToast();

  const [activeType, setActiveType] = useState<InventoryMainType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<InventoryFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<InventoryFormData>>({});
  const [qtyEdit, setQtyEdit] = useState<{ id: string; val: string } | null>(null);

  // حالة التعديل
  const [editTargetId, setEditTargetId] = useState<string | null>(null);

  // حالة البيع
  const [sellTarget, setSellTarget] = useState<{ id: string; name: string; unit_price: number; maxQty: number } | null>(null);
  const [sellQty, setSellQty] = useState(1);
  const [selling, setSelling] = useState(false);

  const filtered = useMemo(() => {
    let list = items;
    if (activeType !== 'all') list = list.filter(i => i.main_type === activeType);
    if (search) list = list.filter(i => i.sub_type.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [items, activeType, search]);

  // إحصاء لكل نوع
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { carton: 0, bottle: 0, cap: 0, material: 0 };
    items.forEach(i => { counts[i.main_type] = (counts[i.main_type] ?? 0) + 1; });
    return counts;
  }, [items]);

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
    if (editTargetId) {
      ok = await editItem(editTargetId, form);
    } else {
      ok = await addItem(form);
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
      unit_price: item.unit_price,
      initial_quantity: item.stock?.quantity ?? 0
    });
    setShowAddModal(true);
  };

  const handleSell = async () => {
    if (!sellTarget) return;
    if (sellQty <= 0 || sellQty > sellTarget.maxQty) {
      toastError('كمية البيع غير صالحة');
      return;
    }
    setSelling(true);
    const ok = await sellItem(sellTarget.id, sellQty);
    setSelling(false);
    if (ok) {
      success(`تم بيع ${sellQty} وحدة بقيمة ${formatNumber(sellQty * sellTarget.unit_price)} دج ✅`);
      setSellTarget(null);
      setSellQty(1);
    } else {
      toastError('فشلت عملية البيع');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const ok = await deleteItem(deleteTarget);
    setDeleting(false);
    if (ok) { success('تم حذف الصنف 🗑️'); setDeleteTarget(null); }
    else toastError('فشل الحذف');
  };

  const handleQtyChange = async (id: string, delta: number, currentQty: number) => {
    const newQty = Math.max(0, currentQty + delta);
    const ok = await updateQuantity(id, newQty);
    if (ok) {
      if (newQty <= 50) warning(`تحذير: الكمية وصلت لـ ${newQty} وحدة فقط ⚠️`);
      else success('تم تحديث الكمية ✅');
    } else toastError('فشل التحديث');
  };

  const handleQtyDirect = async (id: string) => {
    if (!qtyEdit || qtyEdit.id !== id) return;
    const newQty = Number(qtyEdit.val);
    if (isNaN(newQty) || newQty < 0) return;
    const ok = await updateQuantity(id, newQty);
    if (ok) success('تم تحديث الكمية ✅');
    setQtyEdit(null);
  };

  const f = (key: keyof InventoryFormData, val: string | number) =>
    setForm(p => ({ ...p, [key]: val }));

  return (
    <div className="space-y-8">

      {/* ─── ملخص سريع ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(Object.keys(MAIN_TYPE_LABELS) as InventoryMainType[]).map((type, i) => {
          const Icon = CATEGORY_ICONS[type];
          const { color, bg } = CATEGORY_COLORS[type];
          const typeItems = items.filter(x => x.main_type === type);
          const typeTotal = typeItems.reduce((s, x) => s + (x.stock?.quantity ?? 0), 0);
          return (
            <motion.button
              key={type}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => setActiveType(activeType === type ? 'all' : type)}
              className={`glass-card rounded-3xl p-5 text-right group hover:-translate-y-1 transition-all duration-300 w-full
                ${activeType === type ? 'ring-2 ring-violet-500/40' : ''}`}
            >
              <div className={`w-11 h-11 rounded-2xl ${bg} ${color} flex items-center justify-center mb-3 shadow-inner`}>
                <Icon size={22} />
              </div>
              <p className="text-xs font-black text-slate-400 mb-1">{MAIN_TYPE_LABELS[type]}</p>
              <p className={`text-2xl font-black ${color}`}>{formatNumber(typeTotal)}</p>
              <p className="text-[10px] text-slate-400 font-bold">{typeCounts[type] ?? 0} صنف</p>
            </motion.button>
          );
        })}
      </div>

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
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map(item => (
              <span key={item.id} className="px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-black">
                {item.sub_type} — {item.stock?.quantity ?? 0} {item.unit}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* ─── شريط الأدوات ─── */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="بحث في المخزون..."
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
          <Button onClick={() => { setEditTargetId(null); setForm(emptyForm); setShowAddModal(true); }} icon={<Plus size={16} />} className="shrink-0 shadow-lg shadow-violet-200 dark:shadow-violet-900/30">
            إضافة صنف
          </Button>
        )}
      </div>

      {/* ─── جدول المخزون ─── */}
      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 skeleton rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
            <Package size={40} className="text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-xl font-black text-slate-700 dark:text-white">لا توجد أصناف</p>
          <p className="text-sm text-slate-400 mt-2 mb-5">ابدأ بإضافة أصناف المخزون</p>
          {isManager && <Button onClick={() => setShowAddModal(true)} icon={<Plus size={16} />} size="sm">إضافة أول صنف</Button>}
        </div>
      ) : (
        <div className="glass-card rounded-4xl overflow-hidden shadow-xl">
          <table className="data-table">
            <thead>
              <tr>
                <th>الصنف</th>
                <th className="text-center">النوع</th>
                <th className="text-center">السعر (دج)</th>
                <th className="text-center">الكمية</th>
                <th className="text-center">الحالة</th>
                <th className="text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((item, idx) => {
                  const Icon = CATEGORY_ICONS[item.main_type];
                  const { color, bg } = CATEGORY_COLORS[item.main_type];
                  const qty = item.stock?.quantity ?? 0;
                  const stockStatus = getStockStatus(qty);
                  const isEditingQty = qtyEdit?.id === item.id;

                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0`}>
                            <Icon size={17} />
                          </div>
                          <div>
                            <p className="font-black text-slate-800 dark:text-white text-sm">{item.sub_type}</p>
                            <p className="text-[11px] text-slate-400 font-bold">{item.unit}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center">
                        <Badge variant="normal" size="sm">{MAIN_TYPE_LABELS[item.main_type]}</Badge>
                      </td>
                      <td className="text-center font-bold text-slate-700 dark:text-slate-200">
                        {item.unit_price}
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {isManager && (
                            <button
                              onClick={() => handleQtyChange(item.id, -1, qty)}
                              className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/20 flex items-center justify-center transition-all"
                            >
                              <Minus size={13} />
                            </button>
                          )}
                          {isEditingQty && isManager ? (
                            <input
                              type="number"
                              value={qtyEdit?.val}
                              onChange={e => setQtyEdit({ id: item.id, val: e.target.value })}
                              onBlur={() => handleQtyDirect(item.id)}
                              onKeyDown={e => e.key === 'Enter' && handleQtyDirect(item.id)}
                              className="w-20 text-center form-input py-1 text-sm"
                              autoFocus
                            />
                          ) : (
                            <button
                              onClick={() => isManager && setQtyEdit({ id: item.id, val: String(qty) })}
                              className={`text-lg font-black w-20 text-center ${isManager ? 'hover:text-violet-600 cursor-pointer text-slate-900 dark:text-white transition-colors' : 'text-slate-900 dark:text-white cursor-default'}`}
                              title={isManager ? "انقر للتعديل المباشر" : ""}
                            >
                              {formatNumber(qty)}
                            </button>
                          )}
                          {isManager && (
                            <button
                              onClick={() => handleQtyChange(item.id, 1, qty)}
                              className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-emerald-100 hover:text-emerald-600 dark:hover:bg-emerald-900/20 flex items-center justify-center transition-all"
                            >
                              <Plus size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        <Badge
                          variant={stockStatus === 'low' ? 'low' : stockStatus === 'high' ? 'high' : 'normal'}
                          dot
                          size="sm"
                        >
                          {stockStatus === 'low' ? 'منخفض' : stockStatus === 'high' ? 'وافر' : 'طبيعي'}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex justify-center gap-1">
                          {isManager ? (
                            <>
                              <button
                                onClick={() => setSellTarget({ id: item.id, name: item.sub_type, unit_price: item.unit_price, maxQty: qty })}
                                className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all font-black flex items-center gap-1 text-xs"
                                title="بيع"
                                disabled={qty <= 0}
                              >
                                <ShoppingCart size={15} />
                                بيع
                              </button>
                              <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 self-center mx-1" />
                              <button
                                onClick={() => openEditModal(item)}
                                className="p-2 rounded-xl text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
                                title="تعديل"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => { setDeleteTarget(item.id); setDeleteTargetName(item.sub_type); }}
                                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                                title="حذف"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs font-bold text-slate-400">للقراءة فقط</span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-400 font-bold">{filtered.length} صنف</span>
            <span className="text-xs font-black text-slate-600 dark:text-slate-300">
              إجمالي الوحدات: {formatNumber(filtered.reduce((s,i) => s + (i.stock?.quantity ?? 0), 0))}
            </span>
          </div>
        </div>
      )}

      {/* ─── Modal الإضافة/التعديل ─── */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={editTargetId ? "تعديل الصنف" : "إضافة صنف جديد"} size="md">
        <div className="space-y-5">
          <Select
            label="النوع الرئيسي"
            value={form.main_type}
            onChange={e => f('main_type', e.target.value)}
          >
            {(Object.entries(MAIN_TYPE_LABELS) as [InventoryMainType, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>

          <Input
            label="اسم الصنف / المواصفة"
            placeholder="مثال: قارورة بلاستيك 250مل شفاف"
            value={form.sub_type}
            onChange={e => f('sub_type', e.target.value)}
            error={(errors as Record<string, string>).sub_type}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="الوحدة"
              placeholder="قطعة، لتر، كجم..."
              value={form.unit}
              onChange={e => f('unit', e.target.value)}
              error={(errors as Record<string, string>).unit}
            />
            <Input
              label="سعر الوحدة (دج)"
              type="number"
              min="0"
              value={String(form.unit_price)}
              onChange={e => f('unit_price', Number(e.target.value))}
            />
            <Input
              label="الكمية الابتدائية"
              type="number"
              min="0"
              value={String(form.initial_quantity)}
              onChange={e => f('initial_quantity', Number(e.target.value))}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button onClick={handleAdd} loading={saving} className="flex-1">{editTargetId ? 'حفظ التعديلات' : 'إضافة الصنف'}</Button>
            <Button variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1">إلغاء</Button>
          </div>
        </div>
      </Modal>

      {/* ─── حوار الحذف ─── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message={`هل أنت متأكد من حذف الصنف "${deleteTargetName}"؟`}
      />

      {/* ─── Modal البيع ─── */}
      <Modal isOpen={!!sellTarget} onClose={() => setSellTarget(null)} title="بيع مخزون" size="sm">
        {sellTarget && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="font-black text-slate-800 dark:text-white">{sellTarget.name}</p>
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-slate-500 dark:text-slate-400">سعر الوحدة:</span>
                <span className="font-bold text-violet-600">{sellTarget.unit_price} دج</span>
              </div>
              <div className="flex justify-between mt-1 text-sm">
                <span className="text-slate-500 dark:text-slate-400">الكمية المتاحة:</span>
                <span className="font-bold text-emerald-600">{sellTarget.maxQty}</span>
              </div>
            </div>
            
            <Input
              label="الكمية المراد بيعها"
              type="number"
              min="1"
              max={String(sellTarget.maxQty)}
              value={String(sellQty)}
              onChange={e => setSellQty(Number(e.target.value))}
            />

            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 flex justify-between items-center">
              <span className="font-bold text-emerald-700 dark:text-emerald-400">إجمالي السعر:</span>
              <span className="text-xl font-black text-emerald-600">
                {formatNumber(sellQty * sellTarget.unit_price)} دج
              </span>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSell} loading={selling} icon={<DollarSign size={16} />} className="flex-1 !bg-emerald-600 hover:!bg-emerald-700">تأكيد البيع</Button>
              <Button variant="secondary" onClick={() => setSellTarget(null)} className="flex-1">إلغاء</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
