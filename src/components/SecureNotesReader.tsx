import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sun,
  Moon,
  Coffee,
  ShieldCheck,
  ShieldAlert,
  BookOpen,
  Bookmark,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  Lock,
  List,
  Eye,
  FileText,
} from 'lucide-react';
import { Note, User, SecureReaderPage } from '../types';
import { api } from '../services/api';

interface SecureNotesReaderProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

type ReadingTheme = 'light' | 'dark' | 'sepia';

export const SecureNotesReader: React.FC<SecureNotesReaderProps> = ({
  note,
  isOpen,
  onClose,
  currentUser,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(8);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [theme, setTheme] = useState<ReadingTheme>('light');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [pages, setPages] = useState<SecureReaderPage[]>([]);
  const [license, setLicense] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'pdf' | 'text'>('pdf');
  const [securityAlert, setSecurityAlert] = useState<string | null>(null);
  const [isContentBlurred, setIsContentBlurred] = useState(false);
  const [floatingWatermarkPos, setFloatingWatermarkPos] = useState({ top: '20%', left: '15%' });

  const readerContainerRef = useRef<HTMLDivElement>(null);
  const alertTimeoutRef = useRef<any>(null);

  // Security warning trigger with auto-dismiss
  const triggerSecurityNotice = useCallback((msg: string) => {
    setSecurityAlert(msg);
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    alertTimeoutRef.current = setTimeout(() => {
      setSecurityAlert(null);
    }, 4500);
  }, []);

  // Fetch reader content & license
  useEffect(() => {
    if (!isOpen || !note) return;

    let isMounted = true;
    setIsLoading(true);
    setCurrentPage(1);

    const loadContent = async () => {
      try {
        const res = await api.getSecureReaderContent(note.id);
        if (isMounted) {
          if (res.success && res.pages && res.pages.length > 0) {
            setPages(res.pages);
            setTotalPages(res.pages.length);
            setLicense(res.license);
          } else {
            // Fallback generated pages if not received
            generateLocalPages(note);
          }
        }
      } catch (err) {
        if (isMounted) {
          generateLocalPages(note);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadContent();

    return () => {
      isMounted = false;
    };
  }, [isOpen, note]);

  // Fallback generator for comprehensive study material
  const generateLocalPages = (n: Note) => {
    const fallbackList: SecureReaderPage[] = [
      {
        pageNumber: 1,
        sectionTitle: 'Chapter Blueprint & Exam Syllabus Weightage',
        badge: 'High-Yield Syllabus Mapping',
        paragraphs: [
          `Master syllabus breakdown for ${n.chapter || n.title} (${n.subject}). Verified against recent entrance examination patterns.`,
          'Historically carries 2 to 4 direct examination questions in competitive testing.',
        ],
        bulletPoints: [
          'Direct Assertion & Reason links with line-by-line NCERT references.',
          'Critical exceptions and high-negative-marking traps flagged by AIIMS rankers.',
          'Formulae arranged in increasing complexity with dimensional shortcuts.',
          'Standard SI unit consistency matrix.',
        ],
        infobox: {
          title: 'Study Strategy',
          text: 'Master the primary conceptual mechanisms first, then complete the 25-question timed self-test drill.',
        },
      },
      {
        pageNumber: 2,
        sectionTitle: 'NCERT Line-by-Line Core Concepts & Axioms',
        badge: 'Fundamental Concepts',
        paragraphs: [
          `Key concept breakdown: Understanding fundamental laws in ${n.chapter} eliminates 90% of exam distractor options.`,
          'Always check valid boundaries before applying shortcuts.',
        ],
        bulletPoints: [
          'Axiom 1: Conservation principles strictly hold across all isolated state transformations.',
          'Axiom 2: Proportionality relationships must account for second-order temperature/concentration effects.',
          'Axiom 3: Biological systems maintain homeostasis through negative feedback enzymatic regulation.',
          'NCERT Box Highlight: Special nomenclature conventions highlighted in latest textbook revisions.',
        ],
        diagramNote: `Schematic: Sequential transformations and regulatory feedback loops in ${n.chapter}.`,
      },
      {
        pageNumber: 3,
        sectionTitle: 'High-Speed Formulae Sheet & Dimensional Shortcuts',
        badge: 'Master Equations & Constants',
        paragraphs: [
          'Quick reference matrix designed to eliminate prolonged calculations during timed entrance examinations.',
        ],
        bulletPoints: [
          'Primary Equation 1: Rate / Magnitude = [k × (Variable₁)^α] / [(Variable₂)^β + Constant]',
          'Shortcut Derivation: When Variable₂ is exceedingly large, the rate reduces to pseudo-first order behavior.',
          'Sign Conventions: Always assign positive (+) to energy absorption / inward fluxes and negative (-) to dissipation / outward losses.',
          'Dimensional Check: Rapidly verify algebraic expressions by ensuring LHS units identically match RHS units before calculating numbers.',
        ],
        infobox: {
          title: 'Speed Hack',
          text: 'Use approximation methods: Convert 9.8 m/s² to ~10 for rapid option elimination unless options are within 2% margin.',
        },
      },
      {
        pageNumber: 4,
        sectionTitle: 'High-Yield Mnemonics & Reaction/Mechanism Maps',
        badge: 'Memory Retention Boosters',
        paragraphs: [
          'Memorable acronyms and visual maps proven to guarantee instant recall under high-stress exam conditions.',
        ],
        bulletPoints: [
          'Mnemonic Rule 1: "KING PHILLIP CAME OVER FOR GOOD SOUP" (Kingdom, Phylum, Class, Order, Family, Genus, Species).',
          'Mnemonic Rule 2: "OIL RIG" (Oxidation Is Loss, Reduction Is Gain).',
          'Mnemonic Rule 3: Right-hand palm rule for directional vectors in 3D coordinate geometries.',
          'Exception Decoder: Transition anomalies occur precisely at d⁴ and d⁹ configurations.',
        ],
        diagramNote: `Memory Map: Color-coded flowchart connecting all sub-topics in ${n.chapter}.`,
      },
      {
        pageNumber: 5,
        sectionTitle: 'Solved Exemplar Problems with Step-by-Step Logic',
        badge: 'Step-by-Step Exemplars',
        paragraphs: [
          'Handpicked illustrative problems showing both the textbook method and the 15-second topper elimination shortcut.',
        ],
        bulletPoints: [
          'Problem 1 (Multi-Statement): Given conditions X, Y, and Z, evaluate which conclusions are thermodynamically/biologically consistent.',
          'Solution Step 1: Identify given variables and identify invariant parameters.',
          'Solution Step 2: Formulate governing balance equation.',
          'Solution Step 3: Eliminate options (A) and (C) immediately due to impossible sign conventions.',
        ],
        infobox: {
          title: 'Speed Metric',
          text: 'Average time taken by qualified candidates on this problem type: 42 seconds.',
        },
      },
      {
        pageNumber: 6,
        sectionTitle: 'Previous 15-Year PYQ Trends & NTA Trap Decoders',
        badge: 'Exam PYQ Breakdown',
        paragraphs: [
          `Analysis of questions framed from ${n.chapter} reveals three recurring examination traps:`,
        ],
        bulletPoints: [
          'Trap 1: The "NOT CORRECT / INCORRECT" question stem. 35% of candidates misread the negative qualifier.',
          'Trap 2: Unit traps (e.g. converting cm³ to m³, or kJ to J). Always standardize into SI units.',
          'Trap 3: Assertion-Reason options where Reason is a true statement independently, but DOES NOT explain Assertion.',
        ],
        diagramNote: 'Comparative bar chart: Frequency distribution of sub-topics tested across past 15 years.',
      },
      {
        pageNumber: 7,
        sectionTitle: 'Illustrated Diagram Breakdown & Flowchart Decoders',
        badge: 'Visual Memory Diagrams',
        paragraphs: [
          'Labeled diagrams with all textbook annotations, histological layers, optical paths, or molecular orbital orientations.',
        ],
        bulletPoints: [
          'Point 1: Note orientation of coordinate axes and anatomical cross-sections.',
          'Point 2: Labeling arrows in recent examination papers often swap adjacent layers.',
          'Point 3: Follow color legend: Green = Forward progression, Red = Inhibitory pathway.',
        ],
        infobox: {
          title: 'Diagram Tip',
          text: 'In diagram-based MCQs, always inspect labels in counter-clockwise sequence to spot swapped terminology.',
        },
      },
      {
        pageNumber: 8,
        sectionTitle: '10-Minute Rapid Revision Checklist & Self-Test',
        badge: 'Final Pre-Exam Cram Sheet',
        paragraphs: [
          'Use this one-page rapid verification checklist before entering the examination hall or taking a full mock test.',
        ],
        bulletPoints: [
          '✓ Can you write the 4 governing formulas from memory without looking at notes?',
          '✓ Can you state the 3 major exceptions and their structural causes?',
          '✓ Do you know the exact temperature and pressure criteria for standard conditions?',
          '✓ Have you completed at least 25 timed MCQs on this specific topic with >90% accuracy?',
        ],
        infobox: {
          title: 'Self-Rating Benchmark',
          text: 'If you scored 4/4 on the checklist, your preparation for this chapter is in the top 5th percentile.',
        },
      },
    ];

    setPages(fallbackList);
    setTotalPages(fallbackList.length);
    setLicense({
      userName: currentUser?.name || 'Verified Student',
      userEmail: currentUser?.email || 'student@neetnotes.com',
      userPhone: currentUser?.phone || '',
      userId: currentUser?.id || 101,
      orderNumber: note?.order_number || 'ONLINE-PASS',
      watermarkText: `LICENSED TO: ${(currentUser?.name || 'STUDENT').toUpperCase()} • ${currentUser?.email || ''} • UID: #${currentUser?.id || 101}`,
      unlockedAt: new Date().toISOString(),
    });
  };

  // Subtle floating watermark drift every 8 seconds
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      const top = Math.floor(15 + Math.random() * 65) + '%';
      const left = Math.floor(10 + Math.random() * 65) + '%';
      setFloatingWatermarkPos({ top, left });
    }, 8000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Anti-Piracy Keyboard & Event Protection
  useEffect(() => {
    if (!isOpen) return;

    // 1. Prevent copy, cut, selectstart
    const handleCopyCut = (e: ClipboardEvent) => {
      e.preventDefault();
      triggerSecurityNotice('⚠️ Content Protection: Text copying is strictly disabled to prevent unauthorized redistribution.');
    };

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
    };

    // 2. Keyboard shortcut interceptor (PrintScreen, Ctrl+P, Ctrl+S, Ctrl+U, Inspect)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Print interception (Ctrl + P or Cmd + P)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        triggerSecurityNotice('🚫 Printing is disabled for copyrighted study materials.');
        return;
      }

      // Save page interception (Ctrl + S or Cmd + S)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        triggerSecurityNotice('🚫 Saving raw document is disabled.');
        return;
      }

      // Inspect / View source interception (Ctrl + U, Ctrl + Shift + I, Ctrl + Shift + J, F12)
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'i' || e.key === 'I' || e.key === 'j' || e.key === 'J' || e.key === 'c' || e.key === 'C'))
      ) {
        e.preventDefault();
        triggerSecurityNotice('⚠️ Developer inspect shortcuts are restricted inside the secure reader.');
        return;
      }

      // PrintScreen / Screenshot Key detection
      if (
        e.key === 'PrintScreen' ||
        e.key === 'Snapshot' ||
        // Mac Screenshot: Cmd + Shift + 3 / 4 / 5
        ((e.metaKey || e.ctrlKey) && e.shiftKey && ['3', '4', '5', 's', 'S'].includes(e.key))
      ) {
        setIsContentBlurred(true);
        triggerSecurityNotice('🛡️ Screen capture shortcut detected! Content paused and blurred for copyright protection.');
        return;
      }

      // Navigation Shortcuts
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        setCurrentPage((p) => Math.min(totalPages, p + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentPage((p) => Math.max(1, p - 1));
      } else if (e.key === 'Escape' && !isFullscreen) {
        onClose();
      }
    };

    // 3. Window blur / Snipping Tool detection
    // When the window loses focus (e.g. user triggers Windows Snipping Tool Win+Shift+S or external capture app),
    // immediately blur the content so the captured image is unreadable.
    const handleWindowBlur = () => {
      setIsContentBlurred(true);
    };

    const handleWindowFocus = () => {
      // Keep blurred until student explicitly resumes or clicks to protect against snip-and-switch
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsContentBlurred(true);
      }
    };

    document.addEventListener('copy', handleCopyCut);
    document.addEventListener('cut', handleCopyCut);
    document.addEventListener('selectstart', handleSelectStart);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('copy', handleCopyCut);
      document.removeEventListener('cut', handleCopyCut);
      document.removeEventListener('selectstart', handleSelectStart);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    };
  }, [isOpen, totalPages, onClose, isFullscreen, triggerSecurityNotice]);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!readerContainerRef.current) return;

    if (!document.fullscreenElement) {
      readerContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  if (!isOpen || !note) return null;

  const activePageData = pages.find((p) => p.pageNumber === currentPage) || pages[0];

  const studentName = license?.userName || currentUser?.name || 'Verified Aspirant';
  const studentEmail = license?.userEmail || currentUser?.email || 'student@email.com';
  const studentPhone = license?.userPhone || currentUser?.phone || '';
  const orderRef = license?.orderNumber || note.order_number || 'PREMIUM-PASS';
  const userId = license?.userId || currentUser?.id || 'UID-101';

  // Construct dynamic diagonal watermark string
  const watermarkBanner = `LICENSED TO: ${studentName.toUpperCase()} • ${studentEmail} • ${studentPhone ? `TEL: ${studentPhone} • ` : ''}UID: #${userId} • ORDER: #${orderRef}`;

  // Theme styling classes
  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return {
          wrapper: 'bg-slate-950 text-slate-100',
          header: 'bg-slate-900 border-slate-800 text-slate-200',
          paper: 'bg-slate-900 border-slate-800 text-slate-100 shadow-2xl',
          subtext: 'text-slate-400',
          card: 'bg-slate-800/80 border-slate-700 text-slate-200',
          accentBorder: 'border-emerald-500',
          watermarkColor: 'text-slate-100/6',
        };
      case 'sepia':
        return {
          wrapper: 'bg-[#f6f1e8] text-[#433422]',
          header: 'bg-[#ebe3d5] border-[#dcd1be] text-[#433422]',
          paper: 'bg-[#fdfbf7] border-[#e8dfcf] text-[#433422] shadow-xl',
          subtext: 'text-[#7d6b53]',
          card: 'bg-[#f4ecdf] border-[#e2d5c1] text-[#433422]',
          accentBorder: 'border-[#b8860b]',
          watermarkColor: 'text-[#433422]/7',
        };
      default: // light
        return {
          wrapper: 'bg-slate-100 text-slate-900',
          header: 'bg-white border-slate-200 text-slate-800',
          paper: 'bg-white border-slate-200 text-slate-900 shadow-xl',
          subtext: 'text-slate-500',
          card: 'bg-emerald-50/70 border-emerald-200/80 text-slate-800',
          accentBorder: 'border-emerald-600',
          watermarkColor: 'text-slate-950/6',
        };
    }
  };

  const themeCls = getThemeClasses();

  return (
    <div
      ref={readerContainerRef}
      id="secure-inapp-notes-reader"
      onContextMenu={(e) => {
        e.preventDefault();
        triggerSecurityNotice('🛡️ Right-click context menu is disabled for copyright protection.');
      }}
      className={`fixed inset-0 z-50 flex flex-col select-none overflow-hidden ${themeCls.wrapper} transition-colors duration-200`}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* 1. TOP HEADER CONTROLS (RESPONSIVE PC & MOBILE) */}
      <header
        className={`px-3 sm:px-6 py-2.5 sm:py-3 border-b flex items-center justify-between gap-2 sm:gap-4 shrink-0 shadow-xs ${themeCls.header}`}
      >
        {/* Left: Note Info & TOC Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            id="reader-toggle-toc-btn"
            onClick={() => setShowToc(!showToc)}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-xs font-bold flex items-center gap-1.5 shrink-0"
            title="Table of Contents & Index"
          >
            <List className="w-4 h-4" />
            <span className="hidden md:inline">Index</span>
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600/10 text-emerald-600">
                {note.subject}
              </span>
              <span className="hidden sm:inline text-xs font-semibold opacity-70 truncate">
                {note.class_level || 'NEET Standard'}
              </span>
            </div>
            <h1 className="text-xs sm:text-sm font-bold truncate max-w-[150px] sm:max-w-xs md:max-w-md">
              {note.title}
            </h1>
          </div>
        </div>

        {/* Center: Pagination Quick Bar & Mode Switcher */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            id="reader-prev-page-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
            title="Previous Page (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center text-xs font-bold px-1.5">
            <span className="text-emerald-600 font-extrabold">{currentPage}</span>
            <span className="opacity-50 mx-1">/</span>
            <span>{totalPages}</span>
          </div>

          <button
            id="reader-next-page-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
            title="Next Page (Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Mode Switcher: PDF Scanned Page vs Text Notes */}
          {activePageData?.imageUrl && (
            <div className="hidden sm:flex items-center bg-black/5 dark:bg-white/10 p-0.5 rounded-lg text-[11px] font-bold ml-2">
              <button
                onClick={() => setViewMode('pdf')}
                className={`px-2 py-1 rounded-md transition-all ${
                  viewMode === 'pdf'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'opacity-70 hover:opacity-100'
                }`}
                title="View original handwritten PDF scan"
              >
                Scanned PDF
              </button>
              <button
                onClick={() => setViewMode('text')}
                className={`px-2 py-1 rounded-md transition-all ${
                  viewMode === 'text'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'opacity-70 hover:opacity-100'
                }`}
                title="View NCERT study notes & summary"
              >
                Notes Summary
              </button>
            </div>
          )}
        </div>

        {/* Right: Theme, Zoom & Fullscreen Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Zoom controls (hidden on small mobile to avoid clutter) */}
          <div className="hidden lg:flex items-center gap-1 bg-black/5 dark:bg-white/10 p-1 rounded-xl">
            <button
              onClick={() => setZoomLevel((z) => Math.max(75, z - 15))}
              className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold px-1 min-w-[36px] text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(175, z + 15))}
              className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-[10px] font-bold"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Reading Mode Theme Selector */}
          <div className="flex items-center bg-black/5 dark:bg-white/10 p-0.5 sm:p-1 rounded-xl">
            <button
              id="theme-light-btn"
              onClick={() => setTheme('light')}
              className={`p-1.5 rounded-lg transition-all ${
                theme === 'light' ? 'bg-white shadow-xs text-slate-900' : 'opacity-60 hover:opacity-100'
              }`}
              title="Crisp Light Paper"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              id="theme-sepia-btn"
              onClick={() => setTheme('sepia')}
              className={`p-1.5 rounded-lg transition-all ${
                theme === 'sepia' ? 'bg-[#f4ecdf] shadow-xs text-[#433422]' : 'opacity-60 hover:opacity-100'
              }`}
              title="Warm Sepia Eye-Comfort"
            >
              <Coffee className="w-3.5 h-3.5" />
            </button>
            <button
              id="theme-dark-btn"
              onClick={() => setTheme('dark')}
              className={`p-1.5 rounded-lg transition-all ${
                theme === 'dark' ? 'bg-slate-800 shadow-xs text-emerald-400' : 'opacity-60 hover:opacity-100'
              }`}
              title="Night Focus Dark Mode"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            id="reader-fullscreen-btn"
            onClick={toggleFullscreen}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (Distraction Free)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close Reader */}
          <button
            id="reader-close-btn"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 hover:text-rose-700 transition-colors cursor-pointer ml-1"
            title="Close In-App Reader"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. SECURITY NOTICE TOAST (WHEN SHORTCUTS/SCREENSHOTS ARE DETECTED) */}
      {securityAlert && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 text-white border border-rose-500/50 shadow-2xl px-5 py-3 rounded-2xl flex items-center gap-3 text-xs max-w-lg animate-in slide-in-from-top-4 duration-200">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="flex-1 font-semibold">{securityAlert}</div>
          <button
            onClick={() => setSecurityAlert(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. MAIN BODY CONTAINER: TOC DRAWER + READING CANVAS */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Table of Contents Drawer */}
        {showToc && (
          <aside
            className={`w-64 sm:w-72 border-r shrink-0 overflow-y-auto p-4 z-20 flex flex-col justify-between ${themeCls.header}`}
          >
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Bookmark className="w-4 h-4 text-emerald-600" />
                  <span>Table of Contents</span>
                </div>
                <button
                  onClick={() => setShowToc(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1 text-xs">
                {pages.map((p) => (
                  <button
                    key={p.pageNumber}
                    onClick={() => {
                      setCurrentPage(p.pageNumber);
                      // Close TOC on mobile automatically
                      if (window.innerWidth < 640) setShowToc(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl flex items-start gap-2.5 transition-colors cursor-pointer ${
                      currentPage === p.pageNumber
                        ? 'bg-emerald-600 text-white font-bold shadow-xs'
                        : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        currentPage === p.pageNumber
                          ? 'bg-emerald-700 text-white'
                          : 'bg-black/10 dark:bg-white/10'
                      }`}
                    >
                      P{p.pageNumber}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{p.sectionTitle}</div>
                      {p.badge && (
                        <div className="text-[10px] opacity-75 truncate">{p.badge}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* License Stamp Footer */}
            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] opacity-70">
              <div className="flex items-center gap-1.5 font-bold text-emerald-600 mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Anti-Piracy License</span>
              </div>
              <p className="truncate font-medium">{studentName}</p>
              <p className="font-mono text-[10px] truncate">{studentEmail}</p>
              <p className="font-mono text-[9px] text-slate-400 mt-1">Order #{orderRef}</p>
            </div>
          </aside>
        )}

        {/* 4. READING CANVAS CONTAINER */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-10 flex justify-center items-start relative">
          {isLoading ? (
            <div className="m-auto text-center py-20 space-y-3">
              <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold opacity-70">Decrypting & Preparing Secure Study Packet...</p>
            </div>
          ) : (
            <div
              className={`w-full max-w-3xl rounded-2xl border p-6 sm:p-10 md:p-12 relative overflow-hidden transition-all duration-200 ${themeCls.paper}`}
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
              }}
            >
              {/* =======================================================
                  ANTI-PIRACY REPEATING DIAGONAL BACKGROUND WATERMARK
                  ======================================================= */}
              <div
                className={`absolute inset-0 pointer-events-none select-none z-0 overflow-hidden flex flex-col justify-around opacity-40`}
                aria-hidden="true"
              >
                {/* 5 Rotated Watermark Matrix Lines across the study paper */}
                {[...Array(6)].map((_, idx) => (
                  <div
                    key={idx}
                    className={`whitespace-nowrap font-mono font-black text-[12px] sm:text-[14px] tracking-widest uppercase rotate-[-22deg] -translate-x-12 ${themeCls.watermarkColor}`}
                  >
                    {watermarkBanner} &nbsp;•&nbsp; {watermarkBanner}
                  </div>
                ))}
              </div>

              {/* Floating Dynamic Micro-Stamp */}
              <div
                className="absolute pointer-events-none select-none z-10 opacity-30 font-mono text-[10px] font-bold px-2 py-1 rounded bg-black/5 dark:bg-white/10 rotate-[-12deg] transition-all duration-1000"
                style={{ top: floatingWatermarkPos.top, left: floatingWatermarkPos.left }}
              >
                STUDENT UID: #{userId} • {studentEmail}
              </div>

              {/* Foreground Page Content */}
              <div className="relative z-10 space-y-6">
                {/* Note Page Top Header */}
                <div className={`border-b-2 pb-4 ${themeCls.accentBorder}`}>
                  <div className="flex flex-wrap items-center justify-between text-xs font-semibold gap-2 mb-1.5">
                    <span className="flex items-center gap-1.5 opacity-80">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        Subject: <strong>{note.subject}</strong>
                      </span>
                      <span>•</span>
                      <span>{note.class_level || 'NEET Standard'}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {activePageData.imageUrl && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          Original PDF Page
                        </span>
                      )}
                      <span className="font-bold text-emerald-600 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-[11px] uppercase tracking-wider">
                        {activePageData.badge || `Page ${currentPage}`}
                      </span>
                    </div>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
                    {activePageData.sectionTitle}
                  </h2>
                </div>

                {/* SCENARIO A: Original Scanned PDF Image View */}
                {viewMode === 'pdf' && activePageData.imageUrl ? (
                  <div className="space-y-6">
                    {/* High-Resolution Document Canvas with Watermark Protection */}
                    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-xl bg-white select-none">
                      <img
                        src={activePageData.imageUrl}
                        alt={`Page ${activePageData.pageNumber} - ${activePageData.sectionTitle}`}
                        className="w-full h-auto object-contain block pointer-events-none select-none transition-all duration-200"
                        draggable={false}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          triggerSecurityNotice('🛡️ Right-click context menu is disabled for copyright protection.');
                        }}
                      />

                      {/* Direct Anti-Piracy Watermark Matrix Stamped Over the Image */}
                      <div
                        className="absolute inset-0 pointer-events-none select-none z-20 flex flex-col justify-around overflow-hidden opacity-30"
                        aria-hidden="true"
                      >
                        {[...Array(6)].map((_, idx) => (
                          <div
                            key={idx}
                            className="whitespace-nowrap font-mono font-black text-[11px] sm:text-[13px] tracking-wider uppercase rotate-[-22deg] -translate-x-12 text-slate-900/60 dark:text-slate-900/60"
                          >
                            {watermarkBanner} &nbsp;•&nbsp; {watermarkBanner}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick High-Yield NCERT Exam Concepts underneath the page */}
                    {activePageData.bulletPoints && activePageData.bulletPoints.length > 0 && (
                      <div className={`rounded-2xl p-5 border ${themeCls.card} space-y-3`}>
                        <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 text-emerald-600">
                          <Sparkles className="w-4 h-4" />
                          High-Yield NCERT Exam Concepts (Page {activePageData.pageNumber})
                        </h3>
                        <ul className="space-y-2 text-xs sm:text-sm">
                          {activePageData.bulletPoints.map((pt, ptIdx) => (
                            <li key={ptIdx} className="flex items-start gap-2.5 leading-relaxed">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  /* SCENARIO B: Structured High-Yield Textbook Cards View */
                  <div className="space-y-6">
                    {/* Paragraphs */}
                    <div className="space-y-3 leading-relaxed text-sm sm:text-base font-normal">
                      {activePageData.paragraphs.map((p, pIdx) => (
                        <p key={pIdx} className="opacity-90">
                          {p}
                        </p>
                      ))}
                    </div>

                    {/* Key Points / Bullet Takeaways */}
                    {activePageData.bulletPoints && activePageData.bulletPoints.length > 0 && (
                      <div className={`rounded-2xl p-5 border ${themeCls.card} space-y-3`}>
                        <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 text-emerald-600">
                          <Sparkles className="w-4 h-4" />
                          High-Yield Memorization Takeaways
                        </h3>
                        <ul className="space-y-2.5 text-xs sm:text-sm">
                          {activePageData.bulletPoints.map((pt, ptIdx) => (
                            <li key={ptIdx} className="flex items-start gap-2.5 leading-relaxed">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Infobox / Calculation or Strategy Box */}
                    {activePageData.infobox && (
                      <div className="border border-amber-300/80 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-700/50 rounded-xl p-4 text-xs sm:text-sm space-y-1">
                        <div className="font-extrabold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{activePageData.infobox.title}</span>
                        </div>
                        <p className="text-amber-900/90 dark:text-amber-200/90 leading-relaxed font-medium">
                          {activePageData.infobox.text}
                        </p>
                      </div>
                    )}

                    {/* Diagram / Mechanism Note */}
                    {activePageData.diagramNote && (
                      <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 bg-black/2 dark:bg-white/2 text-center text-xs">
                        <div className="font-semibold opacity-90">{activePageData.diagramNote}</div>
                        <div className="text-[11px] opacity-60 mt-1">
                          Vector-sharp illustrations optimized for high-resolution retina & mobile displays.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Page Bottom Footer with Page Numbers & Student Stamp */}
                <div className="border-t border-black/10 dark:border-white/10 pt-4 mt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] opacity-70 gap-2">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    <span>
                      Licensed exclusively to <strong>{studentName}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px]">Order #{orderRef}</span>
                    <span className="font-bold text-xs bg-black/5 dark:bg-white/10 px-2.5 py-0.5 rounded-full">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* 5. SCREEN CAPTURE & WINDOW BLUR SECURITY SHIELD OVERLAY */}
        {isContentBlurred && (
          <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center text-white animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/30">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-black mb-2">Display Paused for Security</h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mb-6 leading-relaxed">
              Study note display was temporarily blurred because the window lost focus or an external screen recording / capture shortcut was triggered.
            </p>
            <button
              id="resume-reading-btn"
              onClick={() => {
                setIsContentBlurred(false);
                triggerSecurityNotice('Reading resumed. Content watermarked for your account.');
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
            >
              <Eye className="w-4 h-4" />
              <span>Resume Reading</span>
            </button>
          </div>
        )}
      </div>

      {/* 6. BOTTOM MOBILE-FRIENDLY NAV BAR */}
      <footer
        className={`px-4 py-2 border-t flex items-center justify-between text-xs shrink-0 sm:hidden ${themeCls.header}`}
      >
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          className="flex items-center gap-1 font-bold py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-30 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Prev</span>
        </button>

        <span className="font-bold text-xs">
          Page {currentPage} of {totalPages}
        </span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          className="flex items-center gap-1 font-bold py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-30 cursor-pointer"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </footer>

      {/* 7. PRINT PROTECTION CSS INJECTION */}
      <style>{`
        @media print {
          body * {
            display: none !important;
          }
          body:after {
            content: "PRINTING PROHIBITED: This educational study material is strictly protected by digital copyright and licensing laws. Unauthorized printing or reproduction is punishable.";
            display: block !important;
            font-size: 22px !important;
            font-weight: bold !important;
            color: #dc2626 !important;
            text-align: center !important;
            padding-top: 150px !important;
            font-family: sans-serif !important;
          }
        }
      `}</style>
    </div>
  );
};
