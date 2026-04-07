'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
          />

          {/* المحتوى */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={`relative z-10 w-full ${sizeClasses[size]} glass-card rounded-4xl border border-white/30 dark:border-slate-700/50 shadow-2xl overflow-hidden`}
          >
            {/* رأس النافذة */}
            <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">{title}</h2>
              <button
                onClick={onClose}
                aria-label="إغلاق"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* الجسم */}
            <div className="px-8 pb-8 pt-6 max-h-[80vh] overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
