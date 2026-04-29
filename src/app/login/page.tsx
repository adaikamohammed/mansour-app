'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Eye, EyeOff, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';

/* ─── لوغو مخزن منصور (SVG مدمج) ─── */
function MansourLogo({ size = 64 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="purpleGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* خلفية مستديرة الزوايا */}
      <rect width="64" height="64" rx="16" fill="url(#bgGrad)" />

      {/* مبنى المخزن — الجدران */}
      <rect x="12" y="32" width="40" height="20" rx="2" fill="url(#purpleGrad)" opacity="0.9" />

      {/* سقف مثلث */}
      <path d="M8 33 L32 16 L56 33 Z" fill="url(#goldGrad)" filter="url(#glow)" />

      {/* باب المخزن */}
      <rect x="26" y="40" width="12" height="12" rx="2" fill="#0f172a" opacity="0.7" />
      <rect x="31" y="40" width="1.5" height="12" fill="#fbbf24" opacity="0.5" />

      {/* نوافذ جانبية */}
      <rect x="15" y="37" width="7" height="6" rx="1.5" fill="#fbbf24" opacity="0.25" />
      <rect x="42" y="37" width="7" height="6" rx="1.5" fill="#fbbf24" opacity="0.25" />

      {/* نجمة / زخرفة في القمة */}
      <circle cx="32" cy="16" r="3" fill="#fbbf24" filter="url(#glow)" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: err } = await supabase.auth.signInWithPassword({ email, password });

    if (err) {
      setError('بريد إلكتروني أو كلمة مرور غير صحيحة');
      setLoading(false);
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0f1e]">

      {/* ─── خلفية متحركة ─── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* دوائر ضوئية متحركة */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, #7c3aed55 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, #4f46e555 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.15, 0.08] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full"
          style={{ background: 'radial-gradient(circle, #fbbf2430 0%, transparent 70%)' }}
        />

        {/* شبكة نقاط خفية */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* ─── البطاقة الرئيسية ─── */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md mx-4 relative z-10"
      >
        {/* توهج خلف البطاقة */}
        <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-violet-600/30 to-indigo-600/20 blur-2xl" />

        <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl">

          {/* ─── قسم اللوغو والعنوان ─── */}
          <div className="flex flex-col items-center mb-10">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5, type: 'spring', bounce: 0.4 }}
              className="mb-5 relative"
            >
              {/* توهج حول اللوغو */}
              <div className="absolute inset-0 rounded-2xl bg-amber-400/20 blur-xl scale-150" />
              <div className="relative">
                <MansourLogo size={80} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <h1 className="text-3xl font-black text-white tracking-tight mb-1">
                مخزن منصور
              </h1>
              <div className="flex items-center justify-center gap-2 mt-1">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-400/60" />
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest">
                  نظام الإدارة المتكامل
                </p>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-400/60" />
              </div>
            </motion.div>
          </div>

          {/* ─── نموذج الدخول ─── */}
          <motion.form
            onSubmit={handleLogin}
            className="space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >

            {/* البريد الإلكتروني */}
            <div className="space-y-2">
              <label className="block text-sm font-black text-white/70">
                البريد الإلكتروني
              </label>
              <div className="relative group">
                <div className="absolute inset-0 rounded-2xl bg-violet-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity blur" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                  dir="ltr"
                  aria-label="البريد الإلكتروني"
                  className="relative w-full px-4 py-3.5 rounded-2xl bg-white/8 border border-white/10
                             text-white placeholder-white/25 font-bold text-sm outline-none
                             focus:border-violet-500/60 focus:bg-white/12
                             transition-all duration-300"
                />
              </div>
            </div>

            {/* كلمة المرور */}
            <div className="space-y-2">
              <label className="block text-sm font-black text-white/70">
                كلمة المرور
              </label>
              <div className="relative group">
                <div className="absolute inset-0 rounded-2xl bg-violet-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity blur" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  dir="ltr"
                  aria-label="كلمة المرور"
                  className="relative w-full px-4 py-3.5 pl-12 rounded-2xl bg-white/8 border border-white/10
                             text-white placeholder-white/25 font-bold text-sm outline-none
                             focus:border-violet-500/60 focus:bg-white/12
                             transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                  aria-label={showPass ? 'إخفاء' : 'إظهار'}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* رسالة الخطأ */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-bold"
                >
                  <span className="text-lg">⚠️</span>
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* زر الدخول */}
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="relative w-full py-4 rounded-2xl font-black text-base text-white overflow-hidden
                         disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #6d28d9 100%)',
                boxShadow: '0 8px 32px rgba(124, 58, 237, 0.4)',
              }}
            >
              {/* تأثير لمعة عند الـ hover */}
              <div className="absolute inset-0 bg-white/0 hover:bg-white/10 transition-colors duration-300" />

              <span className="relative flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جارٍ التحقق...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={20} />
                    <span>تسجيل الدخول</span>
                  </>
                )}
              </span>
            </motion.button>
          </motion.form>

          {/* ─── تذييل البطاقة ─── */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-xs text-white/20 font-bold mt-8 flex items-center justify-center gap-2"
          >
            <Package size={12} className="text-amber-400/50" />
            مخزن منصور © {new Date().getFullYear()}
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
