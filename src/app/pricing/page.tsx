'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Code2,
  Clock,
  ShieldCheck,
  LayoutDashboard,
  Users,
  Package,
  TrendingUp,
  CreditCard,
  Settings,
  Shield,
  LifeBuoy,
  Rocket
} from 'lucide-react';

const features = [
  {
    icon: LayoutDashboard,
    title: 'لوحة تحكم احترافية',
    desc: 'متابعة شاملة لجميع أنشطة المخزن والعمال من مكان واحد بشكل لحظي ومتجاوب مع جميع الأجهزة.',
  },
  {
    icon: Package,
    title: 'نظام إدارة المتجر والمخزون',
    desc: 'تتبع المنتجات، الكميات، التنبيهات عند نقص المخزون، وحركات الصادر والوارد بدقة متناهية.',
  },
  {
    icon: Users,
    title: 'إدارة العمال والحضور',
    desc: 'سجلات كاملة لكل عامل، تتبع الحضور والانصراف السريع، والمهام الموكلة لضمان سير العمل.',
  },
  {
    icon: TrendingUp,
    title: 'تقارير مالية وتحليلية',
    desc: 'إحصائيات دقيقة للإيرادات، والمصروفات بكل سهولة، للمساعدة في اتخاذ القرارات الصحيحة.',
  },
  {
    icon: Shield,
    title: 'أمان عالي وخصوصية تامة',
    desc: 'نظام تسجيل دخول مشفر وآمن بحساب واحد مخصص لمدير المخزن لضمان سرية البيانات الكاملة.',
  },
  {
    icon: Settings,
    title: 'مخصص بالكامل لاحتياجك',
    desc: 'تم بناء النظام خصيصاً ليطابق طريقة عملك، دون أي خيارات مبهمة أو تعقيدات لا تحتاجها.',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-[calc(100vh-3rem)] text-slate-900 dark:text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-16">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black tracking-tight text-violet-600 dark:text-violet-400"
          >
            نظام الإدارة الرقمية الشامل لمخزنك
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            نظام متكامل، سريع، ومحمي. صُمم خصيصاً ليناسب احتياجك بدقة، ليوفر عليك الجهد والوقت دون أي تعقيدات.
          </motion.p>
        </div>

        {/* The Effort & Behind the Scenes */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-10 shadow-xl shadow-slate-200/40 dark:shadow-slate-900/40 border border-slate-200 dark:border-slate-800"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">لماذا هذا النظام استثنائي؟</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-justify">
                هذا النظام ليس مجرد برنامج جاهز تم التعديل عليه، بل هو منصة متطورة تم برمجتها من الصفر. تطلب هذا العمل <strong>أكثر من أسبوعين من العمل المتواصل</strong> لبرمجة القواعد، وتصميم الواجهات الجذابة والسريعة لضمان أفضل نتيجة لك.
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <div className="bg-violet-100 dark:bg-violet-900/30 p-2 rounded-lg text-violet-600 dark:text-violet-400">
                    <Code2 size={20} />
                  </div>
                  <div>
                    <span className="font-bold block">مخصص لك بالضبط</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">لا يحتوي على إضافات مزعجة، بل مبني على ما طلبته وتحتاجه فقط.</span>
                  </div>
                </li>
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg text-amber-600 dark:text-amber-400">
                    <Clock size={20} />
                  </div>
                  <div>
                    <span className="font-bold block">+100 ساعة عمل برمجية</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">أكثر من 5,000 سطر لتشغيل النظام بأفضل سرعة وأمان.</span>
                  </div>
                </li>
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                    <LifeBuoy size={20} />
                  </div>
                  <div>
                    <span className="font-bold block">ضمان شهر للتعديلات الطفيفة</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">إمكانية إجراء تعديلات طفيفة مجاناً خلال الشهر الأول ليتناسب النظام تماماً مع سير عملك.</span>
                  </div>
                </li>
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <div className="bg-rose-100 dark:bg-rose-900/30 p-2 rounded-lg text-rose-600 dark:text-rose-400">
                    <Rocket size={20} />
                  </div>
                  <div>
                    <span className="font-bold block">تسليم فوري (عكس السوق)</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">برمجة أنظمة مخصصة في أماكن أخرى تأخذ شهوراً وبأسعار مضاعفة، أو يتم إعطاؤك أنظمة جاهزة غير قابلة للتعديل.</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl p-8 text-white space-y-6 shadow-lg shadow-violet-500/20 relative overflow-hidden">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              
              <h3 className="text-xl font-bold flex items-center gap-2">
                <CreditCard size={24} /> مبلغ رمزي (الدفع لمرة واحدة)
              </h3>
              
              <div className="text-5xl font-black">
                20,000 <span className="text-2xl font-normal opacity-80">د.ج</span>
              </div>
              
              <div className="space-y-3 pt-2">
                <p className="opacity-95 leading-relaxed text-sm bg-white/10 p-3 rounded-lg border border-white/20">
                  <strong>مقارنة بالسوق:</strong> التطبيقات والبرامج الإدارية المشابهة التي تُباع بملكية لمرة واحدة تتجاوز تكلفتها عادةً (40,000 إلى 50,000 د.ج). بينما عرضنا هو <strong>مبلغ رمزي جداً</strong> نظير الجهد البرمجي المبذول لإنتاج نظام يطابق متطلباتك بالضبط.
                </p>
                <div className="flex items-center gap-2 text-sm text-emerald-100 font-bold">
                  <CheckCircle2 size={16} /> لا توجد أي اشتراكات أو رسوم إضافية مخفية.
                </div>
              </div>
            </div>
            
          </div>
        </motion.div>

        {/* Features Box */}
        <div className="space-y-8 pt-4">
          <h2 className="text-2xl md:text-3xl font-black text-center text-slate-800 dark:text-slate-200">
            كل ما تحتاجه في لوحة واحدة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + (idx * 0.1) }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-xl hover:border-violet-500/50 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon size={26} />
                </div>
                <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-slate-200">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Final Conclusion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center space-y-6 pt-10 pb-8"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full font-bold text-sm border border-indigo-200 dark:border-indigo-800/50">
            <CheckCircle2 size={18} />
            جاهز للاستخدام الفوري لمدير المخزن
          </div>
          
          <div className="max-w-2xl mx-auto space-y-2 mt-6">
            <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2">
              <ShieldCheck size={20} className="text-rose-500" />
              تنويه هام بشأن التسعير
            </h4>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
              مبلغ البرنامج (20,000 د.ج) هو سعر استثنائي ومخفض أصلاً تقديراً لتعاملاتنا وللجهد البرمجي الكبير (100+ ساعة) المبذول لتخصيص هذا النظام بناءً على طلبكم. لذلك، فإن <strong className="text-rose-600 dark:text-rose-400">هذا السعر نِهائِي وغَير قابل للتفاوض إطلاقاً</strong>.
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
