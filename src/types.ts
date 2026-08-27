export interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'admin';
  phone?: string | null;
  avatar?: string | null;
  status?: 'active' | 'disabled';
  created_at?: string;
  purchasedNotesCount?: number;
  wishlistCount?: number;
}

export interface Note {
  id: number;
  title: string;
  slug: string;
  description: string;
  subject: 'Physics' | 'Chemistry' | 'Biology' | 'General NEET';
  chapter: string;
  category_id: number;
  category_name?: string;
  category_slug?: string;
  price: number;
  original_price: number;
  thumbnail: string;
  pdf_file: string;
  preview_file?: string | null;
  preview_pages: number;
  total_pages: number;
  file_size_mb?: number;
  is_free: number;
  is_featured: number;
  is_bestseller: number;
  author_name: string;
  rating_avg: number;
  rating_count: number;
  purchase_count: number;
  download_count: number;
  status: 'published' | 'draft' | 'archived';
  created_at: string;
  updated_at?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  display_order?: number;
  notes_count?: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  note_id: number;
  price: number;
  note_title: string;
  slug?: string;
  subject?: string;
  chapter?: string;
  thumbnail?: string;
  pdf_file?: string;
  created_at?: string;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  subtotal: number;
  discount_amount: number;
  coupon_code?: string | null;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: string;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  customer_name?: string;
  customer_email?: string;
  created_at: string;
  items?: OrderItem[];
}

export interface Review {
  id: number;
  user_id: number;
  note_id: number;
  rating: number;
  review: string;
  status: 'approved' | 'pending' | 'rejected';
  user_name?: string;
  user_avatar?: string | null;
  user_email?: string;
  note_title?: string;
  created_at: string;
}

export interface Coupon {
  id: number;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  minimum_amount: number;
  usage_limit: number;
  times_used: number;
  expiry_date?: string | null;
  active: number;
  created_at?: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: number;
  reply?: string | null;
  replied_at?: string | null;
  created_at: string;
}

export interface RefundRequest {
  id: number;
  user_id: number;
  order_id: number;
  note_id: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_note?: string | null;
  user_name?: string;
  user_email?: string;
  order_number?: string;
  note_title?: string;
  total_amount?: number;
  created_at: string;
}

export interface CartItem {
  note: Note;
  quantity: number;
}

export interface DashboardStats {
  totalStudents: number;
  totalNotes: number;
  freeNotes: number;
  paidNotes: number;
  totalOrders: number;
  paidOrders: number;
  totalRevenue: number;
  totalDownloads: number;
}

export interface SiteSettings {
  site_name?: string;
  site_tagline?: string;
  support_email?: string;
  support_phone?: string;
  maintenance_mode?: string;
  announcement_bar?: string;
  currency_symbol?: string;
  [key: string]: any;
}
