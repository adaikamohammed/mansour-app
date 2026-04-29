'use client';

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { InventoryCategory, InventoryFormData } from '@/lib/types';




export function useInventory() {
  const [items, setItems] = useState<InventoryCategory[]>([]);
  const [forecasts, setForecasts] = useState<Record<string, number>>({});

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
      const itemsData = (data ?? []).map((item: any) => ({
        ...item,
        stock: Array.isArray(item.inventory_stock) ? item.inventory_stock[0] : item.inventory_stock
      }));
      setItems(itemsData);

      // التنبؤ الذكي بالاستهلاك (آخر 14 يوم)
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      const { data: txData, error: txErr } = await supabase
        .from('inventory_transactions')
        .select('category_id, quantity')
        .eq('type', 'out')
        .gte('created_at', fourteenDaysAgo.toISOString());
        
      if (!txErr && txData) {
        const consumption: Record<string, number> = {};
        txData.forEach(tx => {
          consumption[tx.category_id] = (consumption[tx.category_id] || 0) + Number(tx.quantity);
        });
        
        const newForecasts: Record<string, number> = {};
        itemsData.forEach((item: any) => {
          const totalConsumed = consumption[item.id] || 0;
          const dailyAvg = totalConsumed / 14;
          const currentStock = item.stock?.quantity ?? 0;
          if (dailyAvg > 0 && currentStock > 0) {
            newForecasts[item.id] = Math.ceil(currentStock / dailyAvg); // الأيام المتبقية
          } else if (currentStock <= 0) {
            newForecasts[item.id] = 0;
          }
        });
        setForecasts(newForecasts);
      }
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
        .insert({ main_type: data.main_type, sub_type: data.sub_type, unit: data.unit, min_stock_level: data.min_stock_level || 50 })
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
      const { error: err } = await supabase
        .from('inventory_categories')
        .update({
          main_type: updates.main_type,
          sub_type: updates.sub_type,
          unit: updates.unit,
          min_stock_level: updates.min_stock_level
        })
        .eq('id', id);
      if (err) throw err;
      await fetchItems();
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

  const recordTransaction = async (categoryId: string, currentQty: number, quantity: number, type: 'in' | 'out', note?: string): Promise<boolean> => {
    try {
      const newQty = type === 'in' ? currentQty + quantity : currentQty - quantity;
      if (newQty < 0) throw new Error('الكمية الحالية لا تكفي لإتمام عملية الاستخراج');

      // Update or Insert stock if missing
      const { data: existingStock } = await supabase
        .from('inventory_stock')
        .select('id')
        .eq('category_id', categoryId)
        .maybeSingle();

      if (existingStock) {
        const { error: err1 } = await supabase
          .from('inventory_stock')
          .update({ quantity: newQty, updated_at: new Date().toISOString() })
          .eq('category_id', categoryId);
        if (err1) throw err1;
      } else {
        const { error: err1 } = await supabase
          .from('inventory_stock')
          .insert({ category_id: categoryId, quantity: newQty });
        if (err1) throw err1;
      }

      // Insert transaction history
      const { error: err2 } = await supabase
        .from('inventory_transactions')
        .insert({
          category_id: categoryId,
          type,
          quantity,
          previous_quantity: currentQty,
          new_quantity: newQty,
          note: note || null
        });
      if (err2) throw err2;

      await fetchItems();
      return true;
    } catch (e: any) {
      console.error('recordTransaction error details:', JSON.stringify(e, null, 2), e);
      setError(e?.message || 'فشل تسجيل العملية');
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
  const lowStockItems = items.filter(i => (i.stock?.quantity ?? 0) <= (i.min_stock_level ?? 50));

  return { 
    items, 
    loading, 
    error, 
    fetchItems, 
    addCategory, 
    updateCategory, 
    recordTransaction, 
    updateQuantity, 
    deleteCategory, 
    // التوافق مع الكود القديم (Aliases)
    addItem: addCategory,
    editItem: updateCategory,
    deleteItem: deleteCategory,
    totalItems, 
    lowStockItems,
    forecasts
  };
}
