-- 1. تحديث جدول أصناف المخزن لإضافة حد التنبيه المخصص
ALTER TABLE inventory_categories 
ADD COLUMN min_stock_level NUMERIC DEFAULT 50;

-- 2. إنشاء جدول السلفيات للعمال
CREATE TABLE worker_advances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. تحديث جدول العمال لإضافة الرصيد الافتتاحي أو مستحقات سابقة (اختياري لكن مفيد للمالية)
ALTER TABLE workers
ADD COLUMN base_salary NUMERIC DEFAULT 0; -- في حال كان هناك راتب ثابت بدلاً من الأجر اليومي فقط (احتياطي)

-- 4. إنشاء جدول المدفوعات (لتصفية الرواتب)
CREATE TABLE IF NOT EXISTS worker_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  month VARCHAR(7) NOT NULL, -- صيغة YYYY-MM
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- تحديث الصلاحيات للمدفوعات
ALTER TABLE worker_payments DISABLE ROW LEVEL SECURITY;
NOTIFY pgrst, 'reload schema';
