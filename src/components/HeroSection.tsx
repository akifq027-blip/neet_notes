import React from 'react';
import { Search, Sparkles, BookOpen, Download, ChevronRight, ShieldCheck, Zap, Award, CheckCircle2 } from 'lucide-react';

interface HeroSectionProps {
  onSearchChange: (q: string) => void;
  onSearchSubmit: () => void;
  searchQuery: string;
  onExplore: (filterParam?: string | { class_level?: string; subject?: string }) => void;
  onFreeResources: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSearchChange,
  onSearchSubmit,
  searchQuery,
  onExplore,
  onFreeResources,
}) => {
  return (
    <header className="bg-teal-700 text-white relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-24">
      {/* Background Decorative Circles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-600 rounded-full -mr-24 -mt-24 opacity-40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-800 rounded-full -ml-20 -mb-20 opacity-40 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          {/* Main Headline & Info */}
          <div className="max-w-2xl space-y-5 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-800/80 border border-teal-500/40 text-teal-200 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-teal-300 animate-pulse" />
              <span>NCERT Notes for Class 8, 9, 10, 11, 12 & NEET Aspirants</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-tight sm:leading-none tracking-tight">
              MASTER NCERT & ACES <br />
              WITH <span className="text-teal-300">TOPPER NOTES.</span>
            </h1>

            <p className="text-teal-100 text-sm sm:text-lg font-medium opacity-90 max-w-xl leading-relaxed">
              Concise chapter notes, formula sheets, NCERT exemplar decoders, and high-yield question banks for Class 8–12 Board Exams & NEET.
            </p>

            {/* Search Input Bar */}
            <div className="pt-2 max-w-xl">
              <div className="relative flex items-center shadow-xl rounded-full bg-white text-slate-800 p-1 sm:p-1.5 focus-within:ring-4 focus-within:ring-teal-400/30 transition-all">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 ml-3 sm:ml-3.5 shrink-0" />
                <input
                  id="hero-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
                  placeholder="Search class, subject, chapter..."
                  className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-xs sm:text-sm px-2.5 sm:px-3 py-2 sm:py-2.5 focus:outline-none font-medium"
                />
                <button
                  id="hero-search-btn"
                  onClick={onSearchSubmit}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider px-4 sm:px-5 py-2 sm:py-2.5 rounded-full transition-all shrink-0 cursor-pointer"
                >
                  Search
                </button>
              </div>

              {/* Quick Find Tags for Classes & Subjects */}
              <div className="flex items-center gap-1.5 sm:gap-2 pt-3 text-xs font-bold overflow-x-auto pb-1 scrollbar-none">
                <span className="text-teal-200 uppercase tracking-wider text-[11px] shrink-0">Class:</span>
                {['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'NEET'].map((cls) => (
                  <button
                    key={cls}
                    onClick={() => onExplore({ class_level: cls })}
                    className="px-2.5 py-1 rounded-full bg-teal-800/80 hover:bg-teal-800 text-white border border-teal-600/50 transition-colors cursor-pointer text-xs shrink-0 whitespace-nowrap"
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3">
              <button
                id="hero-explore-btn"
                onClick={() => onExplore()}
                className="w-full sm:w-auto bg-white text-teal-800 hover:bg-teal-50 px-6 py-3.5 sm:py-3 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-teal-700" />
                <span>Explore All Notes</span>
                <ChevronRight className="w-4 h-4 text-teal-700" />
              </button>

              <button
                id="hero-free-btn"
                onClick={onFreeResources}
                className="w-full sm:w-auto bg-teal-800 text-white px-6 py-3.5 sm:py-3 rounded-xl font-bold border border-teal-500 hover:bg-teal-900 transition-all text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-teal-300" />
                <span>Download Free Samples</span>
              </button>
            </div>
          </div>

          {/* Right Floating Stats Strip in Hero */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:flex lg:flex-col lg:space-y-4 lg:w-72 shrink-0">
            <div className="bg-teal-800/80 backdrop-blur-xs border border-teal-600/40 p-4 sm:p-5 rounded-2xl">
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-white">25K+</div>
              <div className="text-teal-200 text-[11px] sm:text-xs font-bold uppercase tracking-widest mt-1">Class 8–12 & NEET Users</div>
            </div>

            <div className="bg-teal-800/80 backdrop-blur-xs border border-teal-600/40 p-4 sm:p-5 rounded-2xl">
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-teal-300">500+</div>
              <div className="text-teal-200 text-[11px] sm:text-xs font-bold uppercase tracking-widest mt-1">NCERT Chapters Covered</div>
            </div>

            <div className="bg-teal-800/80 backdrop-blur-xs border border-teal-600/40 p-4 sm:p-5 rounded-2xl col-span-2 lg:col-span-1">
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-amber-300">4.9 ★</div>
              <div className="text-teal-200 text-[11px] sm:text-xs font-bold uppercase tracking-widest mt-1">Highest Rated Materials</div>
            </div>
          </div>
        </div>

        {/* Feature Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-teal-600/60 text-[11px] sm:text-xs font-bold">
          <div className="flex items-center gap-2 bg-teal-800/50 p-2.5 sm:p-3 rounded-xl border border-teal-600/40">
            <ShieldCheck className="w-4 h-4 text-teal-300 shrink-0" />
            <span className="text-white uppercase tracking-wider">100% NCERT Aligned</span>
          </div>
          <div className="flex items-center gap-2 bg-teal-800/50 p-2.5 sm:p-3 rounded-xl border border-teal-600/40">
            <Zap className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="text-white uppercase tracking-wider">Instant PDF Unlock</span>
          </div>
          <div className="flex items-center gap-2 bg-teal-800/50 p-2.5 sm:p-3 rounded-xl border border-teal-600/40">
            <Award className="w-4 h-4 text-teal-300 shrink-0" />
            <span className="text-white uppercase tracking-wider">Top Faculty Curated</span>
          </div>
          <div className="flex items-center gap-2 bg-teal-800/50 p-2.5 sm:p-3 rounded-xl border border-teal-600/40">
            <CheckCircle2 className="w-4 h-4 text-teal-300 shrink-0" />
            <span className="text-white uppercase tracking-wider">Verified Razorpay / UPI</span>
          </div>
        </div>
      </div>
    </header>
  );
};
