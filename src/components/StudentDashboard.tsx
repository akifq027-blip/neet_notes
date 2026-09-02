import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  FileText,
  Heart,
  User as UserIcon,
  Download,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
  AlertCircle,
  Key,
  Archive,
  ShoppingCart,
  Trash2,
  Eye,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { User, Note, Order } from '../types';
import { api } from '../services/api';

interface StudentDashboardProps {
  user: User;
  initialTab?: 'library' | 'orders' | 'wishlist' | 'profile';
  onNavigate: (view: string, param?: any) => void;
  onPreviewNote: (note: Note) => void;
  onOpenReader?: (note: Note) => void;
  onAddToCart: (note: Note) => void;
  onUpdateUser: (updated: User) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  initialTab = 'library',
  onNavigate,
  onPreviewNote,
  onOpenReader,
  onAddToCart,
  onUpdateUser,
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'orders' | 'wishlist' | 'profile'>(initialTab);
  const [libraryNotes, setLibraryNotes] = useState<(Note & { is_archived?: boolean })[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistNotes, setWishlistNotes] = useState<Note[]>([]);
  const [searchLibrary, setSearchLibrary] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [allowPdfDownloads, setAllowPdfDownloads] = useState<boolean>(false);

  // Profile form
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || '');
  const [newPassword, setNewPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Refund Modal State
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundOrder, setRefundOrder] = useState<Order | null>(null);
  const [refundNoteId, setRefundNoteId] = useState<number | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundStatusMsg, setRefundStatusMsg] = useState('');
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleLaunchReader = (note: Note) => {
    if (onOpenReader) {
      onOpenReader(note);
    } else {
      onPreviewNote(note);
    }
  };

  const handleLaunchReaderByNoteId = (noteId: number, noteTitle: string) => {
    const found = libraryNotes.find((n) => n.id === noteId);
    if (found) {
      handleLaunchReader(found);
    } else {
      const synNote: Note = {
        id: noteId,
        title: noteTitle,
        slug: `note-${noteId}`,
        description: 'Unlocked study note in your student library.',
        subject: 'Study Material',
        chapter: noteTitle,
        category_id: 1,
        price: 0,
        original_price: 0,
        thumbnail: '',
        pdf_file: '',
        preview_pages: 4,
        total_pages: 8,
        is_free: 0,
        is_featured: 0,
        is_bestseller: 0,
        author_name: 'NEET Faculty',
        rating_avg: 5,
        rating_count: 1,
        purchase_count: 1,
        download_count: 0,
        status: 'published',
        created_at: new Date().toISOString(),
      };
      handleLaunchReader(synNote);
    }
  };

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [libRes, ordRes, allNotesRes, settingsRes] = await Promise.all([
        api.getLibrary(),
        api.getOrders(),
        api.getNotes({ limit: 150 }),
        api.getSettings(),
      ]);

      if (settingsRes && settingsRes.success && settingsRes.settings) {
        setAllowPdfDownloads(settingsRes.settings.allow_pdf_downloads === '1');
      }

      const freshCatalog = allNotesRes.success && Array.isArray(allNotesRes.notes) ? allNotesRes.notes : [];
      const catalogMap = new Map<number, Note>(freshCatalog.map((n) => [n.id, n]));

      // 1. Dynamic Data Rehydration for Library
      if (libRes.success && Array.isArray(libRes.library)) {
        const rehydratedLibrary = libRes.library.map((item) => {
          const fresh = catalogMap.get(item.id);
          if (fresh) {
            return {
              ...item,
              ...fresh,
              order_number: item.order_number || fresh.order_number,
              purchased_at: item.purchased_at || fresh.purchased_at || fresh.created_at,
              is_archived: false,
            };
          }
          // Note was deleted from catalog by admin -> preserve access gracefully
          return {
            ...item,
            title: item.title || 'Archived Study Note',
            subject: item.subject || 'General Study',
            class_level: item.class_level || 'NEET',
            chapter: item.chapter || 'Previous Edition',
            total_pages: item.total_pages || 25,
            is_archived: true,
          };
        });
        setLibraryNotes(rehydratedLibrary);
      }

      // 2. Dynamic Data Rehydration for Orders
      if (ordRes.success && Array.isArray(ordRes.orders)) {
        const rehydratedOrders = ordRes.orders.map((ord) => ({
          ...ord,
          items: ord.items?.map((item) => {
            const fresh = catalogMap.get(item.note_id);
            return {
              ...item,
              note_title: item.note_title || fresh?.title || 'Archived Note',
              is_archived: !fresh,
            };
          }),
        }));
        setOrders(rehydratedOrders);
      }

      // 3. Saved Bookmarks / Wishlist Dynamic Resolution
      let wishlistIds: number[] = [];
      try {
        const rawWishlist = localStorage.getItem('neet_wishlist') || localStorage.getItem('neet_local_wishlist_ids');
        if (rawWishlist) {
          const parsed = JSON.parse(rawWishlist);
          if (Array.isArray(parsed)) {
            wishlistIds = parsed.map((x) => (typeof x === 'object' && x ? x.id : Number(x))).filter(Boolean);
          }
        }
      } catch (e) {
        console.error('Error loading wishlist:', e);
      }

      if (wishlistIds.length > 0) {
        const resolvedWishlist = wishlistIds
          .map((id) => catalogMap.get(id))
          .filter((n): n is Note => Boolean(n));
        setWishlistNotes(resolvedWishlist);
      } else if (freshCatalog.length > 0) {
        // Default suggested saved bookmarks
        setWishlistNotes(freshCatalog.slice(0, 3));
      }
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();

    // 4. Instant Cross-View State Update: Listen to admin CRUD events
    const handleCatalogUpdate = () => {
      loadDashboardData();
    };

    window.addEventListener('neet_notes_updated', handleCatalogUpdate);
    window.addEventListener('storage', handleCatalogUpdate);

    return () => {
      window.removeEventListener('neet_notes_updated', handleCatalogUpdate);
      window.removeEventListener('storage', handleCatalogUpdate);
    };
  }, [loadDashboardData]);

  const handleDownload = (noteId: number) => {
    const url = api.getDownloadUrl(noteId);
    window.open(url, '_blank');
  };

  const handleRemoveBookmark = (noteId: number) => {
    try {
      const rawWishlist = localStorage.getItem('neet_wishlist');
      if (rawWishlist) {
        const parsed = JSON.parse(rawWishlist);
        if (Array.isArray(parsed)) {
          const updated = parsed.filter((x) => (typeof x === 'object' ? x.id !== noteId : Number(x) !== noteId));
          localStorage.setItem('neet_wishlist', JSON.stringify(updated));
        }
      }
      setWishlistNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMsg('');

    try {
      const res = await api.updateProfile({
        name,
        email,
        phone,
        password: newPassword || undefined,
      });

      if (res.success) {
        setProfileMsg('Profile updated successfully!');
        onUpdateUser({ ...user, name, email, phone });
        setNewPassword('');
      } else {
        setProfileMsg(res.message || 'Failed to update profile.');
      }
    } catch (err) {
      setProfileMsg('Error saving profile changes.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleOpenRefund = (order: Order, noteId: number) => {
    setRefundOrder(order);
    setRefundNoteId(noteId);
    setRefundReason('');
    setRefundStatusMsg('');
    setRefundModalOpen(true);
  };

  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundOrder || !refundNoteId || !refundReason.trim()) return;

    setIsSubmittingRefund(true);
    try {
      const res = await api.submitRefundRequest({
        order_id: refundOrder.id,
        note_id: refundNoteId,
        reason: refundReason.trim(),
      });

      if (res.success) {
        setRefundStatusMsg('Refund request submitted successfully! Our support desk will review it shortly.');
        setTimeout(() => setRefundModalOpen(false), 2000);
      } else {
        setRefundStatusMsg(res.message || 'Failed to submit refund request.');
      }
    } catch (err) {
      setRefundStatusMsg('Error submitting refund request.');
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  const filteredLibrary = libraryNotes.filter(
    (n) =>
      (n.title && n.title.toLowerCase().includes(searchLibrary.toLowerCase())) ||
      (n.chapter && n.chapter.toLowerCase().includes(searchLibrary.toLowerCase())) ||
      (n.subject && n.subject.toLowerCase().includes(searchLibrary.toLowerCase())) ||
      (n.class_level && n.class_level.toLowerCase().includes(searchLibrary.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Student Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-emerald-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-emerald-600/30">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">{user.name}</h1>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Active Student
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10">
          <div className="text-right">
            <div className="text-lg font-black text-emerald-400">{libraryNotes.length}</div>
            <div className="text-[11px] text-slate-300">Unlocked Modules</div>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div className="text-right">
            <div className="text-lg font-black text-rose-400">{wishlistNotes.length}</div>
            <div className="text-[11px] text-slate-300">Saved Bookmarks</div>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div className="text-right">
            <div className="text-lg font-black text-amber-400">{orders.length}</div>
            <div className="text-[11px] text-slate-300">Total Orders</div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-2 mb-8 overflow-x-auto">
        <button
          id="tab-btn-library"
          onClick={() => setActiveTab('library')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'library'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>My Study Library ({libraryNotes.length})</span>
        </button>

        <button
          id="tab-btn-wishlist"
          onClick={() => setActiveTab('wishlist')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'wishlist'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Saved Bookmarks ({wishlistNotes.length})</span>
        </button>

        <button
          id="tab-btn-orders"
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'orders'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Orders & Invoices ({orders.length})</span>
        </button>

        <button
          id="tab-btn-profile"
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Account Settings</span>
        </button>
      </div>

      {/* Tab 1: My Library */}
      {activeTab === 'library' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Your Unlocked Study Material</h2>
              <p className="text-xs text-slate-500">
                Direct authorized downloads with offline access and printable PDF packets.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <input
                id="library-search-input"
                type="text"
                value={searchLibrary}
                onChange={(e) => setSearchLibrary(e.target.value)}
                placeholder="Search title, chapter, or class..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-slate-100 rounded-2xl" />
              ))}
            </div>
          ) : filteredLibrary.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 space-y-4">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">No notes found in your library</h3>
                <p className="text-xs text-slate-500 mt-1">Explore our high-yield notes or grab our free revision packets.</p>
              </div>
              <button
                onClick={() => onNavigate('notes')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span>Explore Notes Marketplace</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLibrary.map((note) => (
                <div
                  key={note.id}
                  className={`bg-white rounded-2xl border ${
                    note.is_archived ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200 hover:border-emerald-300'
                  } shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                          {note.subject}
                        </span>
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {note.class_level || 'NEET'}
                        </span>
                        {note.is_archived && (
                          <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                            <Archive className="w-3 h-3" />
                            <span>Archived Note</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">{note.total_pages || 30} Pages</span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 mb-1">
                      {note.title}
                    </h3>
                    <p className="text-[11px] font-semibold text-emerald-700 mb-2">
                      {note.chapter}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4">{note.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <button
                      id={`library-read-online-btn-${note.id}`}
                      onClick={() => handleLaunchReader(note)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer flex-1 justify-center"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Read Online</span>
                    </button>
                    {allowPdfDownloads ? (
                      <button
                        id={`library-download-btn-${note.id}`}
                        onClick={() => handleDownload(note.id)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Download Raw PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Download</span>
                      </button>
                    ) : (
                      <span
                        className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1.5 rounded-lg flex items-center gap-1"
                        title="Protected against piracy: In-app reader with dynamic watermark"
                      >
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>Online Only</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Saved Bookmarks / Wishlist */}
      {activeTab === 'wishlist' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Saved Bookmarks & Target Notes</h2>
              <p className="text-xs text-slate-500">
                Your saved chapters ready for instant checkout or revision preview.
              </p>
            </div>
            <button
              onClick={() => onNavigate('notes')}
              className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              Browse Full Catalog &rarr;
            </button>
          </div>

          {wishlistNotes.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 space-y-4">
              <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
                <Heart className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Your bookmark list is empty</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Click the heart icon on any study note in the catalog to save it here for later.
                </p>
              </div>
              <button
                onClick={() => onNavigate('notes')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span>Browse Study Materials</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlistNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                          {note.subject}
                        </span>
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {note.class_level || 'NEET'}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900 text-sm">
                        {note.is_free ? 'FREE' : `₹${note.price}`}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 mb-1">
                      {note.title}
                    </h3>
                    <p className="text-[11px] font-semibold text-emerald-700 mb-2">
                      {note.chapter}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4">{note.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleRemoveBookmark(note.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove Bookmark"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onPreviewNote(note)}
                        className="text-xs text-slate-600 hover:text-slate-900 font-semibold px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => onAddToCart(note)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm shadow-emerald-600/20 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Orders & Invoices */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900">Your Purchase History & Receipts</h2>
            <p className="text-xs text-slate-500">Every completed transaction with payment identifiers.</p>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
              No orders found yet.
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
                >
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-slate-500">Order Number:</span>
                      <span className="font-mono font-bold text-slate-900 ml-1">{ord.order_number}</span>
                      <span className="text-slate-400 ml-3">
                        {new Date(ord.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900">Total: ₹{ord.total_amount}</span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
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
                    </div>
                  </div>

                  {ord.payment_status === 'pending_verification' && (
                    <div className="bg-amber-50/90 border-b border-amber-200 px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-900">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                        <span className="font-semibold">
                          Payment Submitted for Verification — Our team will verify your UTR and unlock your notes within 15–30 minutes.
                        </span>
                      </div>
                      {ord.razorpay_payment_id && (
                        <span className="font-mono font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded text-[11px] shrink-0 border border-amber-300/60">
                          UTR: {ord.razorpay_payment_id.replace(/^UPI-/, '')}
                        </span>
                      )}
                    </div>
                  )}

                  {ord.payment_status === 'rejected' && (
                    <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 flex items-center gap-2 text-xs text-rose-900">
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>
                        This payment reference could not be verified by our team. If you were charged, please reach out to support with your bank receipt.
                      </span>
                    </div>
                  )}

                  <div className="p-6 divide-y divide-slate-100">
                    {ord.items?.map((item) => (
                      <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900">{item.note_title}</h4>
                            {(item as any).is_archived && (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                                Archived
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500">₹{item.price}</span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          {ord.payment_status === 'paid' ? (
                            <>
                              <button
                                id={`order-read-btn-${item.note_id}`}
                                onClick={() => handleLaunchReaderByNoteId(item.note_id, item.note_title)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Read Online</span>
                              </button>
                              {allowPdfDownloads ? (
                                <button
                                  onClick={() => handleDownload(item.note_id)}
                                  className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download PDF</span>
                                </button>
                              ) : (
                                <span
                                  className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md flex items-center gap-1"
                                  title="In-app reading mode active with anti-piracy watermarking"
                                >
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                  <span>Online Only</span>
                                </span>
                              )}
                              <button
                                onClick={() => handleOpenRefund(ord, item.note_id)}
                                className="text-slate-400 hover:text-rose-600 text-xs px-2 py-1 transition-colors cursor-pointer"
                              >
                                Need Refund?
                              </button>
                            </>
                          ) : ord.payment_status === 'pending_verification' ? (
                            <span className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Unlocks upon verification</span>
                            </span>
                          ) : ord.payment_status === 'rejected' ? (
                            <span className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Payment Rejected</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg font-medium">
                              Pending Payment
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Account Profile Settings */}
      {activeTab === 'profile' && (
        <div className="max-w-xl bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900">Student Profile & Security</h2>
            <p className="text-xs text-slate-500">Update your details or change your password.</p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone (Optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                New Password (leave blank to keep current)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            {profileMsg && (
              <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                {profileMsg}
              </p>
            )}

            <button
              id="save-profile-btn"
              type="submit"
              disabled={isSavingProfile}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              {isSavingProfile ? 'Saving Changes...' : 'Save Profile Settings'}
            </button>
          </form>
        </div>
      )}

      {/* Refund Request Modal */}
      {refundModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Request Refund for Resource</h3>
              <button onClick={() => setRefundModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Order: <strong>{refundOrder?.order_number}</strong>. Please explain the reason for your refund request.
            </p>

            <form onSubmit={handleSubmitRefund} className="space-y-3">
              <textarea
                required
                rows={3}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g. Purchased duplicate chapter by mistake or syllabus discrepancy..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
              />

              {refundStatusMsg && (
                <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2 rounded-lg">
                  {refundStatusMsg}
                </p>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setRefundModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRefund || !refundReason.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm cursor-pointer"
                >
                  {isSubmittingRefund ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

