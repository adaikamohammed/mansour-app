'use client';

import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'present' | 'absent' | 'late' | 'low' | 'normal' | 'high' | 'default';
  size?: 'sm' | 'md';
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<string, string> = {
  present: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  absent:  'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  late:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  low:     'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  normal:  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  high:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  default: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const dotColors: Record<string, string> = {
  present: 'bg-emerald-500',
  absent:  'bg-rose-500',
  late:    'bg-amber-500',
  low:     'bg-rose-500',
  normal:  'bg-slate-400',
  high:    'bg-emerald-500',
  default: 'bg-blue-500',
};

export default function Badge({ variant = 'default', size = 'md', dot = false, children, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 font-black rounded-full',
      size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
      variantClasses[variant],
      className,
    )}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
}
