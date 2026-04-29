// ============================================
// أنواع TypeScript لجميع جداول قاعدة البيانات
// ============================================

export type AttendanceStatus = 'present' | 'absent' | 'late';
export type InventoryMainType = 'carton' | 'bottle' | 'cap' | 'material';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface WorkerAdvance {
  id: string;
  worker_id: string;
  amount: number;
  date: string;
  note?: string;
  created_at: string;
}

export interface Worker {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  join_date: string;
  daily_rate: number;
  discount_rate: number;
  photo_url?: string;
  attendance?: Attendance[];
  advances?: WorkerAdvance[];
  today_status?: AttendanceStatus | null;
}

export interface Attendance {
  id: string;
  worker_id: string;
  date: string;
  status: AttendanceStatus;
  reason: string | null;
  note: string | null;
  discount_amount: number;
  created_at: string;
  // join مع workers
  worker?: Pick<Worker, 'id' | 'name' | 'photo_url' | 'daily_rate'>;
}

export interface InventoryCategory {
  id: string;
  main_type: InventoryMainType;
  sub_type: string;
  unit: string;
  min_stock_level?: number;
  created_at: string;
  // join مع inventory_stock
  stock?: InventoryStock;
}

export interface InventoryStock {
  id: string;
  category_id: string;
  quantity: number;
  updated_at: string;
}

export type InventoryTransactionType = 'in' | 'out';

export interface InventoryTransaction {
  id: string;
  category_id: string;
  type: InventoryTransactionType;
  quantity: number;
  previous_quantity: number | null;
  new_quantity: number | null;
  note: string | null;
  created_at: string;
  // join مع inventory_categories
  category?: Pick<InventoryCategory, 'id' | 'main_type' | 'sub_type' | 'unit'>;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  priority: TaskPriority;
  is_completed: boolean;
  created_at: string;
}

export interface SaleRecord {
  id: string;
  inventory_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  date: string;
}

// ============================================
// أنواع النماذج (Forms)
// ============================================

export type WorkerFormData = {
  name: string;
  phone: string;
  address: string;
  join_date: string;
  daily_rate: number;
  photo_url?: string;
};

export type AttendanceFormData = {
  worker_id: string;
  date: string;
  status: AttendanceStatus;
  reason?: string;
  note?: string;
  discount_amount: number;
};

export type InventoryFormData = {
  main_type: InventoryMainType;
  sub_type: string;
  unit: string;
  initial_quantity: number;
  min_stock_level: number;
};

export type TaskFormData = {
  title: string;
  description?: string;
  target_date?: string;
  priority: TaskPriority;
  is_completed?: boolean;
};

// ============================================
// أنواع مساعدة
// ============================================

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  presentRate: number;
}

export interface DailyAttendanceRecord {
  workerId: string;
  status: AttendanceStatus;
  reason?: string;
  note?: string;
}

export const MAIN_TYPE_LABELS: Record<InventoryMainType, string> = {
  carton: 'كرطون',
  bottle: 'قارورات',
  cap: 'أغطية',
  material: 'مواد أولية',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: 'عالية',
  medium: 'متوسطة',
  low: 'منخفضة',
};

export const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'حاضر',
  absent: 'غائب',
  late: 'متأخر',
};
