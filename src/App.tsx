import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Sparkles,
  BookOpen,
  ArrowUpDown,
  Download,
  ShieldCheck,
  CheckCircle2,
  Zap,
  GraduationCap,
  Heart,
  ChevronRight,
  TrendingUp,
  MessageCircle,
} from 'lucide-react';
import { Note, CartItem, User } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { NoteCard } from './components/NoteCard';
import { PreviewReaderModal } from './components/PreviewReaderModal';
import { NoteDetailModal } from './components/NoteDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AuthModal } from './components/AuthModal';
import { StudentDashboard } from './components/StudentDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AboutPage, FAQPage, ContactPage } from './components/StaticPages';

export function App() {
  // Navigation & Page View State
  const [currentView, setCurrentView] = useState<
    'home' | 'notes' | 'free' | 'dashboard' | 'admin' | 'about' | 'faq' | 'contact'
  >('home');
  const [dashboardInitialTab, setDashboardInitialTab] = useState<'library' | 'orders' | 'wishlist' | 'profile'>('library');

  // Notes Catalog Data & Filtering
  const [notes, setNotes] = useState<Note[]>([]);
  const [featuredNotes, setFeaturedNotes] = useState<Note[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('popular');
  const [freeOnly, setFreeOnly] = useState<boolean>(false);

  // User State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Cart State (Persisted in LocalStorage)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('neet_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Wishlist State (Persisted in LocalStorage)
  const [wishlistIds, setWishlistIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('neet_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'admin'>('login');
  const [previewNote, setPreviewNote] = useState<Note | null>(null);
  const [detailNoteId, setDetailNoteId] = useState<number | null>(null);

  // Sync Cart to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('neet_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  // Sync Wishlist to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('neet_wishlist', JSON.stringify(wishlistIds));
    } catch (e) {
      console.error(e);
    }
  }, [wishlistIds]);

  // Initial App Load
  useEffect(() => {
    // Check existing auth token
    const token = localStorage.getItem('neet_auth_token');
    if (token) {
      api.getMe().then((res) => {
        if (res.success && res.user) {
          setCurrentUser(res.user);
        } else {
          localStorage.removeItem('neet_auth_token');
        }
      });
    }

    // Load Notes
    fetchNotesList();
  }, []);

  // Re-fetch notes on filter change
  useEffect(() => {
    fetchNotesList();
  }, [selectedSubject, sortBy, freeOnly]);

  const fetchNotesList = async () => {
    setIsLoadingNotes(true);
    try {
      const params: any = { sort: sortBy };
      if (selectedSubject !== 'All') params.subject = selectedSubject;
      if (freeOnly || currentView === 'free') params.is_free = 'true';
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.getNotes(params);
      if (res && res.success && Array.isArray(res.notes)) {
        setNotes(res.notes);
        if (!featuredNotes.length) {
          const featured = res.notes.filter((n) => n.is_featured || n.is_bestseller);
          setFeaturedNotes(featured.length ? featured.slice(0, 4) : res.notes.slice(0, 4));
        }
      }
    } catch {
      // Fallback handled safely by API service
    } finally {
      setIsLoadingNotes(false);
    }
  };

  // Cart Handlers
  const handleAddToCart = (note: Note) => {
    setCartItems((prev) => {
      const exists = prev.find((item) => item.note.id === note.id);
      if (exists) return prev;
      return [...prev, { note, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleBuyNow = (note: Note) => {
    setCartItems((prev) => {
      const exists = prev.find((item) => item.note.id === note.id);
      if (exists) return prev;
      return [...prev, { note, quantity: 1 }];
    });
    setIsCheckoutOpen(true);
  };

  const handleRemoveCartItem = (noteId: number) => {
    setCartItems((prev) => prev.filter((i) => i.note.id !== noteId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Wishlist Toggle
  const handleToggleWishlist = (noteId: number) => {
    setWishlistIds((prev) => {
      if (prev.includes(noteId)) {
        return prev.filter((id) => id !== noteId);
      } else {
        return [...prev, noteId];
      }
    });
  };

  // Auth Handlers
  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setCurrentView('admin');
    }
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setCurrentView('home');
  };

  // Navigation Handler
  const handleNavigate = (view: string, param?: any) => {
    if (view === 'library') {
      if (!currentUser) {
        setAuthMode('login');
        setIsAuthOpen(true);
        return;
      }
      setDashboardInitialTab('library');
      setCurrentView('dashboard');
    } else if (view === 'dashboard') {
      if (!currentUser) {
        setAuthMode('login');
        setIsAuthOpen(true);
        return;
      }
      setDashboardInitialTab(param || 'library');
      setCurrentView('dashboard');
    } else if (view === 'admin') {
      if (!currentUser || currentUser.role !== 'admin') {
        setAuthMode('admin');
        setIsAuthOpen(true);
        return;
      }
      setCurrentView('admin');
    } else if (view === 'free') {
      setFreeOnly(true);
      setCurrentView('notes');
    } else if (view === 'notes') {
      if (param) {
        if (typeof param === 'object' && param.subject) {
          setSelectedSubject(param.subject);
        } else if (typeof param === 'string') {
          setSelectedSubject(param);
        }
      }
      setFreeOnly(false);
      setCurrentView('notes');
    } else {
      setCurrentView(view as any);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white text-xs py-2 px-4 text-center font-bold tracking-wide flex items-center justify-center gap-2 shadow-xs">
        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
        <span>NEET 2026 Aspirants: Use code <strong>NEET20</strong> for 20% OFF on all study modules!</span>
      </div>

      {/* Main Navbar */}
      <Navbar
        user={currentUser}
        cartCount={cartItems.length}
        wishlistCount={wishlistIds.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={(mode) => {
          setAuthMode(mode || 'login');
          setIsAuthOpen(true);
        }}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        currentView={currentView}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={() => {
          handleNavigate('notes');
          fetchNotesList();
        }}
      />

      {/* Main Content Area Based on Current View */}
      <main className="flex-1">
        {/* VIEW 1: HOME PAGE */}
        {currentView === 'home' && (
          <div className="space-y-16 pb-16">
            {/* Hero Section */}
            <HeroSection
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSearchSubmit={() => {
                handleNavigate('notes');
                fetchNotesList();
              }}
              onExplore={(sub) => {
                if (sub) setSelectedSubject(sub);
                handleNavigate('notes');
              }}
              onFreeResources={() => handleNavigate('free')}
            />

            {/* Subject Categories Strip */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  id="cat-physics-btn"
                  onClick={() => {
                    setSelectedSubject('Physics');
                    handleNavigate('notes');
                  }}
                  className="bg-white hover:bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-left flex items-center justify-between group cursor-pointer"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Physics</span>
                    <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-teal-600 transition-colors">
                      Mechanics & PYQs
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">Formula sheets & decoders</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">
                    ⚡
                  </div>
                </button>

                <button
                  id="cat-chemistry-btn"
                  onClick={() => {
                    setSelectedSubject('Chemistry');
                    handleNavigate('notes');
                  }}
                  className="bg-white hover:bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-left flex items-center justify-between group cursor-pointer"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Chemistry</span>
                    <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-teal-600 transition-colors">
                      Organic & Inorganic
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">Reaction mechanisms</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">
                    🧪
                  </div>
                </button>

                <button
                  id="cat-biology-btn"
                  onClick={() => {
                    setSelectedSubject('Biology');
                    handleNavigate('notes');
                  }}
                  className="bg-white hover:bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-left flex items-center justify-between group cursor-pointer"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-teal-600 tracking-widest">Biology</span>
                    <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-teal-600 transition-colors">
                      Physiology & NCERT
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">Line-by-line decoders</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">
                    🌿
                  </div>
                </button>

                <button
                  id="cat-free-btn"
                  onClick={() => handleNavigate('free')}
                  className="bg-teal-700 hover:bg-teal-800 text-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all text-left flex items-center justify-between group cursor-pointer"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-teal-200 tracking-widest">100% Free</span>
                    <h3 className="font-extrabold text-white text-sm">
                      Free Revision Packs
                    </h3>
                    <p className="text-[11px] text-teal-100 font-medium">Sample diagrams & tables</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">
                    🎁
                  </div>
                </button>
              </div>
            </div>

            {/* Featured High-Yield Notes Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-black uppercase tracking-tight text-slate-800 italic">
                    Featured Resources
                  </h2>
                  <span className="text-xs font-black uppercase tracking-widest text-teal-700 bg-teal-100 px-2.5 py-0.5 rounded-full">
                    Top Picks
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setSelectedSubject('All'); handleNavigate('notes'); }}
                    className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs font-bold hover:bg-teal-200 transition-colors cursor-pointer"
                  >
                    All
                  </button>
                  <button
                    onClick={() => { setSelectedSubject('Physics'); handleNavigate('notes'); }}
                    className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-xs font-bold hover:bg-slate-300 transition-colors cursor-pointer"
                  >
                    Physics
                  </button>
                  <button
                    onClick={() => { setSelectedSubject('Chemistry'); handleNavigate('notes'); }}
                    className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-xs font-bold hover:bg-slate-300 transition-colors cursor-pointer"
                  >
                    Chemistry
                  </button>
                  <button
                    onClick={() => { setSelectedSubject('Biology'); handleNavigate('notes'); }}
                    className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-xs font-bold hover:bg-slate-300 transition-colors cursor-pointer"
                  >
                    Biology
                  </button>
                </div>
              </div>

              {/* Grid of Note Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {notes.slice(0, 8).map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onPreview={(n) => setPreviewNote(n)}
                    onAddToCart={(n) => handleAddToCart(n)}
                    onBuyNow={(n) => handleBuyNow(n)}
                    onOpenDetail={(id) => setDetailNoteId(id)}
                    onToggleWishlist={handleToggleWishlist}
                    isWishlisted={wishlistIds.includes(note.id)}
                  />
                ))}
              </div>
            </div>

            {/* Why Top Rankers Trust This Marketplace */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden border border-slate-800">
                <div className="max-w-2xl space-y-4 relative z-10">
                  <span className="bg-teal-500/20 text-teal-300 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    Pedagogical Standard
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                    Why 15,000+ NEET Aspirants Rely on These Handcrafted Notes
                  </h2>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
                    Designed to maximize your revision speed in the final 60 days before the NEET exam. Cut through 1,200 pages of heavy textbooks in crisp, highly visual 30-page modules.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs font-bold">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>Zero irrelevant filler — strictly NCERT</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>High-resolution color flowcharts</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>Instant PDF downloads upon checkout</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>24/7 personal student library access</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: NOTES EXPLORER / CATALOG */}
        {currentView === 'notes' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
            {/* Header & Filter Controls */}
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                    {freeOnly ? 'Free NEET Study Packs' : 'Complete NEET Study Notes Catalog'}
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Showing {notes.length} curated study modules mapped to the rationalized syllabus.
                  </p>
                </div>

                {/* Filter Options */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Subject Pills */}
                  <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold">
                    {['All', 'Physics', 'Chemistry', 'Biology'].map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setSelectedSubject(sub)}
                        className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                          selectedSubject === sub
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>

                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-transparent outline-none cursor-pointer text-slate-700 font-bold"
                    >
                      <option value="popular">Most Popular</option>
                      <option value="rating">Highest Rated</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="newest">Recently Added</option>
                    </select>
                  </div>

                  {/* Free Filter Toggle */}
                  <button
                    onClick={() => setFreeOnly(!freeOnly)}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                      freeOnly
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {freeOnly ? '✓ Free Only' : 'Show Free Only'}
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <input
                  id="catalog-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by chapter name, topic or keywords (e.g. Optics, Aldehydes, Genetics)..."
                  className="w-full text-xs pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-200 shadow-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Catalog Grid */}
            {isLoadingNotes ? (
              <div className="py-24 text-center text-slate-400 text-sm">
                Loading verified study materials...
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 space-y-3">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No notes matched your search criteria</h3>
                <p className="text-xs text-slate-500">Try clearing your filters or search for another chapter name.</p>
                <button
                  onClick={() => {
                    setSelectedSubject('All');
                    setSearchQuery('');
                    setFreeOnly(false);
                  }}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onPreview={(n) => setPreviewNote(n)}
                    onAddToCart={(n) => handleAddToCart(n)}
                    onBuyNow={(n) => handleBuyNow(n)}
                    onOpenDetail={(id) => setDetailNoteId(id)}
                    onToggleWishlist={handleToggleWishlist}
                    isWishlisted={wishlistIds.includes(note.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: STUDENT DASHBOARD */}
        {currentView === 'dashboard' && currentUser && (
          <StudentDashboard
            user={currentUser}
            initialTab={dashboardInitialTab}
            onNavigate={handleNavigate}
            onPreviewNote={(n) => setPreviewNote(n)}
            onAddToCart={handleAddToCart}
            onUpdateUser={(updated) => setCurrentUser(updated)}
          />
        )}

        {/* VIEW 4: ADMIN / FACULTY DASHBOARD */}
        {currentView === 'admin' && <AdminDashboard />}

        {/* VIEW 5: ABOUT US */}
        {currentView === 'about' && <AboutPage />}

        {/* VIEW 6: FAQ */}
        {currentView === 'faq' && <FAQPage />}

        {/* VIEW 7: CONTACT US */}
        {currentView === 'contact' && <ContactPage />}
      </main>

      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenAdminLogin={() => {
          setAuthMode('admin');
          setIsAuthOpen(true);
        }}
      />

      {/* Floating WhatsApp Quick Helpdesk (Hidden Direct Redirect) */}
      <a
        id="floating-whatsapp-support-btn"
        href="https://wa.me/917989725471?text=Hello%20NEET%20Notes%20Team%2C%20I%20have%20a%20query%20regarding%20study%20materials"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 sm:px-4 sm:py-3 rounded-full shadow-lg shadow-emerald-700/30 flex items-center gap-2.5 transition-all hover:scale-105 group border-2 border-white/20"
        title="Direct WhatsApp Faculty Helpdesk"
      >
        <MessageCircle className="w-5 h-5 text-white" />
        <span className="hidden sm:inline text-xs font-black uppercase tracking-wider">
          Faculty Helpdesk
        </span>
      </a>

      {/* 1. Preview Reader Modal (Free 3-5 pages viewer) */}
      <PreviewReaderModal
        note={previewNote}
        isOpen={Boolean(previewNote)}
        onClose={() => setPreviewNote(null)}
        onAddToCart={(n) => {
          setPreviewNote(null);
          handleAddToCart(n);
        }}
        onBuyNow={(n) => {
          setPreviewNote(null);
          handleBuyNow(n);
        }}
      />

      {/* 2. Detailed Note Modal */}
      <NoteDetailModal
        noteId={detailNoteId}
        isOpen={Boolean(detailNoteId)}
        onClose={() => setDetailNoteId(null)}
        onPreview={(n) => setPreviewNote(n)}
        onAddToCart={(n) => handleAddToCart(n)}
        onBuyNow={(n) => handleBuyNow(n)}
        onToggleWishlist={handleToggleWishlist}
        user={currentUser}
        onOpenAuth={() => {
          setAuthMode('login');
          setIsAuthOpen(true);
        }}
        isWishlisted={detailNoteId ? wishlistIds.includes(detailNoteId) : false}
      />

      {/* 3. Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onProceedToCheckout={(coupon) => {
          setAppliedCoupon(coupon);
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        onBrowseNotes={() => handleNavigate('notes')}
      />

      {/* 4. Checkout Modal (Razorpay + Verified Gateway) */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        appliedCoupon={appliedCoupon}
        user={currentUser}
        onOpenAuth={() => {
          setIsCheckoutOpen(false);
          setAuthMode('login');
          setIsAuthOpen(true);
        }}
        onSuccess={() => {
          setCartItems([]);
          handleNavigate('library');
        }}
      />

      {/* 5. Auth Modal (Login / Register / Faculty Admin) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default App;
