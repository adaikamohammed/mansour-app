'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
  success: () => {},
  error: () => {},
  warning: () => {},
});

export const useToast = () => useContext(ToastContext);

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={18} />,
  error:   <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info:    <Info size={18} />,
};

const styles: Record<ToastType, string> = {
  success: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  error:   'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  warning: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  info:    'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info', duration = 3500) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message, duration }]);
    setTimeout(() => remove(id), duration);
  }, [remove]);

  const success = useCallback((msg: string) => toast(msg, 'success'), [toast]);
  const error   = useCallback((msg: string) => toast(msg, 'error', 5000), [toast]);
  const warning = useCallback((msg: string) => toast(msg, 'warning'), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning }}>
      {children}

      {/* حاوية الـ Toasts */}
      <div className="fixed bottom-6 left-6 z-[200] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-lg backdrop-blur-md font-bold text-sm ${styles[t.type]}`}
            >
              <span className="mt-0.5 shrink-0">{icons[t.type]}</span>
              <span className="flex-1 leading-relaxed">{t.message}</span>
              <button
                onClick={() => remove(t.id)}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity mt-0.5"
                aria-label="إغلاق"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
