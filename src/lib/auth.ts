'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export type UserRole = 'manager' | 'admin' | null;

export interface AuthState {
  user: User | null;
  role: UserRole;
  loading: boolean;
}

export function useAuth(): AuthState & { signOut: () => Promise<void> } {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // جلب الجلسة الحالية
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setRole((session?.user?.user_metadata?.role as UserRole) ?? null);
      setLoading(false);
    });

    // الاستماع لتغييرات الجلسة
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setRole((session?.user?.user_metadata?.role as UserRole) ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      window.location.href = '/login';
    }
  };

  return { user, role, loading, signOut };
}

// هل يمكنه التعديل؟ (مدير المخزن فقط)
export function canEdit(role: UserRole): boolean {
  return role === 'manager';
}
