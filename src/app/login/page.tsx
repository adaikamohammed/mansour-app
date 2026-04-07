'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogIn, Eye, EyeOff, BoxesIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: err } = await supabase.auth.signInWithPassword({ email, password });

    if (err) {
      setError('بريد إلكتروني أو كلمة مرور غير صحيحة');
      setLoading(false);
    } else {
      router.replace('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-violet-50/30 to-indigo-50/30 dark:from-slate-950 dark:via-violet-950/20 dark:to-slate-950 p-4">

      {/* خلفية زخرفية */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-violet-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md relative"
      >
        {/* بطاقة تسجيل الدخول */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-4xl p-8 shadow-2xl border border-white/60 dark:border-slate-800/60">

          {/* الشعار */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/30 mb-4">
              <BoxesIcon className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              مخزن منصور
            </h1>
            <p className="text-sm text-slate-400 font-medium mt-1">
              سجّل دخولك للمتابعة
            </p>
          </div>

          {/* النموذج */}
          <form onSubmit={handleLogin} className="space-y-4">

            {/* البريد الإلكتروني */}
            <div>
              <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                dir="ltr"
                className="form-input w-full"
                aria-label="البريد الإلكتروني"
              />
            </div>

            {/* كلمة المرور */}
            <div>
              <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  dir="ltr"
                  className="form-input w-full pl-12"
                  aria-label="كلمة المرور"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  aria-label={showPass ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* رسالة الخطأ */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm font-bold text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-4 py-3 rounded-2xl border border-rose-100 dark:border-rose-900/30"
              >
                <span>⚠</span>
                <span>{error}</span>
              </motion.div>
            )}

            {/* زر الدخول */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3.5 text-base flex items-center justify-center gap-3 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={20} />
                  <span>تسجيل الدخول</span>
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
