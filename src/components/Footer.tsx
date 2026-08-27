import React from 'react';
import { BookOpen, ShieldCheck, Zap, Award, Lock, Mail, Phone, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string, param?: any) => void;
  onOpenAdminLogin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenAdminLogin }) => {
  return (
    <footer className="bg-slate-900 text-white pt-14 pb-10 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-600/30">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-teal-400">NEET<span className="text-white">NOTES</span></span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm font-medium">
              India's premier digital study material marketplace for NEET-UG aspirants. Curated by top medical rankers and senior Kota faculty for maximum revision speed and exam recall.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold pt-2">
              <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>100% NCERT Aligned</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Instant PDF Download</span>
              </div>
            </div>
          </div>

          {/* Quick Subjects */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-teal-400">Subject Modules</h4>
            <ul className="space-y-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <li>
                <button
                  id="footer-subject-physics"
                  onClick={() => onNavigate('notes', { subject: 'Physics' })}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Physics Mechanics & PYQs
                </button>
              </li>
              <li>
                <button
                  id="footer-subject-chemistry"
                  onClick={() => onNavigate('notes', { subject: 'Chemistry' })}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Organic Reaction Maps
                </button>
              </li>
              <li>
                <button
                  id="footer-subject-biology"
                  onClick={() => onNavigate('notes', { subject: 'Biology' })}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Biology Line-by-Line Decoders
                </button>
              </li>
              <li>
                <button
                  id="footer-free-notes"
                  onClick={() => onNavigate('notes', { is_free: '1' })}
                  className="text-teal-400 hover:text-teal-300 font-black transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Free Revision Packs</span>
                  <span className="bg-teal-500/20 text-teal-300 text-[9px] px-1.5 py-0.5 rounded font-black">FREE</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Student Help & Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-teal-400">Student Desk</h4>
            <ul className="space-y-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <li>
                <button onClick={() => onNavigate('faq')} className="hover:text-white transition-colors cursor-pointer">
                  Frequently Asked Questions
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-white transition-colors cursor-pointer">
                  About Our Academic Team
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors cursor-pointer">
                  Academic Help & Support
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('terms')} className="hover:text-white transition-colors cursor-pointer">
                  Refund & Download Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Secure Guarantee & Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-teal-400">Direct Support</h4>
            <p className="text-xs text-slate-400 font-medium">Have a question regarding note bundles or instant access?</p>
            <div className="space-y-2 text-xs font-bold text-slate-300">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-teal-400 shrink-0" />
                <span>support@neetnoteshq.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                <span>+91 98765 43210 (Mon-Sat)</span>
              </div>
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700/60">
                <Lock className="w-3 h-3 text-teal-400" />
                <span>256-Bit SSL Razorpay Encryption</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-400">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-sm font-black tracking-tighter text-teal-400">NEET<span className="text-white">NOTES</span></span>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest sm:ml-2">
              &copy; {new Date().getFullYear()} Educational Marketplace Inc. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs uppercase tracking-widest text-slate-400">
            <button onClick={() => onNavigate('about')} className="hover:text-white transition-colors cursor-pointer">About</button>
            <button onClick={() => onNavigate('terms')} className="hover:text-white transition-colors cursor-pointer">Privacy</button>
            <button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors cursor-pointer">Support</button>
            <button onClick={() => onNavigate('terms')} className="hover:text-white transition-colors cursor-pointer">Refunds</button>
          </div>

          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold text-slate-300">Server Status: Online</span>
            </div>
            <button
              id="footer-admin-link"
              onClick={onOpenAdminLogin}
              className="text-[9px] font-bold uppercase tracking-wider text-slate-600 hover:text-slate-400 transition-colors cursor-pointer"
              title="Faculty & Admin Portal"
            >
              Faculty Admin Portal
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
