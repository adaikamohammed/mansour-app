'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.replace(/\s+/g, '-') ?? Math.random().toString(36).slice(2);

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'form-input',
              icon && 'pr-11',
              error && 'border-rose-400 focus:border-rose-400 focus:ring-rose-100',
              className,
            )}
            {...props}
          />
        </div>
        {hint && !error && (
          <p className="text-[11px] text-slate-400 font-medium px-1">{hint}</p>
        )}
        {error && (
          <p className="text-[11px] text-rose-500 font-bold px-1 flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;

// ─────────────────────────────────────────────
// Select
// ─────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, children, className, id, ...props }, ref) => {
    const inputId = id ?? label?.replace(/\s+/g, '-') ?? Math.random().toString(36).slice(2);

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            'form-input appearance-none cursor-pointer',
            error && 'border-rose-400',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p className="text-[11px] text-rose-500 font-bold px-1">⚠ {error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

// ─────────────────────────────────────────────
// Textarea
// ─────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.replace(/\s+/g, '-') ?? Math.random().toString(36).slice(2);

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={3}
          className={cn(
            'form-input resize-none',
            error && 'border-rose-400',
            className,
          )}
          {...props}
        />
        {error && (
          <p className="text-[11px] text-rose-500 font-bold px-1">⚠ {error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
