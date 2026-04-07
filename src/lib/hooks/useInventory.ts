'use client';

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { InventoryCategory, InventoryFormData } from '@/lib/types';
import { today } from '@/lib/utils';



export function useInventory() {
  const [items, setItems] = useState<InventoryCategory[]>([]);
  const [sales, setSales] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('inventory_categories')
        .select('*, inventory_stock(*)')
        .order('main_type');
      if (err) throw err;
      setItems(data ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'فشل تحميل المخزون');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const addCategory = async (data: InventoryFormData): Promise<boolean> => {
    try {
      const { data: cat, error: err1 } = await supabase
        .from('inventory_categories')
        .insert({ main_type: data.main_type, sub_type: data.sub_type, unit: data.unit, unit_price: data.unit_price })
        .select()
        .single();
      if (err1) throw err1;
      const { error: err2 } = await supabase
        .from('inventory_stock')
        .insert({ category_id: cat.id, quantity: data.initial_quantity });
      if (err2) throw err2;
      await fetchItems();
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'فشل إضافة الصنف');
      return false;
    }
  };

  const updateCategory = async (id: string, updates: Partial<InventoryFormData>): Promise<boolean> => {
    try {
      // TODO: Supabase logic for actual editing
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'فشل تعديل الصنف');
      return false;
    }
  };

  const updateQuantity = async (categoryId: string, newQty: number): Promise<boolean> => {
    try {
      const { error: err } = await supabase
        .from('inventory_stock')
        .update({ quantity: newQty, updated_at: new Date().toISOString() })
        .eq('category_id', categoryId);
      if (err) throw err;
      await fetchItems();
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'فشل تحديث الكمية');
      return false;
    }
  };

  const addStock = async (categoryId: string, quantity: number, type: 'in' | 'out', note: string): Promise<boolean> => {
    try {
      // TODO: Supabase sales insert
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'فشل عملية البيع');
      return false;
    }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    try {
      const { error: err } = await supabase.from('inventory_categories').delete().eq('id', id);
      if (err) throw err;
      await fetchItems();
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'فشل حذف الصنف');
      return false;
    }
  };

  const totalItems = items.reduce((sum, i) => sum + (i.stock?.quantity ?? 0), 0);
  const lowStockItems = items.filter(i => (i.stock?.quantity ?? 0) <= 50);

  return { 
    items, 
    sales, 
    loading, 
    error, 
    fetchItems, 
    addCategory, 
    updateCategory, 
    addStock, 
    updateQuantity, 
    deleteCategory, 
    // التوافق مع الكود القديم (Aliases)
    addItem: addCategory,
    editItem: updateCategory,
    sellItem: (catId: string, qty: number) => addStock(catId, qty, 'out', 'عملية بيع'),
    deleteItem: deleteCategory,
    totalItems, 
    lowStockItems 
  };
}
