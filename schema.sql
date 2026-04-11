-- SQL Script for Alpha Storage & HR System
-- Run this in the Supabase SQL Editor

-- 1. Workers Table (العمال)
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  join_date DATE DEFAULT CURRENT_DATE,
  photo_url TEXT,
  daily_rate NUMERIC DEFAULT 0,
  discount_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Attendance Table (الحضور)
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  status TEXT CHECK (status IN ('present', 'absent', 'late')),
  reason TEXT,
  note TEXT,
  discount_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Inventory Categories (أصناف المخزن)
CREATE TABLE inventory_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  main_type TEXT NOT NULL CHECK (main_type IN ('carton', 'bottle', 'cap', 'material')),
  sub_type TEXT NOT NULL, -- e.g., "Soap", "Perfume"
  unit TEXT DEFAULT 'piece',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Inventory Stock (مخزون)
CREATE TABLE inventory_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES inventory_categories(id) ON DELETE CASCADE,
  quantity NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Inventory Transactions (سجل حركة المخزن)
CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES inventory_categories(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  quantity NUMERIC NOT NULL,
  previous_quantity NUMERIC,
  new_quantity NUMERIC,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tasks Table (المهام)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
