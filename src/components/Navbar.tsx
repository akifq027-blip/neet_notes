import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  ShoppingCart,
  Heart,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Sparkles,
  Download,
  FileText,
  HelpCircle,
  PhoneCall,
  Info,
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  cartCount: number;
  wishlistCount: number;
  currentView: string;
  onNavigate: (view: string, param?: any) => void;
  onOpenAuth: (mode?: 'login' | 'register' | 'admin') => void;
  onOpenCart: () => void;
  onLogout: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  announcement?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  cartCount,
  wishlistCount,
  currentView,
  onNavigate,
  onOpenAuth,
  onOpenCart,
  onLogout,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  announcement = '🎉 NEET 2026 Aspirants: Use code NEET20 for 20% OFF on all high-yield notes!',
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearchSubmit();
      if (mobileMenuOpen) setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 w-full max-w-full overflow-hidden">
      {/* Top Announcement Bar */}
      {announcement && (
        <div className="bg-teal-800 text-teal-100 text-xs sm:text-sm py-2 px-3 sm:px-4 text-center font-bold tracking-wide flex items-center justify-center gap-2 w-full max-w-full overflow-hidden">
          <Sparkles className="w-4 h-4 text-teal-300 animate-pulse shrink-0 hidden sm:inline" />
          <span className="truncate max-w-[92vw] sm:max-w-none">{announcement}</span>
        </div>
      )}

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          {/* Brand Logo */}
          <button
            id="brand-logo-btn"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 sm:gap-3 text-left group cursor-pointer focus:outline-none shrink-0"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-teal-700 flex items-center justify-center text-white shadow-md shadow-teal-700/20 group-hover:scale-105 transition-transform shrink-0">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tighter text-teal-600">NCERT<span className="text-slate-800">NOTES</span></span>
                <span className="bg-teal-100 text-teal-800 text-[10px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase hidden md:inline-block">8–12 & NEET</span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold tracking-wider uppercase hidden sm:block">Notes for Class 8–12 & NEET</p>
            </div>
          </button>

          {/* Desktop Search Bar (large screens only) */}
          <div className="hidden xl:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                id="desktop-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                placeholder="Search Biology PYQs, Organic Mechanisms..."
                className="w-full bg-slate-100 hover:bg-slate-100/90 focus:bg-white text-slate-800 text-sm pl-10 pr-20 py-2 rounded-full border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 font-medium transition-all outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                id="desktop-search-btn"
                onClick={onSearchSubmit}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full transition-colors cursor-pointer"
              >
                Search
              </button>
            </div>
          </div>

          {/* Desktop Navigation Links (only on lg: 1024px+) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-bold text-slate-600 shrink-0">
            <button
              id="nav-notes-btn"
              onClick={() => onNavigate('notes')}
              className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                currentView === 'notes' ? 'text-teal-600 bg-teal-50' : 'hover:text-teal-600 hover:bg-slate-50'
              }`}
            >
              Marketplace
            </button>
            <button
              id="nav-library-btn"
              onClick={() => onNavigate('library')}
              className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                currentView === 'dashboard' ? 'text-teal-600 bg-teal-50' : 'hover:text-teal-600 hover:bg-slate-50'
              }`}
            >
              My Library
            </button>
            <button
              id="nav-free-btn"
              onClick={() => onNavigate('notes', { is_free: '1' })}
              className="px-3 py-2 rounded-lg text-teal-700 bg-teal-50 hover:bg-teal-100 flex items-center gap-1.5 transition-colors cursor-pointer font-bold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Free Resources</span>
            </button>
            <button
              id="nav-faq-btn"
              onClick={() => onNavigate('faq')}
              className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                currentView === 'faq' ? 'text-teal-600 bg-teal-50' : 'hover:text-teal-600 hover:bg-slate-50'
              }`}
            >
              FAQ
            </button>
          </nav>

          {/* Action Icons & User Menu */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Mobile/Tablet Compact Search Toggle Button (< lg) */}
            <button
              id="mobile-search-toggle-btn"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Search notes"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist Button (Students) - Desktop (>= lg) */}
            {user && (
              <button
                id="navbar-wishlist-btn"
                onClick={() => onNavigate('dashboard', 'wishlist')}
                title="Wishlist"
                className="hidden lg:flex relative p-2.5 rounded-full text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 bg-rose-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </button>
            )}

            {/* Shopping Cart Button */}
            <button
              id="navbar-cart-btn"
              onClick={onOpenCart}
              className="relative p-2 rounded-xl text-slate-700 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-teal-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Account / Auth Buttons - Desktop Only (>= lg) */}
            {user ? (
              <div className="hidden lg:block relative">
                <button
                  id="user-menu-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-3 py-1 rounded-full border-2 border-teal-200 hover:border-teal-400 bg-teal-50/50 hover:bg-teal-50 transition-all cursor-pointer"
                >
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-teal-100 text-teal-700 font-black text-xs sm:text-sm flex items-center justify-center border border-teal-200">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-slate-800 max-w-[80px] truncate hidden md:inline">
                    {user.name.split(' ')[0]}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-sm animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="font-extrabold text-slate-900 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 font-medium truncate">{user.email}</p>
                      {user.role === 'admin' && (
                        <span className="inline-block mt-1 bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded tracking-wide uppercase">
                          Faculty Admin
                        </span>
                      )}
                    </div>

                    <button
                      id="dropdown-library-btn"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate('dashboard', 'library');
                      }}
                      className="w-full text-left px-4 py-2.5 text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2.5 font-bold cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 text-teal-600" />
                      <span>My Library</span>
                    </button>

                    <button
                      id="dropdown-orders-btn"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate('dashboard', 'orders');
                      }}
                      className="w-full text-left px-4 py-2.5 text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2.5 font-bold cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>My Orders & Invoices</span>
                    </button>

                    <button
                      id="dropdown-profile-btn"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate('dashboard', 'profile');
                      }}
                      className="w-full text-left px-4 py-2.5 text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2.5 font-bold cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>Profile Settings</span>
                    </button>

                    {user.role === 'admin' && (
                      <button
                        id="dropdown-admin-btn"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigate('admin');
                        }}
                        className="w-full text-left px-4 py-2.5 text-amber-900 bg-amber-50 hover:bg-amber-100 flex items-center gap-2.5 font-black cursor-pointer border-t border-b border-amber-200"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        <span>Admin Control Panel</span>
                      </button>
                    )}

                    <button
                      id="dropdown-logout-btn"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-bold cursor-pointer mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-1.5 sm:gap-2">
                <button
                  id="navbar-login-btn"
                  onClick={() => onOpenAuth('login')}
                  className="text-xs sm:text-sm font-bold text-slate-700 hover:text-teal-600 px-2.5 sm:px-3.5 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Log In
                </button>
                <button
                  id="navbar-register-btn"
                  onClick={() => onOpenAuth('register')}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-black uppercase tracking-wider px-3 sm:px-4 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile / Tablet Menu Toggle Button */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Search Bar & Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 py-4 space-y-3.5 animate-in fade-in duration-150 max-h-[80vh] overflow-y-auto">
            {/* Mobile Search Input */}
            <div className="relative px-2">
              <input
                id="mobile-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                placeholder="Search notes, chapters, NCERT..."
                className="w-full bg-slate-100 text-slate-800 text-sm pl-9 pr-16 py-2.5 rounded-full border border-slate-200 focus:border-teal-500 focus:bg-white outline-none font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-5 top-1/2 -translate-y-1/2" />
              <button
                onClick={() => {
                  onSearchSubmit();
                  setMobileMenuOpen(false);
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3.5 py-1 rounded-full cursor-pointer transition-colors"
              >
                Go
              </button>
            </div>

            {/* User Account / Profile Section in Drawer */}
            {user ? (
              <div className="mx-2 p-3.5 bg-teal-50/80 border border-teal-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-black flex items-center justify-center text-sm shrink-0 shadow-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-slate-900 truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    {user.role === 'admin' && (
                      <span className="inline-block bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded tracking-wide uppercase mt-0.5">
                        Faculty Admin
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-teal-200/60 text-xs font-bold">
                  <button
                    id="mobile-drawer-library-btn"
                    onClick={() => {
                      onNavigate('dashboard', 'library');
                      setMobileMenuOpen(false);
                    }}
                    className="p-2.5 rounded-xl bg-white text-teal-900 border border-teal-200/60 flex items-center gap-2 hover:bg-teal-100 transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-teal-600" />
                    <span>My Library</span>
                  </button>
                  <button
                    id="mobile-drawer-orders-btn"
                    onClick={() => {
                      onNavigate('dashboard', 'orders');
                      setMobileMenuOpen(false);
                    }}
                    className="p-2.5 rounded-xl bg-white text-slate-800 border border-slate-200 flex items-center gap-2 hover:bg-slate-50 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span>My Orders</span>
                  </button>
                  <button
                    id="mobile-drawer-wishlist-btn"
                    onClick={() => {
                      onNavigate('dashboard', 'wishlist');
                      setMobileMenuOpen(false);
                    }}
                    className="p-2.5 rounded-xl bg-white text-slate-800 border border-slate-200 flex items-center gap-2 hover:bg-slate-50 transition-colors"
                  >
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span>Saved ({wishlistCount})</span>
                  </button>
                  <button
                    id="mobile-drawer-profile-btn"
                    onClick={() => {
                      onNavigate('dashboard', 'profile');
                      setMobileMenuOpen(false);
                    }}
                    className="p-2.5 rounded-xl bg-white text-slate-800 border border-slate-200 flex items-center gap-2 hover:bg-slate-50 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-slate-500" />
                    <span>Profile</span>
                  </button>
                </div>

                {user.role === 'admin' && (
                  <button
                    id="mobile-drawer-admin-btn"
                    onClick={() => {
                      onNavigate('admin');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Open Admin Control Panel</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="mx-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900">Student Account</p>
                  <p className="text-[11px] text-slate-500">Sign in to sync your notes</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    id="mobile-drawer-login-btn"
                    onClick={() => {
                      onOpenAuth('login');
                      setMobileMenuOpen(false);
                    }}
                    className="bg-white border border-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-100"
                  >
                    Log In
                  </button>
                  <button
                    id="mobile-drawer-register-btn"
                    onClick={() => {
                      onOpenAuth('register');
                      setMobileMenuOpen(false);
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg cursor-pointer"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            )}

            {/* Quick Filter Navigation Grid */}
            <div className="grid grid-cols-2 gap-2 px-2">
              <button
                onClick={() => {
                  onNavigate('notes');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 p-3 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                <BookOpen className="w-4 h-4 text-teal-600" />
                <span>All Notes Catalog</span>
              </button>
              <button
                onClick={() => {
                  onNavigate('notes', { is_free: '1' });
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 p-3 rounded-xl bg-teal-100 text-teal-900 text-xs font-bold hover:bg-teal-200 transition-colors"
              >
                <Download className="w-4 h-4 text-teal-700" />
                <span>Free Study Notes</span>
              </button>
              <button
                onClick={() => {
                  onNavigate('notes', { subject: 'Physics' });
                  setMobileMenuOpen(false);
                }}
                className="p-3 rounded-xl bg-blue-50 text-blue-900 text-xs font-bold text-left hover:bg-blue-100 transition-colors"
              >
                ⚡ Physics Notes
              </button>
              <button
                onClick={() => {
                  onNavigate('notes', { subject: 'Chemistry' });
                  setMobileMenuOpen(false);
                }}
                className="p-3 rounded-xl bg-amber-50 text-amber-900 text-xs font-bold text-left hover:bg-amber-100 transition-colors"
              >
                🧪 Chemistry Notes
              </button>
              <button
                onClick={() => {
                  onNavigate('notes', { subject: 'Biology' });
                  setMobileMenuOpen(false);
                }}
                className="p-3 rounded-xl bg-teal-50 text-teal-900 text-xs font-bold text-left col-span-2 hover:bg-teal-100 transition-colors flex items-center justify-between"
              >
                <span>🌿 Biology NCERT Modules</span>
                <span className="text-[10px] uppercase font-mono font-bold bg-teal-200/80 text-teal-950 px-2 py-0.5 rounded">High Yield</span>
              </button>
            </div>

            {/* Target Classes Horizontal Scroll */}
            <div className="px-2 pt-1">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Quick Jump by Class:</p>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'NEET UG'].map((cls) => (
                  <button
                    key={cls}
                    onClick={() => {
                      onNavigate('notes', { class_level: cls });
                      setMobileMenuOpen(false);
                    }}
                    className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Auxiliary Links */}
            <div className="border-t border-slate-100 pt-3 px-2 flex justify-around text-xs text-slate-600 font-bold uppercase tracking-wider">
              <button onClick={() => { onNavigate('about'); setMobileMenuOpen(false); }} className="py-1">About Us</button>
              <button onClick={() => { onNavigate('faq'); setMobileMenuOpen(false); }} className="py-1">FAQ</button>
              <button onClick={() => { onNavigate('contact'); setMobileMenuOpen(false); }} className="py-1">Support</button>
              {user && (
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-rose-600 py-1"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
