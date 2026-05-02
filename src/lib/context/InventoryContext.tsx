'use client';

/**
 * InventoryContext — سياق مشترك للمخزون
 * يضمن أن Supabase يُستعلم مرة واحدة فقط في التطبيق كله
 * بدلاً من استدعاء useInventory() مرتين (Sidebar + Topbar)
 */

import { createContext, useContext, type ReactNode } from 'react';
import { useInventory } from '@/lib/hooks/useInventory';

type InventoryContextType = ReturnType<typeof useInventory>;

const InventoryContext = createContext<InventoryContextType | null>(null);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const value = useInventory();
  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventoryCtx(): InventoryContextType {
  const ctx = useContext(InventoryContext);
  if (!ctx) {
    throw new Error('useInventoryCtx must be used inside <InventoryProvider>');
  }
  return ctx;
}
