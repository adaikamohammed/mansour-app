'use client';

import { motion } from 'framer-motion';

interface StatusBadgeProps {
  status: 'present' | 'absent' | 'late' | 'low' | 'normal' | 'high';
  text: string;
}

const styles = {
  present: 'bg-emerald-100/50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  absent: 'bg-rose-100/50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
  late: 'bg-amber-100/50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  low: 'bg-orange-100/50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
  normal: 'bg-blue-100/50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
  high: 'bg-sky-100/50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20',
};

const StatusBadge = ({ status, text }: StatusBadgeProps) => {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black tracking-wide border transition-all ${styles[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-2 current-bg animate-pulse ${status === 'present' ? 'bg-emerald-500' : ''} ${status === 'absent' ? 'bg-rose-500' : ''} ${status === 'late' ? 'bg-amber-500' : ''}`} />
      {text}
    </motion.span>
  );
};

export default StatusBadge;

