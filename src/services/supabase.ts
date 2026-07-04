/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://evrqxgnqwngokukqerps.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Types
export interface User {
  id: string;
  username: string;
  email: string | null;
  phone: string;
  role: 'rep' | 'admin';
  approved: boolean;
  parent_id: string | null;
  created_at: string;
}

export interface Shipment {
  id?: number;
  m: string; // id or serial
  'اسم العميل': string;
  'العنوان': string;
  'الزون': string;
  'المنتج': string;
  'الهاتف': string;
  'هاتف بديل': string;
  'المبلغ': number;
  'الراسل': string;
  'كود الشحنة': string;
  'المندوب': string;
  'الحالة': string;
  'سبب الحالة': string | null;
  'السعر بعد التعديل': number | null;
  'ملاحظات': string | null;
  'تاريخ التحديث': string | null;
  'الصافي': number | null;
  'الشحن': number | null;
  'عدد': number | null;
  'تقفيل': string | null;
  'عمولة المندوب': number | null;
  'اسم الموظف'?: string | null;
  'الموظف'?: string | null;
  'حدث': string | null;
  'اليومية': string | null;
  'نوع المندوب': string | null;
  'ارشيف': boolean | null | string;
  'المندوب الفرعي': string | null;
  'عمولة المندوب الفرعي': number | null;
}
