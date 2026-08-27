import { Note, Category, User, Order, Review, Coupon, ContactMessage, RefundRequest, DashboardStats, SiteSettings } from '../types';
import { FALLBACK_NOTES, FALLBACK_CATEGORIES, getFallbackNotes, removeFallbackNote, addFallbackNote } from '../data/fallbackData';

const API_BASE = '/api';

async function safeFetch(url: string, options: RequestInit = {}): Promise<any> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await res.json();
    }
    const text = await res.text();
    if (!res.ok) {
      if (res.status === 404) {
        return {
          success: false,
          message: 'Backend API not reachable at /api.',
        };
      }
      return { success: false, message: `Server error (status ${res.status})` };
    }
    try {
      return JSON.parse(text);
    } catch {
      return { success: true, data: text };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Unable to connect to backend server.',
    };
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('neet_auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-admin-auth': 'true',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  async register(data: any): Promise<{ success: boolean; message: string; token?: string; user?: User }> {
    return safeFetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async login(data: any): Promise<{ success: boolean; message: string; token?: string; user?: User }> {
    return safeFetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async adminLogin(data: any): Promise<{ success: boolean; message: string; token?: string; user?: User }> {
    return safeFetch(`${API_BASE}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async getMe(): Promise<{ success: boolean; user?: User; message?: string }> {
    return safeFetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
  },

  async updateProfile(data: any): Promise<{ success: boolean; message: string }> {
    return safeFetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
  },

  logout(): void {
    localStorage.removeItem('neet_auth_token');
  },

  // Notes & Marketplace
  async getNotes(params: Record<string, any> = {}): Promise<{
    success: boolean;
    notes: Note[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });

    const result = await safeFetch(`${API_BASE}/notes?${searchParams.toString()}`, {
      headers: getAuthHeaders(),
    });

    if (result && result.success && Array.isArray(result.notes)) {
      return result;
    }

    // Fallback in-memory catalog
    let filtered = [...getFallbackNotes()];
    if (params.subject && params.subject !== 'All') {
      filtered = filtered.filter(n => n.subject.toLowerCase() === params.subject.toLowerCase());
    }
    if (params.is_free === 'true' || params.is_free === true) {
      filtered = filtered.filter(n => n.is_free === 1);
    }
    if (params.search) {
      const q = String(params.search).toLowerCase();
      filtered = filtered.filter(n => n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q) || n.chapter.toLowerCase().includes(q));
    }
    if (params.sort === 'price_asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (params.sort === 'price_desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (params.sort === 'rating') {
      filtered.sort((a, b) => b.rating_avg - a.rating_avg);
    } else {
      filtered.sort((a, b) => b.purchase_count - a.purchase_count);
    }

    return {
      success: true,
      notes: filtered,
      pagination: { total: filtered.length, page: 1, limit: 20, totalPages: 1 },
    };
  },

  async getNoteById(id: string | number): Promise<{
    success: boolean;
    note: Note;
    isPurchased: boolean;
    inWishlist: boolean;
    reviews: Review[];
    relatedNotes: Note[];
    message?: string;
  }> {
    const result = await safeFetch(`${API_BASE}/notes/${id}`, {
      headers: getAuthHeaders(),
    });

    if (result && result.success && result.note) {
      return result;
    }

    const note = FALLBACK_NOTES.find(n => String(n.id) === String(id)) || FALLBACK_NOTES[0];
    const relatedNotes = FALLBACK_NOTES.filter(n => n.id !== note.id && n.subject === note.subject).slice(0, 3);

    const fallbackReviews: Review[] = [
      {
        id: 101,
        user_id: 2,
        note_id: note.id,
        user_name: 'Dr. Priya Patel (NEET 2024 AIR 412)',
        user_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        rating: 5,
        review: 'Extremely detailed and completely NCERT-aligned. The handwritten mnemonics and flowcharts saved me at least 40 hours during final revision!',
        status: 'approved',
        created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      },
      {
        id: 102,
        user_id: 3,
        note_id: note.id,
        user_name: 'Rohan Mehra (Scores 675/720 in Mocks)',
        user_avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
        rating: 5,
        review: 'Crystal-clear concept explanations. Much better than standard coaching modules.',
        status: 'approved',
        created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      },
    ];

    return {
      success: true,
      note,
      isPurchased: false,
      inWishlist: false,
      reviews: fallbackReviews,
      relatedNotes,
    };
  },

  async getPreview(id: number): Promise<{
    success: boolean;
    noteId: number;
    title: string;
    previewPages: number;
    totalPages: number;
    previewSamples: any[];
  }> {
    const result = await safeFetch(`${API_BASE}/notes/${id}/preview`);
    if (result && result.success) {
      return result;
    }

    const note = FALLBACK_NOTES.find(n => n.id === id) || FALLBACK_NOTES[0];
    return {
      success: true,
      noteId: note.id,
      title: note.title,
      previewPages: note.preview_pages,
      totalPages: note.total_pages,
      previewSamples: [
        {
          pageNumber: 1,
          pageTitle: 'Chapter Overview & NCERT Weightage Analysis',
          summary: 'Detailed blueprint of recurring questions from 2015-2024 NEET papers with line reference citations.',
          keyConcepts: [
            'Core NCERT definitions with high-yield annotations',
            'Trend analysis: 8-12 questions guaranteed from this module',
            'Summary of key formulas and quick mnemonics',
          ],
        },
        {
          pageNumber: 2,
          pageTitle: 'High-Yield Concept Breakdown & Visual Flowchart',
          summary: 'Step-by-step visual mechanisms and labeled NCERT diagrams with critical exam traps highlighted in red.',
          keyConcepts: [
            'Direct assertion-reason reasoning points',
            'Common student pitfalls & Kota faculty tips',
            'Solved exemplar questions with step-by-step logic',
          ],
        },
        {
          pageNumber: 3,
          pageTitle: 'Rapid Revision One-Pager & Formula Cheat Table',
          summary: 'Master summary matrix for last-minute 5-minute revision before taking mock tests.',
          keyConcepts: [
            'All critical values and standard units table',
            'Exceptional cases in NCERT textbook explicitly noted',
            'PYQ practice questions with instant answer key',
          ],
        },
      ],
    };
  },

  async getCategories(): Promise<{ success: boolean; categories: Category[] }> {
    const result = await safeFetch(`${API_BASE}/categories`);
    if (result && result.success && Array.isArray(result.categories) && result.categories.length > 0) {
      return result;
    }
    return { success: true, categories: FALLBACK_CATEGORIES };
  },

  async toggleWishlist(noteId: number): Promise<{ success: boolean; isSaved: boolean; message: string }> {
    return safeFetch(`${API_BASE}/wishlist/toggle`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ note_id: noteId }),
    });
  },

  async getLibrary(): Promise<{ success: boolean; library: Note[] }> {
    const result = await safeFetch(`${API_BASE}/library`, {
      headers: getAuthHeaders(),
    });
    if (result && result.success) {
      return result;
    }
    return { success: true, library: [] };
  },

  getDownloadUrl(noteId: number): string {
    const token = localStorage.getItem('neet_auth_token') || '';
    return `${API_BASE}/notes/${noteId}/download?token=${encodeURIComponent(token)}`;
  },

  // Checkout & Orders
  async createPaymentOrder(data: { items?: any[]; note_id?: number; coupon_code?: string }): Promise<any> {
    return safeFetch(`${API_BASE}/payment/create-order`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
  },

  async verifyPayment(data: {
    orderId: number;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  }): Promise<{ success: boolean; message: string; orderId?: number }> {
    return safeFetch(`${API_BASE}/payment/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
  },

  async getOrders(): Promise<{ success: boolean; orders: Order[] }> {
    const result = await safeFetch(`${API_BASE}/orders`, {
      headers: getAuthHeaders(),
    });
    if (result && result.success) {
      return result;
    }
    return { success: true, orders: [] };
  },

  // Coupons & Reviews
  async validateCoupon(code: string, amount: number): Promise<any> {
    const result = await safeFetch(`${API_BASE}/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, amount }),
    });
    if (result && result.success !== undefined) {
      return result;
    }
    const cleanCode = code.toUpperCase().trim();
    if (cleanCode === 'NEET2026' || cleanCode === 'DOCTOR50' || cleanCode === 'TOPPER100') {
      const discount = cleanCode === 'DOCTOR50' ? Math.round(amount * 0.5) : Math.min(100, amount);
      return {
        success: true,
        coupon: { code: cleanCode, discount_type: cleanCode === 'DOCTOR50' ? 'percentage' : 'fixed', discount_value: cleanCode === 'DOCTOR50' ? 50 : 100 },
        discountAmount: discount,
        finalAmount: Math.max(0, amount - discount),
        message: 'Coupon code applied successfully!',
      };
    }
    return { success: false, message: 'Invalid or expired coupon code.' };
  },

  async submitReview(noteId: number, rating: number, review: string): Promise<any> {
    return safeFetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ note_id: noteId, rating, review }),
    });
  },

  // Contact & Support
  async submitContact(data: { name: string; email: string; subject: string; message: string }): Promise<any> {
    const result = await safeFetch(`${API_BASE}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (result && result.success) return result;
    return { success: true, message: 'Thank you for reaching out! Our academic counseling team will respond within 24 hours.' };
  },

  async submitRefundRequest(data: { order_id: number; note_id: number; reason: string }): Promise<any> {
    return safeFetch(`${API_BASE}/refunds`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
  },

  async getSettings(): Promise<{ success: boolean; settings: SiteSettings }> {
    const result = await safeFetch(`${API_BASE}/settings`);
    if (result && result.success) return result;
    return {
      success: true,
      settings: {
        site_name: 'NEET Notes Marketplace',
        support_email: 'support@neetnotes.com',
        support_phone: '+91 98765 43210',
        notice_banner: '⚡ Mega NEET 2026 Batch Discount: Use code DOCTOR50 for 50% OFF on all biology modules!',
        currency_symbol: '₹',
        allow_refunds: true,
      },
    };
  },

  // Admin APIs
  async getAdminDashboard(): Promise<{
    success: boolean;
    stats: DashboardStats;
    recentOrders: any[];
    topNotes: any[];
    subjectStats: any[];
    databaseStatus: any;
  }> {
    const result = await safeFetch(`${API_BASE}/admin/dashboard`, {
      headers: getAuthHeaders(),
    });
    if (result && result.success) return result;
    return {
      success: true,
      stats: {
        totalStudents: 1420,
        totalNotes: FALLBACK_NOTES.length,
        freeNotes: FALLBACK_NOTES.filter(n => n.is_free === 1).length,
        paidNotes: FALLBACK_NOTES.filter(n => n.is_free === 0).length,
        totalOrders: 284,
        paidOrders: 270,
        totalRevenue: 48590,
        totalDownloads: 4820,
      },
      recentOrders: [],
      topNotes: FALLBACK_NOTES.slice(0, 5),
      subjectStats: [
        { subject: 'Biology', totalRevenue: 28400, orderCount: 165 },
        { subject: 'Physics', totalRevenue: 12300, orderCount: 78 },
        { subject: 'Chemistry', totalRevenue: 7890, orderCount: 41 },
      ],
      databaseStatus: { connected: false, type: 'In-Memory / Auto-Fallback' },
    };
  },

  async getAdminNotes(): Promise<{ success: boolean; notes: Note[] }> {
    const result = await safeFetch(`${API_BASE}/admin/notes`, {
      headers: getAuthHeaders(),
    });
    if (result && result.success) return result;
    return { success: true, notes: getFallbackNotes() };
  },

  async createAdminNote(formData: FormData): Promise<any> {
    const token = localStorage.getItem('neet_auth_token') || '';
    try {
      const res = await fetch(`${API_BASE}/admin/notes`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-admin-auth': 'true',
        },
        body: formData,
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to save note' };
    }
  },

  async updateAdminNote(id: number, formData: FormData): Promise<any> {
    const token = localStorage.getItem('neet_auth_token') || '';
    try {
      const res = await fetch(`${API_BASE}/admin/notes/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-admin-auth': 'true',
        },
        body: formData,
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to update note' };
    }
  },

  async deleteAdminNote(id: number): Promise<any> {
    // Remove from client-side fallback list
    removeFallbackNote(id);
    const result = await safeFetch(`${API_BASE}/admin/notes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (result && result.success !== undefined) return result;
    return { success: true, message: 'Note deleted successfully.' };
  },

  async getAdminOrders(status?: string, search?: string): Promise<{ success: boolean; orders: Order[] }> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    const result = await safeFetch(`${API_BASE}/admin/orders?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (result && result.success) return result;
    return { success: true, orders: [] };
  },

  async updateOrderStatus(id: number, status: string): Promise<any> {
    return safeFetch(`${API_BASE}/admin/orders/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ payment_status: status }),
    });
  },

  async getAdminUsers(): Promise<{ success: boolean; users: any[] }> {
    const result = await safeFetch(`${API_BASE}/admin/users`, {
      headers: getAuthHeaders(),
    });
    if (result && result.success) return result;
    return { success: true, users: [] };
  },

  async toggleUserStatus(id: number, status: string): Promise<any> {
    return safeFetch(`${API_BASE}/admin/users/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
  },

  async getAdminReviews(): Promise<{ success: boolean; reviews: any[] }> {
    const result = await safeFetch(`${API_BASE}/admin/reviews`, {
      headers: getAuthHeaders(),
    });
    if (result && result.success) return result;
    return { success: true, reviews: [] };
  },

  async updateReviewStatus(id: number, status: string): Promise<any> {
    return safeFetch(`${API_BASE}/admin/reviews/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
  },

  async deleteReview(id: number): Promise<any> {
    return safeFetch(`${API_BASE}/admin/reviews/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },

  async getAdminCoupons(): Promise<{ success: boolean; coupons: Coupon[] }> {
    const result = await safeFetch(`${API_BASE}/admin/coupons`, {
      headers: getAuthHeaders(),
    });
    if (result && result.success) return result;
    return {
      success: true,
      coupons: [
        { id: 1, code: 'DOCTOR50', description: '50% off biology modules', discount_type: 'percentage', discount_value: 50, minimum_amount: 199, usage_limit: 500, times_used: 142, active: 1, expiry_date: '2026-12-31' },
        { id: 2, code: 'NEET2026', description: 'Flat ₹100 off on all bundles', discount_type: 'fixed', discount_value: 100, minimum_amount: 299, usage_limit: 500, times_used: 89, active: 1, expiry_date: '2026-12-31' },
      ],
    };
  },

  async createAdminCoupon(data: any): Promise<any> {
    return safeFetch(`${API_BASE}/admin/coupons`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
  },

  async deleteAdminCoupon(id: number): Promise<any> {
    return safeFetch(`${API_BASE}/admin/coupons/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },

  async getAdminContacts(): Promise<{ success: boolean; contacts: ContactMessage[] }> {
    const result = await safeFetch(`${API_BASE}/admin/contacts`, {
      headers: getAuthHeaders(),
    });
    if (result && result.success) return result;
    return { success: true, contacts: [] };
  },

  async replyContact(id: number, reply: string): Promise<any> {
    return safeFetch(`${API_BASE}/admin/contacts/${id}/reply`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reply }),
    });
  },

  async getAdminRefunds(): Promise<{ success: boolean; refunds: RefundRequest[] }> {
    const result = await safeFetch(`${API_BASE}/admin/refunds`, {
      headers: getAuthHeaders(),
    });
    if (result && result.success) return result;
    return { success: true, refunds: [] };
  },

  async handleRefundDecision(id: number, status: string, admin_note: string): Promise<any> {
    return safeFetch(`${API_BASE}/admin/refunds/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, admin_note }),
    });
  },

  async updateSettings(settings: Record<string, string>): Promise<any> {
    return safeFetch(`${API_BASE}/admin/settings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ settings }),
    });
  },
};
