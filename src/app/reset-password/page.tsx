'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle2, Package } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

function MansourLogo({ size = 64 }: { size?: number }) {
  return (
    <div className="relative flex items-center justify-center overflow-hidden rounded-[2rem] bg-white shadow-xl border border-white/20 p-2" style={{ width: size, height: size }}>
      <Image 
        src="/logo.png" 
        alt="Mansour Logo" 
        width={size} 
        height={size} 
        className="object-contain"
        priority
      />
    </div>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    setError(null);

    const { error: err } = await supabase.auth.updateUser({ password });

    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0f1e]">
      {/* ─── خلفية متحركة ─── */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, #2563eb44 0%, transparent 70%)' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md mx-4 relative z-10"
      >
        <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-blue-600/30 to-sky-600/20 blur-2xl" />

        <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl text-right" dir="rtl">
          
          <div className="flex flex-col items-center mb-8">
             <MansourLogo size={60} />
             <h1 className="text-2xl font-black text-white mt-4">تعيين كلمة مرور جديدة</h1>
          </div>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                <CheckCircle2 className="text-emerald-400 w-8 h-8" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">تم التغيير بنجاح!</h3>
              <p className="text-white/60 text-sm">سيتم توجيهك لصفحة الدخول خلال لحظات...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-black text-white/70">
                  كلمة المرور الجديدة
                </label>
                <div className="relative group">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    dir="ltr"
                    className="relative w-full px-4 py-3.5 pl-12 rounded-2xl bg-white/8 border border-white/10
                               text-white placeholder-white/25 font-bold text-sm outline-none
                               focus:border-blue-500/60 focus:bg-white/12
                               transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-black text-white/70">
                  تأكيد كلمة المرور
                </label>
                <div className="relative group">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    dir="ltr"
                    className="relative w-full px-4 py-3.5 pl-12 rounded-2xl bg-white/8 border border-white/10
                               text-white placeholder-white/25 font-bold text-sm outline-none
                               focus:border-blue-500/60 focus:bg-white/12
                               transition-all duration-300"
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" size={18} />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                className="relative w-full py-4 rounded-2xl font-black text-base text-white overflow-hidden
                           disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #1d4ed8 100%)',
                  boxShadow: '0 8px 32px rgba(37, 99, 235, 0.4)',
                }}
              >
                <span className="relative flex items-center justify-center gap-3">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'حفظ كلمة المرور'
                  )}
                </span>
              </motion.button>
            </form>
          )}

          <p className="text-center text-[10px] text-white/20 font-bold mt-8 flex items-center justify-center gap-2">
            <Package size={10} />
            مخزن منصور © {new Date().getFullYear()}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
