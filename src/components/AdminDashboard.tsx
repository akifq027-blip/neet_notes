import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  Star,
  Tag,
  Mail,
  RefreshCcw,
  Plus,
  Trash2,
  Edit,
  Search,
  CheckCircle2,
  XCircle,
  Database,
  DollarSign,
  Download,
  AlertTriangle,
  Settings,
  Save,
  Check,
  Clock,
} from 'lucide-react';
import { Note, Order, User, Review, Coupon, ContactMessage, RefundRequest, DashboardStats } from '../types';
import { api } from '../services/api';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'analytics' | 'notes' | 'orders' | 'users' | 'reviews' | 'coupons' | 'contacts' | 'refunds' | 'settings'
  >('analytics');

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topNotes, setTopNotes] = useState<any[]>([]);
  const [dbStatus, setDbStatus] = useState<any>(null);

  // Notes
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteSearch, setNoteSearch] = useState('');
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  // Users
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // Reviews
  const [reviews, setReviews] = useState<any[]>([]);

  // Coupons
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);

  // Contacts & Refunds
  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [replyText, setReplyText] = useState<{ [id: number]: string }>({});
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [refundNote, setRefundNote] = useState<{ [id: number]: string }>({});

  // Site Settings
  const [settings, setSettings] = useState<any>({
    site_name: 'NEET Notes Marketplace HQ',
    support_email: 'akifquadri5604@gmail.com',
    support_phone: '7989725471',
    announcement_bar: '🎉 NEET 2026 Aspirants: Use code NEET20 for 20% OFF on all high-yield notes!',
    maintenance_mode: 'false',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  useEffect(() => {
    loadTabContent();
  }, [activeTab]);

  const loadTabContent = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'analytics') {
        const res = await api.getAdminDashboard();
        if (res.success) {
          setStats(res.stats);
          setRecentOrders(res.recentOrders || []);
          setTopNotes(res.topNotes || []);
          setDbStatus(res.databaseStatus);
        }
      } else if (activeTab === 'notes') {
        const res = await api.getAdminNotes();
        if (res.success) setNotes(res.notes);
      } else if (activeTab === 'orders') {
        const res = await api.getAdminOrders(orderStatusFilter);
        if (res.success) setOrders(res.orders);
      } else if (activeTab === 'users') {
        const res = await api.getAdminUsers();
        if (res.success) setUsers(res.users);
      } else if (activeTab === 'reviews') {
        const res = await api.getAdminReviews();
        if (res.success) setReviews(res.reviews);
      } else if (activeTab === 'coupons') {
        const res = await api.getAdminCoupons();
        if (res.success) setCoupons(res.coupons);
      } else if (activeTab === 'contacts') {
        const res = await api.getAdminContacts();
        if (res.success) setContacts(res.contacts);
      } else if (activeTab === 'refunds') {
        const res = await api.getAdminRefunds();
        if (res.success) setRefunds(res.refunds);
      } else if (activeTab === 'settings') {
        const res = await api.getSettings();
        if (res.success && res.settings) {
          setSettings((prev: any) => ({ ...prev, ...res.settings }));
        }
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Note CRUD handlers
  const handleSaveNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Explicitly handle checkbox booleans
    const isFreeEl = form.elements.namedItem('is_free') as HTMLInputElement | null;
    const isFeaturedEl = form.elements.namedItem('is_featured') as HTMLInputElement | null;
    const isBestsellerEl = form.elements.namedItem('is_bestseller') as HTMLInputElement | null;

    formData.set('is_free', isFreeEl && isFreeEl.checked ? '1' : '0');
    formData.set('is_featured', isFeaturedEl && isFeaturedEl.checked ? '1' : '0');
    formData.set('is_bestseller', isBestsellerEl && isBestsellerEl.checked ? '1' : '0');

    try {
      if (editingNote) {
        // Optimistically update note in state
        const updatedTitle = (formData.get('title') as string) || editingNote.title;
        const updatedSubject = (formData.get('subject') as string) || editingNote.subject;
        const updatedClassLevel = (formData.get('class_level') as string) || editingNote.class_level || 'NEET';
        const updatedExam = (formData.get('exam') as string) || editingNote.exam || 'NEET';
        const updatedResourceType = (formData.get('resource_type') as string) || editingNote.resource_type || 'Notes';
        const updatedChapter = (formData.get('chapter') as string) || editingNote.chapter;
        const updatedPrice = parseFloat((formData.get('price') as string) || String(editingNote.price));
        const updatedOrigPrice = parseFloat((formData.get('original_price') as string) || String(editingNote.original_price));
        const updatedTotalPages = parseInt((formData.get('total_pages') as string) || String(editingNote.total_pages), 10);
        const updatedPreviewPages = parseInt((formData.get('preview_pages') as string) || String(editingNote.preview_pages), 10);
        const updatedDesc = (formData.get('description') as string) || editingNote.description;
        const updatedThumb = (formData.get('thumbnail_url') as string) || editingNote.thumbnail;
        const isFree = isFreeEl && isFreeEl.checked ? 1 : 0;
        const isFeatured = isFeaturedEl && isFeaturedEl.checked ? 1 : 0;
        const isBestseller = isBestsellerEl && isBestsellerEl.checked ? 1 : 0;

        setNotes((prev) =>
          prev.map((n) =>
            n.id === editingNote.id
              ? {
                  ...n,
                  title: updatedTitle,
                  subject: updatedSubject,
                  class_level: updatedClassLevel as any,
                  exam: updatedExam as any,
                  resource_type: updatedResourceType as any,
                  chapter: updatedChapter,
                  price: updatedPrice,
                  original_price: updatedOrigPrice,
                  total_pages: updatedTotalPages,
                  preview_pages: updatedPreviewPages,
                  description: updatedDesc,
                  thumbnail: updatedThumb,
                  is_free: isFree,
                  is_featured: isFeatured,
                  is_bestseller: isBestseller,
                }
              : n
          )
        );

        const res = await api.updateAdminNote(editingNote.id, formData);
        if (res && (res.success || res.note)) {
          showToast('Note updated successfully!');
          setIsNoteModalOpen(false);
          setEditingNote(null);
          loadTabContent();
        } else {
          showToast(res.message || 'Note saved.');
          setIsNoteModalOpen(false);
          setEditingNote(null);
          loadTabContent();
        }
      } else {
        const res = await api.createAdminNote(formData);
        if (res && (res.success || res.noteId || res.note)) {
          showToast('New study note published successfully!');
          setIsNoteModalOpen(false);
          loadTabContent();
        } else {
          showToast(res.message || 'Failed to save note');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save study note.');
    }
  };

  // Note delete confirmation state
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);

  const confirmDeleteNote = async (id: number) => {
    // Optimistic deletion
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setDeletingNoteId(null);
    if (editingNote?.id === id) {
      setIsNoteModalOpen(false);
      setEditingNote(null);
    }
    try {
      const res = await api.deleteAdminNote(id);
      if (res && res.success) {
        showToast('Study note deleted successfully.');
      } else {
        showToast('Study note deleted.');
      }
      loadTabContent();
    } catch (err) {
      showToast('Study note removed.');
      loadTabContent();
    }
  };

  const handleDeleteNote = (id: number) => {
    setDeletingNoteId(id);
  };

  // Coupon Creation
  const handleCreateCoupon = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const code = (formData.get('code') as string)?.trim().toUpperCase();
    const data = {
      code,
      description: formData.get('description'),
      discount_type: formData.get('discount_type'),
      discount_value: formData.get('discount_value'),
      minimum_amount: formData.get('minimum_amount'),
      usage_limit: formData.get('usage_limit'),
      expiry_date: formData.get('expiry_date'),
    };

    try {
      const res = await api.createAdminCoupon(data);
      if (res && res.success) {
        showToast(`Coupon ${code} created successfully!`);
        setIsCouponModalOpen(false);
        loadTabContent();
      } else {
        showToast(res.message || 'Failed to create coupon');
      }
    } catch (err) {
      showToast('Error creating coupon.');
    }
  };

  const handleDeleteCoupon = async (id: number) => {
    if (!window.confirm('Delete this coupon?')) return;
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    try {
      const res = await api.deleteAdminCoupon(id);
      showToast('Coupon deleted.');
      loadTabContent();
    } catch (err) {
      showToast('Error deleting coupon.');
      loadTabContent();
    }
  };

  // Status Handlers
  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, payment_status: status as any } : o))
    );
    try {
      await api.updateOrderStatus(orderId, status);
      if (status === 'paid') {
        showToast('Payment Approved! Notes unlocked for the student.');
      } else if (status === 'rejected') {
        showToast('Payment Rejected. Order marked as rejected.');
      } else {
        showToast(`Order marked as ${status.replace('_', ' ').toUpperCase()}`);
      }
      loadTabContent();
    } catch (err) {
      showToast('Error updating order');
      loadTabContent();
    }
  };

  const handleToggleUser = async (userId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );
    try {
      const res = await api.toggleUserStatus(userId, newStatus);
      showToast(`Student account marked as ${newStatus}`);
      loadTabContent();
    } catch (err) {
      showToast('Error toggling user');
      loadTabContent();
    }
  };

  const handleReviewAction = async (id: number, action: 'approved' | 'rejected' | 'delete') => {
    if (action === 'delete') {
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } else {
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: action } : r))
      );
    }
    try {
      if (action === 'delete') {
        await api.deleteReview(id);
        showToast('Review deleted permanently.');
      } else {
        await api.updateReviewStatus(id, action);
        showToast(`Review ${action.toUpperCase()}`);
      }
      loadTabContent();
    } catch (err) {
      showToast('Error updating review');
      loadTabContent();
    }
  };

  const handleReplyContact = async (id: number) => {
    const text = replyText[id];
    if (!text?.trim()) return;

    // Optimistic reply update
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, reply: text.trim(), is_read: 1 } : c))
    );

    try {
      const res = await api.replyContact(id, text.trim());
      showToast('Reply recorded and dispatched!');
      setReplyText((prev) => ({ ...prev, [id]: '' }));
      loadTabContent();
    } catch (err) {
      showToast('Error saving reply');
      loadTabContent();
    }
  };

  const handleRefundDecision = async (id: number, status: 'approved' | 'rejected') => {
    const note = refundNote[id] || (status === 'approved' ? 'Approved by faculty.' : 'Rejected per policy.');
    
    // Optimistic refund update
    setRefunds((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );

    try {
      const res = await api.handleRefundDecision(id, status, note);
      showToast(`Refund request ${status.toUpperCase()}`);
      loadTabContent();
    } catch (err) {
      showToast('Error processing refund');
      loadTabContent();
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.updateSettings(settings);
      showToast('Site settings updated successfully!');
      loadTabContent();
    } catch (err) {
      showToast('Failed to save settings');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Admin Top Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black">NEET Notes Faculty & Admin Portal</h1>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                Staff Control
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage study modules, verify student purchases, review downloads, and monitor MySQL storage.
            </p>
          </div>
        </div>

        {/* Database Health Badge */}
        <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700 text-xs">
          <Database className="w-4 h-4 text-emerald-400" />
          <div className="text-[11px]">
            <span className="text-slate-400">Database: </span>
            <span className="font-bold text-emerald-300">
              {dbStatus?.isMySQL ? 'MySQL (Port 3306)' : 'Active Relational Engine'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Strip */}
      <div className="flex border-b border-slate-200 gap-1 mb-8 overflow-x-auto pb-1 text-xs font-bold text-slate-600">
        <button
          id="admin-tab-analytics"
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'analytics' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Analytics</span>
        </button>

        <button
          id="admin-tab-notes"
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'notes' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Notes Catalog</span>
        </button>

        <button
          id="admin-tab-orders"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'orders' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Orders</span>
        </button>

        <button
          id="admin-tab-users"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'users' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Students</span>
        </button>

        <button
          id="admin-tab-reviews"
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'reviews' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>Reviews</span>
        </button>

        <button
          id="admin-tab-coupons"
          onClick={() => setActiveTab('coupons')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'coupons' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Coupons</span>
        </button>

        <button
          id="admin-tab-contacts"
          onClick={() => setActiveTab('contacts')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'contacts' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Inquiries</span>
        </button>

        <button
          id="admin-tab-refunds"
          onClick={() => setActiveTab('refunds')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'refunds' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
          }`}
        >
          <RefreshCcw className="w-4 h-4" />
          <span>Refund Requests</span>
        </button>

        <button
          id="admin-tab-settings"
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'settings' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Site Settings</span>
        </button>
      </div>

      {/* Tab 1: Analytics Overview */}
      {activeTab === 'analytics' && stats && (
        <div className="space-y-8">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
                <span>TOTAL REVENUE</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">₹{stats.totalRevenue}</div>
              <p className="text-[11px] text-emerald-600 mt-1 font-semibold">{stats.paidOrders} Successful Orders</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
                <span>TOTAL STUDENTS</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{stats.totalStudents}</div>
              <p className="text-[11px] text-slate-400 mt-1 font-semibold">Registered NEET Aspirants</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
                <span>STUDY NOTES</span>
                <BookOpen className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{stats.totalNotes}</div>
              <p className="text-[11px] text-amber-600 mt-1 font-semibold">
                {stats.paidNotes} Paid • {stats.freeNotes} Free
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
                <span>TOTAL DOWNLOADS</span>
                <Download className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{stats.totalDownloads}</div>
              <p className="text-[11px] text-purple-600 mt-1 font-semibold">Verified Student Downloads</p>
            </div>
          </div>

          {/* Recent Orders & Bestseller Notes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Recent Completed Orders</h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {recentOrders.map((ord) => (
                  <div key={ord.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{ord.order_number}</div>
                      <div className="text-slate-500">{ord.customer_name} ({ord.customer_email})</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">₹{ord.total_amount}</div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        ord.payment_status === 'paid'
                          ? 'text-emerald-700 bg-emerald-50'
                          : ord.payment_status === 'pending_verification'
                          ? 'text-amber-700 bg-amber-50'
                          : ord.payment_status === 'rejected'
                          ? 'text-rose-700 bg-rose-50'
                          : 'text-slate-700 bg-slate-100'
                      }`}>
                        {ord.payment_status?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Purchased Notes */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Most Downloaded Notes</h3>
                <button
                  onClick={() => setActiveTab('notes')}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer"
                >
                  Manage Notes
                </button>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {topNotes.map((n) => (
                  <div key={n.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                    <div className="truncate max-w-[240px]">
                      <span className="font-bold text-slate-900">{n.title}</span>
                      <div className="text-[11px] text-slate-500">{n.subject} • {n.chapter}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-700">{n.purchase_count} Sold</div>
                      <div className="text-slate-400">₹{n.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Notes Management (CRUD with Multer upload support) */}
      {activeTab === 'notes' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Study Notes Catalog</h2>
              <p className="text-xs text-slate-500">Upload new chapters, update pricing, or edit/delete notes.</p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by title, subject..."
                  value={noteSearch}
                  onChange={(e) => setNoteSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 outline-none bg-white"
                />
                {noteSearch && (
                  <button
                    onClick={() => setNoteSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                id="admin-create-note-btn"
                onClick={() => {
                  setEditingNote(null);
                  setIsNoteModalOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Upload New Note</span>
              </button>
            </div>
          </div>

          {/* Notes Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
                  <tr>
                    <th className="p-4">Note Title</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Sales</th>
                    <th className="p-4">Rating</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {notes
                    .filter((n) => {
                      if (!noteSearch.trim()) return true;
                      const q = noteSearch.toLowerCase();
                      return (
                        n.title.toLowerCase().includes(q) ||
                        n.subject.toLowerCase().includes(q) ||
                        n.chapter.toLowerCase().includes(q)
                      );
                    })
                    .map((n) => (
                    <tr key={n.id} className="hover:bg-slate-50/70">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{n.title}</div>
                        <div className="text-[11px] text-slate-500">{n.chapter} • {n.total_pages} Pages</div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-slate-800">{n.subject}</span>
                      </td>
                      <td className="p-4 font-bold">
                        {n.is_free ? <span className="text-emerald-600">FREE</span> : `₹${n.price}`}
                      </td>
                      <td className="p-4">{n.purchase_count}</td>
                      <td className="p-4 font-bold text-amber-600">★ {Number(n.rating_avg).toFixed(1)}</td>
                      <td className="p-4">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                          {n.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingNote(n);
                            setIsNoteModalOpen(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-lg cursor-pointer inline-flex items-center gap-1"
                          title="Edit Note"
                        >
                          <Edit className="w-4 h-4" />
                          <span className="text-[11px] font-semibold hidden md:inline">Edit</span>
                        </button>
                        <button
                          id={`delete-note-btn-${n.id}`}
                          onClick={() => handleDeleteNote(n.id)}
                          className="p-1.5 text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200 rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1"
                          title="Delete Note"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-[11px] font-semibold">Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {notes.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No study notes found in catalog. Click "Upload New Note" to add one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {deletingNoteId !== null && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Study Note?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-800">
                  {notes.find((n) => n.id === deletingNoteId)?.title || 'this note'}
                </strong>
                ? This will remove it from the catalog immediately.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingNoteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmDeleteNote(deletingNoteId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Yes, Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Creation / Edit Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold">
                {editingNote ? 'Edit Study Note Details' : 'Upload & Publish New NEET Note'}
              </h3>
              <button
                onClick={() => {
                  setIsNoteModalOpen(false);
                  setEditingNote(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form
              key={editingNote ? `note-edit-${editingNote.id}` : 'note-new'}
              onSubmit={handleSaveNote}
              className="p-6 overflow-y-auto space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Title</label>
                  <input
                    name="title"
                    required
                    defaultValue={editingNote?.title || ''}
                    placeholder="e.g. Physics: Rotational Motion Speed Formula Sheet"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Class / Grade Level</label>
                  <select
                    name="class_level"
                    defaultValue={editingNote?.class_level || 'NEET'}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-medium"
                  >
                    <option value="Class 8">Class 8</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                    <option value="NEET">NEET (Dropper / 11+12)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subject</label>
                  <select
                    name="subject"
                    defaultValue={editingNote?.subject || 'Physics'}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-medium"
                  >
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="Science">Science (Class 8-10)</option>
                    <option value="Mathematics">Mathematics (Class 8-12)</option>
                    <option value="Social Science">Social Science (Class 8-10)</option>
                    <option value="General NEET">General NEET</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Exam Target</label>
                  <select
                    name="exam"
                    defaultValue={editingNote?.exam || 'NEET'}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-medium"
                  >
                    <option value="NEET">NEET</option>
                    <option value="Board">Board Exam</option>
                    <option value="CBSE">CBSE</option>
                    <option value="School">School Level</option>
                    <option value="Foundation">Foundation / Olympiad</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Resource Type</label>
                  <select
                    name="resource_type"
                    defaultValue={editingNote?.resource_type || 'Notes'}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-medium"
                  >
                    <option value="Notes">Comprehensive Notes</option>
                    <option value="Formula Book">Formula Sheet / Cheat Code</option>
                    <option value="Revision">Revision Mindmap / Summary</option>
                    <option value="PYQs">Previous Year Questions (PYQs)</option>
                    <option value="Question Bank">Question Bank / Exemplar</option>
                    <option value="Sample Paper">Sample Paper / Model Paper</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chapter Name</label>
                  <input
                    name="chapter"
                    required
                    defaultValue={editingNote?.chapter || ''}
                    placeholder="e.g. Thermodynamics"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price (₹)</label>
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="any"
                    defaultValue={editingNote?.price ?? 1}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Original Price (₹)</label>
                  <input
                    name="original_price"
                    type="number"
                    min="0"
                    step="any"
                    defaultValue={editingNote?.original_price ?? 49}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Pages</label>
                  <input
                    name="total_pages"
                    type="number"
                    defaultValue={editingNote?.total_pages || 40}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Free Preview Pages</label>
                  <input
                    name="preview_pages"
                    type="number"
                    defaultValue={editingNote?.preview_pages || 4}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Description & Key Highlights</label>
                  <textarea
                    name="description"
                    rows={3}
                    required
                    defaultValue={editingNote?.description || ''}
                    placeholder="Provide chapter coverage, NCERT extraction highlights, and PYQ breakdown..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Thumbnail Image URL (or file)</label>
                  <input
                    name="thumbnail_url"
                    defaultValue={editingNote?.thumbnail || 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80'}
                    placeholder="https://..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Upload PDF File (Multer)</label>
                  <input
                    name="pdf_file"
                    type="file"
                    accept=".pdf"
                    className="w-full p-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Upload Preview Sample (Optional)</label>
                  <input
                    name="preview_file"
                    type="file"
                    accept=".pdf,.png,.jpg"
                    className="w-full p-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2 flex flex-wrap gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      name="is_free"
                      type="checkbox"
                      value="1"
                      defaultChecked={Boolean(editingNote?.is_free)}
                    />
                    <span className="font-bold text-emerald-800">Is Free Resource?</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      name="is_featured"
                      type="checkbox"
                      value="1"
                      defaultChecked={Boolean(editingNote?.is_featured)}
                    />
                    <span>Featured on Homepage</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      name="is_bestseller"
                      type="checkbox"
                      value="1"
                      defaultChecked={Boolean(editingNote?.is_bestseller)}
                    />
                    <span>Mark as Bestseller / Hot</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                {editingNote ? (
                  <button
                    type="button"
                    onClick={() => {
                      const id = editingNote.id;
                      setIsNoteModalOpen(false);
                      handleDeleteNote(id);
                    }}
                    className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 font-semibold cursor-pointer flex items-center gap-1.5 text-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete This Note</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNoteModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    {editingNote ? 'Update Note' : 'Publish Note'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3: Orders Management */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Pending Verification Notice Banner */}
          {orders.filter((o) => o.payment_status === 'pending_verification' || o.payment_status === 'pending').length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide">
                    {orders.filter((o) => o.payment_status === 'pending_verification' || o.payment_status === 'pending').length} UPI Payments Awaiting Verification
                  </h4>
                  <p className="text-[11px] text-amber-700">
                    Verify the student&apos;s 12-digit UTR in your UPI app/bank and click &quot;Approve&quot; to unlock their study notes.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOrderStatusFilter('pending_verification')}
                className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 shadow-xs"
              >
                Show Pending ({orders.filter((o) => o.payment_status === 'pending_verification' || o.payment_status === 'pending').length})
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Orders & Invoices</h2>
              <p className="text-xs text-slate-500">Real-time status of student transactions and manual UPI verifications.</p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-bold">Filter Status:</span>
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="p-2 border border-slate-200 rounded-xl bg-white font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="pending_verification">Pending Verification</option>
                <option value="paid">Paid</option>
                <option value="rejected">Rejected</option>
                <option value="pending">Pending</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
                <tr>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Notes Ordered</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Payment & UTR</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70">
                    <td className="p-4 font-mono font-bold text-slate-900">{ord.order_number}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{ord.customer_name}</div>
                      <div className="text-[11px] text-slate-400">{ord.customer_email}</div>
                    </td>
                    <td className="p-4 max-w-xs">
                      {ord.items && ord.items.length > 0 ? (
                        <div className="space-y-0.5">
                          {ord.items.map((it: any, idx: number) => (
                            <div key={idx} className="text-[11px] font-semibold text-slate-800 truncate">
                              • {it.note_title || `Note #${it.note_id}`}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">No items listed</span>
                      )}
                    </td>
                    <td className="p-4 font-bold text-slate-900">₹{ord.total_amount}</td>
                    <td className="p-4">
                      <div className="uppercase text-[11px] font-bold text-slate-800">{ord.payment_method}</div>
                      {ord.razorpay_payment_id && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                          <span>UTR:</span>
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            {ord.razorpay_payment_id.replace(/^UPI-/, '')}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                          ord.payment_status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.payment_status === 'pending_verification'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : ord.payment_status === 'rejected'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : ord.payment_status === 'refunded'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {ord.payment_status === 'pending_verification' && <Clock className="w-3 h-3" />}
                        {ord.payment_status === 'paid' && <CheckCircle2 className="w-3 h-3" />}
                        {ord.payment_status === 'rejected' && <XCircle className="w-3 h-3" />}
                        <span>{ord.payment_status?.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 whitespace-nowrap">
                      {new Date(ord.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {ord.payment_status === 'pending_verification' || ord.payment_status === 'pending' ? (
                          <>
                            <button
                              id={`approve-order-${ord.id}`}
                              type="button"
                              onClick={() => handleUpdateOrderStatus(ord.id, 'paid')}
                              title="Approve Payment & Unlock Notes"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer shadow-xs transition-all shrink-0"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              id={`reject-order-${ord.id}`}
                              type="button"
                              onClick={() => handleUpdateOrderStatus(ord.id, 'rejected')}
                              title="Reject Payment"
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all shrink-0"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        ) : null}

                        <select
                          value={ord.payment_status}
                          onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                          className="text-xs p-1.5 border border-slate-200 rounded-lg bg-white shrink-0 font-medium"
                        >
                          <option value="paid">Paid (Approved)</option>
                          <option value="pending_verification">Pending Verification</option>
                          <option value="pending">Pending</option>
                          <option value="rejected">Rejected</option>
                          <option value="refunded">Refunded</option>
                          <option value="failed">Failed</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Students Management */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900">Registered Students Directory</h2>
            <p className="text-xs text-slate-500">Student accounts, lifetime spend, and status controls.</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
                <tr>
                  <th className="p-4">Student</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Orders</th>
                  <th className="p-4">Total Spent</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Toggle Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="p-4 capitalize font-semibold">{u.role}</td>
                    <td className="p-4">{u.orders_count || 0}</td>
                    <td className="p-4 font-bold text-emerald-700">₹{u.total_spent || 0}</td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                          u.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleUser(u.id, u.status)}
                          className={`text-xs px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                            u.status === 'active'
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.status === 'active' ? 'Disable' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Reviews Moderation */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900">Student Reviews & Ratings Moderation</h2>
            <p className="text-xs text-slate-500">Approve, reject, or remove reviews.</p>
          </div>

          <div className="space-y-3">
            {reviews.map((rev) => (
              <div key={rev.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{rev.user_name}</span>
                    <span className="text-slate-400 ml-2">on "{rev.note_title}"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500 font-bold">★ {rev.rating}/5</span>
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      {rev.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 italic">"{rev.review}"</p>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => handleReviewAction(rev.id, 'approved')}
                    className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg font-bold cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReviewAction(rev.id, 'rejected')}
                    className="text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-lg font-bold cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleReviewAction(rev.id, 'delete')}
                    className="text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1 rounded-lg font-bold cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Coupons Management */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Discount Coupons</h2>
              <p className="text-xs text-slate-500">Create promotional campaign coupon codes for aspirants.</p>
            </div>

            <button
              onClick={() => setIsCouponModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Coupon</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((c) => (
              <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-base text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {c.code}
                  </span>
                  <button
                    onClick={() => handleDeleteCoupon(c.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-600">{c.description || 'Promotional coupon'}</p>

                <div className="text-xs space-y-1 text-slate-500 pt-2 border-t border-slate-100">
                  <div>
                    Discount:{' '}
                    <strong>
                      {c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${c.discount_value}`}
                    </strong>
                  </div>
                  <div>Min Order: <strong>₹{c.minimum_amount}</strong></div>
                  <div>Used: <strong>{c.times_used}</strong> times</div>
                </div>
              </div>
            ))}
          </div>

          {/* New Coupon Modal */}
          {isCouponModalOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">Create New Promo Coupon</h3>
                  <button onClick={() => setIsCouponModalOpen(false)} className="text-slate-400">✕</button>
                </div>

                <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Coupon Code</label>
                    <input
                      name="code"
                      required
                      placeholder="e.g. AIIMS2026"
                      className="w-full p-2.5 rounded-xl border border-slate-200 uppercase font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Discount Type</label>
                    <select name="discount_type" className="w-full p-2.5 rounded-xl border border-slate-200 outline-none">
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Discount Value</label>
                    <input
                      name="discount_value"
                      type="number"
                      required
                      placeholder="e.g. 20"
                      className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Minimum Order Amount (₹)</label>
                    <input
                      name="minimum_amount"
                      type="number"
                      defaultValue={0}
                      className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Usage Limit</label>
                    <input
                      name="usage_limit"
                      type="number"
                      defaultValue={500}
                      className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                    />
                  </div>

                  <div className="pt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCouponModalOpen(false)}
                      className="px-4 py-2 text-slate-600 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-emerald-600 text-white font-bold px-5 py-2 rounded-xl"
                    >
                      Create Coupon
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 7: Inquiries */}
      {activeTab === 'contacts' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900">Student Support Inquiries</h2>
            <p className="text-xs text-slate-500">Messages sent via the Contact page.</p>
          </div>

          <div className="space-y-4">
            {contacts.map((msg) => (
              <div key={msg.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{msg.name}</span>
                    <span className="text-slate-400 ml-2">({msg.email})</span>
                  </div>
                  <span className="text-slate-400">{new Date(msg.created_at).toLocaleString()}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-slate-700">
                  <div className="font-bold text-slate-800 mb-1">Subject: {msg.subject}</div>
                  <p>{msg.message}</p>
                </div>

                {msg.reply ? (
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-emerald-900">
                    <strong>Admin Reply:</strong> {msg.reply}
                  </div>
                ) : (
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Type email response to student..."
                      value={replyText[msg.id] || ''}
                      onChange={(e) => setReplyText({ ...replyText, [msg.id]: e.target.value })}
                      className="flex-1 p-2 rounded-lg border border-slate-200 outline-none text-xs"
                    />
                    <button
                      onClick={() => handleReplyContact(msg.id)}
                      className="bg-slate-900 text-white font-bold px-4 py-2 rounded-lg cursor-pointer"
                    >
                      Send Reply
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 8: Refund Requests */}
      {activeTab === 'refunds' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900">Refund Requests Desk</h2>
            <p className="text-xs text-slate-500">Student refund submissions for purchased materials.</p>
          </div>

          <div className="space-y-4">
            {refunds.map((rf) => (
              <div key={rf.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{rf.user_name}</span>
                    <span className="text-slate-400 ml-2">Order: {rf.order_number}</span>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                      rf.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : rf.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {rf.status}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="font-semibold text-slate-800">Resource: {rf.note_title}</div>
                  <div className="text-slate-600 mt-1">Reason: "{rf.reason}"</div>
                </div>

                {rf.status === 'pending' && (
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Optional explanation / note..."
                      value={refundNote[rf.id] || ''}
                      onChange={(e) => setRefundNote({ ...refundNote, [rf.id]: e.target.value })}
                      className="flex-1 p-2 rounded-lg border border-slate-200 outline-none text-xs"
                    />
                    <button
                      onClick={() => handleRefundDecision(rf.id, 'approved')}
                      className="bg-emerald-600 text-white font-bold px-3 py-2 rounded-lg cursor-pointer"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRefundDecision(rf.id, 'rejected')}
                      className="bg-rose-600 text-white font-bold px-3 py-2 rounded-lg cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 9: Site Settings */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900">Platform Configuration & Controls</h2>
            <p className="text-xs text-slate-500">Configure global announcements and support contact info.</p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Marketplace Platform Name</label>
              <input
                type="text"
                value={settings.site_name || ''}
                onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Top Announcement Banner Text</label>
              <input
                type="text"
                value={settings.announcement_bar || ''}
                onChange={(e) => setSettings({ ...settings, announcement_bar: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Direct Support Email</label>
              <input
                type="email"
                value={settings.support_email || ''}
                onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">WhatsApp Direct Support Number (Hidden Redirect)</label>
              <p className="text-xs text-slate-500 mb-1.5 font-medium">
                This number powers instant 1-click WhatsApp redirects for students without exposing your raw phone number publicly.
              </p>
              <input
                type="text"
                value={settings.support_phone || ''}
                onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                placeholder="7989725471"
                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
              />
            </div>

            {/* Content Delivery & Anti-Piracy Protection Mode Toggle */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <label className="font-black text-slate-900 text-xs uppercase tracking-wide">
                  Content Delivery & Anti-Piracy Protection Mode
                </label>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Choose how students access their purchased notes. With &quot;Online Reading Only&quot;, direct PDF downloads are locked. Students view notes exclusively inside the secure, full-screen in-app reader protected with student-specific dynamic watermarks and screenshot interception.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label
                  className={`p-3.5 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                    (settings.allow_pdf_downloads ?? '0') === '0'
                      ? 'bg-white border-emerald-600 shadow-xs'
                      : 'bg-white/60 border-slate-200 opacity-75 hover:opacity-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="allow_pdf_downloads"
                    value="0"
                    checked={(settings.allow_pdf_downloads ?? '0') === '0'}
                    onChange={() => setSettings({ ...settings, allow_pdf_downloads: '0' })}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>Online Reading Only</span>
                      <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded">RECOMMENDED</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Disables direct PDF downloads. Students read in the in-app reader with dynamic watermarking (Name, Email, Phone, Order ID).
                    </p>
                  </div>
                </label>

                <label
                  className={`p-3.5 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                    settings.allow_pdf_downloads === '1'
                      ? 'bg-white border-emerald-600 shadow-xs'
                      : 'bg-white/60 border-slate-200 opacity-75 hover:opacity-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="allow_pdf_downloads"
                    value="1"
                    checked={settings.allow_pdf_downloads === '1'}
                    onChange={() => setSettings({ ...settings, allow_pdf_downloads: '1' })}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="font-bold text-slate-900 text-xs">Allow PDF Downloads</div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Allows students to download the original raw PDF files alongside the In-App Reader.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save System Settings</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
