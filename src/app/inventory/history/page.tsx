'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine, Calendar, Search, Filter } from 'lucide-react';
import Link from 'next/link';

// Helper for Arabic formatting natively
const formatArabicDate = (dateString: string) => {
  const d = new Date(dateString);
  return new Intl.DateTimeFormat('ar-DZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(d);
};

const formatTime = (dateString: string) => {
  const d = new Date(dateString);
  return new Intl.DateTimeFormat('ar-DZ', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(d);
};

export default function InventoryHistoryPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory_transactions')
        .select(`
          *,
          category:inventory_categories(main_type, sub_type, unit)
        `)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setTransactions(data);
      }
      setLoading(false);
    };

    fetchTransactions();
  }, []);

  const filtered = transactions.filter(tx => {
    const matchSearch = tx.category?.sub_type?.toLowerCase().includes(search.toLowerCase()) || 
                        tx.note?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || tx.type === filterType;
    return matchSearch && matchType;
  });

  const grouped = filtered.reduce((acc, tx) => {
    // Group by date using the native formatter
    const dateStr = formatArabicDate(tx.created_at);
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(tx);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card rounded-4xl p-6">
        <div>
          <Link href="/inventory" className="inline-flex items-center gap-2 text-slate-500 hover:text-violet-600 transition-colors mb-2 font-bold text-sm">
            <ArrowLeft size={16} />
            العودة للمخزن
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">سجل حركات المخزن</h1>
          <p className="text-slate-500 font-bold mt-1 text-sm">تتبع دقيق لعمليات الإدخال والاستخراج</p>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-2xl p-1 shadow-inner">
          <button 
            onClick={() => setFilterType('all')} 
            className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${filterType === 'all' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-800 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}
          >
            الكل
          </button>
          <button 
            onClick={() => setFilterType('in')} 
            className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${filterType === 'in' ? 'bg-emerald-500 shadow-sm text-white' : 'text-slate-400 hover:text-slate-600'}`}
          >
            إدخال
          </button>
          <button 
            onClick={() => setFilterType('out')} 
            className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${filterType === 'out' ? 'bg-rose-500 shadow-sm text-white' : 'text-slate-400 hover:text-slate-600'}`}
          >
            استخراج
          </button>
        </div>
      </div>

      {/* ─── Search Bar ─── */}
      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="ابحث عن صنف أو ملاحظة..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="form-input w-full pr-12 shadow-sm"
        />
      </div>

      {/* ─── Timeline ─── */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 skeleton rounded-3xl" />)}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 glass-card rounded-4xl">
          <Filter size={48} className="mb-4 opacity-30" />
          <p className="text-lg font-black text-slate-500">لا يوجد حركات مطابقة</p>
        </div>
      ) : (
        <div className="space-y-8 pb-10">
          <AnimatePresence>
            {Object.entries(grouped).map(([dateLabel, dayTrans], idx) => (
              <motion.div 
                key={dateLabel}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="flex items-center gap-3 mb-4 px-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center shrink-0">
                    <Calendar size={14} />
                  </div>
                  <h3 className="font-black text-slate-700 dark:text-slate-300 text-sm">{dateLabel}</h3>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800 ml-4 hidden sm:block" />
                </div>
                
                <div className="space-y-3">
                  {dayTrans.map((tx: any) => {
                    const isIn = tx.type === 'in';
                    const timeStr = formatTime(tx.created_at);
                    
                    return (
                      <div key={tx.id} className="glass-card rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center hover:shadow-md transition-shadow group border-r-4 border-transparent hover:border-violet-500">
                        {/* أيقونة الحالة */}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${isIn ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600'}`}>
                          {isIn ? <ArrowDownToLine size={20} /> : <ArrowUpFromLine size={20} />}
                        </div>

                        {/* تفاصيل الحركة */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-black text-slate-800 dark:text-white truncate">{tx.category?.sub_type || 'صنف غير معروف (محذوف)'}</p>
                            {tx.category?.unit && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                                {tx.category.unit}
                              </span>
                            )}
                          </div>
                          
                          {tx.note && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mb-1">
                              ملاحظة: {tx.note}
                            </p>
                          )}
                          
                          <div className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                            <span>{timeStr}</span>
                            {tx.previous_quantity !== null && tx.new_quantity !== null && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                <span>تغير الرصيد من {tx.previous_quantity} إلى {tx.new_quantity}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* الكمية */}
                        <div className={`shrink-0 flex items-center justify-center px-5 py-3 rounded-2xl font-black text-xl border ${isIn ? 'bg-emerald-50/50 border-emerald-100 text-emerald-600 dark:bg-emerald-900/10 dark:border-emerald-800/30' : 'bg-rose-50/50 border-rose-100 text-rose-600 dark:bg-rose-900/10 dark:border-rose-800/30'}`}>
                          {isIn ? '+' : '-'}{tx.quantity}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
