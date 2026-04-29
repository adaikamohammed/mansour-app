'use client';

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Task, TaskFormData } from '@/lib/types';




export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      if (err) throw err;
      setTasks(data ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'فشل تحميل المهام');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const addTask = async (data: TaskFormData): Promise<boolean> => {
    try {
      const { error: err } = await supabase.from('tasks').insert(data);
      if (err) throw err;
      await fetchTasks();
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'فشل إضافة المهمة');
      return false;
    }
  };

  const updateTask = async (id: string, data: Partial<TaskFormData>): Promise<boolean> => {
    try {
      const { error: err } = await supabase.from('tasks').update(data).eq('id', id);
      if (err) throw err;
      await fetchTasks();
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'فشل تعديل المهمة');
      return false;
    }
  };

  const deleteTask = async (id: string): Promise<boolean> => {
    try {
      const { error: err } = await supabase.from('tasks').delete().eq('id', id);
      if (err) throw err;
      setTasks(prev => prev.filter(t => t.id !== id));
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'فشل حذف المهمة');
      return false;
    }
  };

  const toggleComplete = async (id: string): Promise<void> => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    await updateTask(id, { is_completed: !task.is_completed });
  };

  const pendingCount   = tasks.filter(t => !t.is_completed).length;
  const completedCount = tasks.filter(t => t.is_completed).length;
  const highCount      = tasks.filter(t => !t.is_completed && t.priority === 'high').length;

  return { tasks, loading, error, fetchTasks, addTask, updateTask, deleteTask, toggleComplete, pendingCount, completedCount, highCount };
}
