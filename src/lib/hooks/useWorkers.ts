'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Worker, WorkerFormData, AttendanceStatus } from '@/lib/types';
import { today } from '@/lib/utils';



export function useWorkers() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const todayStr = today();
      const { data, error: err } = await supabase
        .from('workers')
        .select(`
          *,
          attendance(date, status, note),
          worker_advances(*),
          worker_payments(*)
        `)
        .order('name');
      
      if (err) throw err;

      const mappedData: Worker[] = ((data as Record<string, unknown>[]) ?? []).map(w => ({
        ...(w as unknown as Worker),
        advances: (w as any).worker_advances || [],
        payments: (w as any).worker_payments || [],
        today_status: (w.attendance as { date: string; status: AttendanceStatus }[] | undefined)?.find(a => a.date === todayStr)?.status || null
      }));

      setWorkers(mappedData);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'فشل تحميل بيانات العمال');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWorkers(); }, [fetchWorkers]);

  const addWorker = async (data: WorkerFormData): Promise<boolean> => {
    try {
      const { error: err } = await supabase.from('workers').insert(data);
      if (err) throw err;
      await fetchWorkers();
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'فشل إضافة العامل');
      return false;
    }
  };

  const updateWorker = async (id: string, data: Partial<WorkerFormData>): Promise<boolean> => {
    try {
      const { error: err } = await supabase.from('workers').update(data).eq('id', id);
      if (err) throw err;
      await fetchWorkers();
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'فشل تعديل العامل');
      return false;
    }
  };

  const deleteWorker = async (id: string): Promise<boolean> => {
    try {
      const { error: err } = await supabase.from('workers').delete().eq('id', id);
      if (err) throw err;
      setWorkers(prev => prev.filter(w => w.id !== id));
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'فشل حذف العامل');
      return false;
    }
  };

  const updateAttendance = async (workerId: string, records: { date: string; status: AttendanceStatus; note?: string }[]): Promise<boolean> => {
    try {
      const payload = records.map(r => ({ worker_id: workerId, date: r.date, status: r.status, note: r.note || '' }));
      const { error: err } = await supabase.from('attendance').upsert(payload, { onConflict: 'worker_id, date' });
      if (err) throw err;
      await fetchWorkers();
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'فشل تحديث الحضور');
      return false;
    }
  };

  const addAdvance = async (workerId: string, amount: number, note?: string): Promise<boolean> => {
    try {
      const { error: err } = await supabase.from('worker_advances').insert({ worker_id: workerId, amount, note });
      if (err) throw err;
      await fetchWorkers();
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'فشل إضافة السلفة');
      return false;
    }
  };

  const addPayment = async (workerId: string, amount: number, month: string): Promise<boolean> => {
    try {
      const { error: err } = await supabase
        .from('worker_payments')
        .insert({ worker_id: workerId, amount, month });
      if (err) throw err;
      await fetchWorkers();
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'فشل تسجيل الدفع');
      return false;
    }
  };

  const presentCount = workers.filter(w => w.today_status === 'present').length;
  const absentCount  = workers.filter(w => w.today_status === 'absent').length;
  const lateCount    = workers.filter(w => w.today_status === 'late').length;

  return { workers, loading, error, fetchWorkers, addWorker, updateWorker, deleteWorker, updateAttendance, addAdvance, addPayment, presentCount, absentCount, lateCount };
}
