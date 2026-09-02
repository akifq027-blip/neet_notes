import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Lock, CheckCircle2, Download, ShoppingCart, Sparkles, BookOpen, FileText } from 'lucide-react';
import { Note } from '../types';
import { api } from '../services/api';

interface PreviewReaderModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (note: Note) => void;
  onBuyNow?: (note: Note) => void;
  isPurchased?: boolean;
}

export const PreviewReaderModal: React.FC<PreviewReaderModalProps> = ({
  note,
  isOpen,
  onClose,
  onAddToCart,
  onBuyNow,
  isPurchased = false,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [previewSamples, setPreviewSamples] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'pdf' | 'text'>('pdf');

  useEffect(() => {
    if (!isOpen || !note) return;
    setCurrentPage(1);
    api.getPreview(note.id).then((res) => {
      if (res && res.success && res.previewSamples && res.previewSamples.length > 0) {
        setPreviewSamples(res.previewSamples);
      } else {
        setPreviewSamples([]);
      }
    });
  }, [isOpen, note]);

  if (!isOpen || !note) return null;

  const totalPreviewPages = note.preview_pages || 4;
  const activeSample = previewSamples.find((s) => s.pageNumber === currentPage);

  const getPageContent = (page: number) => {
    switch (page) {
      case 1:
        return {
          badge: 'High-Yield Chapter Summary',
          title: `NCERT Line-by-Line Core Concepts: ${note.chapter}`,
          points: [
            'Standard NTA weightage: 2 to 3 direct questions in NEET 2024 & 2025 examinations.',
            'Direct assertion-reason links extracted with exact NCERT paragraph citations.',
            'Fundamental laws, fundamental assumptions, and boundary limitations summarized in bullet points.',
            'Crucial exceptions tagged with red recall flags for last-minute cramming.',
          ],
          diagramSnippet: 'Includes annotated hand-drawn anatomical / reaction mechanism diagrams with color coding.',
        };
      case 2:
        return {
          badge: 'Formula Sheet & Mnemonics',
          title: 'Speed Formulae, Sign Conventions & Shortcut Mnemonics',
          points: [
            'Dimensional analysis verification shortcuts to eliminate incorrect multiple-choice options in <15 seconds.',
            'Quick-reference mnemonics for memorizing electrochemical series & periodic table trends.',
            'Standard value conversions and SI unit consistency cheat sheets.',
            'Arrow-pushing organic mechanisms synthesized into single-glance memory maps.',
          ],
          diagramSnippet: 'Flowchart: Step-by-step logic gate & calculation decision tree.',
        };
      case 3:
        return {
          badge: 'Exemplar & Tricky PYQs',
          title: 'Previous 15-Year High Frequency Question Decoders',
          points: [
            'Categorized by: Direct NCERT recall (70%), Calculation-based (20%), Multi-concept application (10%).',
            'Common examination traps & negative-marking pitfalls flagged by AIIMS rankers.',
            'Alternative elimination techniques when exact calculation is time-prohibitive.',
          ],
          diagramSnippet: 'Illustrated solved exemplar with step-by-step mathematical working.',
        };
      default:
        return {
          badge: 'Revision Matrix',
          title: 'Rapid 10-Minute Pre-Exam Checklist',
          points: [
            '20 must-remember equations and reaction reagents with condition matrices.',
            'Cross-chapter conceptual linkage summary (Physics/Chemistry interface).',
            'Final self-test quiz questions with answer key references.',
          ],
          diagramSnippet: 'Summary table with color-coded high-yield priority rankings.',
        };
    }
  };

  const pageData = getPageContent(currentPage);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded uppercase tracking-wider">
                  Sample Preview
                </span>
                <span className="text-xs text-slate-400">Page {currentPage} of {totalPreviewPages}</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-100 truncate max-w-md sm:max-w-xl">
                {note.title}
              </h2>
            </div>
          </div>

          <button
            id="close-preview-modal-btn"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reader Canvas (A4 Study Note Simulation with Watermark) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/90 flex justify-center">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-10 relative overflow-hidden flex flex-col justify-between min-h-[500px]">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 rotate-[-25deg]">
              <span className="text-6xl sm:text-7xl font-black text-slate-900 tracking-widest uppercase">
                NEET NOTES HQ
              </span>
            </div>

            {/* Note Page Header */}
            <div className="border-b-2 border-emerald-600 pb-4 mb-6">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                <span>Subject: {note.subject}</span>
                <div className="flex items-center gap-2">
                  {activeSample?.imageUrl && (
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-blue-600" />
                      Original Scan (300 DPI Ultra-HD)
                    </span>
                  )}
                  <span className="text-emerald-700 font-bold">{pageData.badge}</span>
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                {activeSample?.title || pageData.title}
              </h3>
            </div>

            {/* If Real Rendered Scanned Page is available */}
            {activeSample?.imageUrl ? (
              <div className="space-y-4 my-auto">
                <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-md bg-white">
                  <img
                    src={activeSample.imageUrl}
                    alt={`Preview Page ${currentPage}`}
                    className="w-full h-auto object-contain block select-none pointer-events-none transition-all duration-200"
                    style={{
                      imageRendering: 'high-quality',
                      WebkitFontSmoothing: 'subpixel-antialiased',
                    }}
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                  {/* Subtle watermark */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 rotate-[-25deg]">
                    <span className="text-2xl sm:text-4xl font-black text-slate-900 tracking-widest uppercase font-mono">
                      SAMPLE PREVIEW ONLY
                    </span>
                  </div>
                </div>

                <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3.5 text-xs text-slate-700 leading-relaxed">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-emerald-900">NCERT Page Extract:</p>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Print-Grade Vector Clarity</span>
                  </div>
                  <p>{activeSample.contentSnippet}</p>
                </div>
              </div>
            ) : (
              /* Standard Sample Preview Points */
              <div className="space-y-4 my-auto">
                <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Key Takeaways & High-Yield Extract
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {pageData.points.map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Diagram / Schematic Box */}
                <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50 text-center">
                  <p className="text-xs font-semibold text-slate-600">{pageData.diagramSnippet}</p>
                  <div className="mt-2 text-[11px] text-slate-400">
                    Full 4K vector illustrations included in complete {note.total_pages}-page study packet.
                  </div>
                </div>
              </div>
            )}

            {/* Note Footer */}
            <div className="border-t border-slate-100 pt-4 mt-6 flex items-center justify-between text-[11px] text-slate-400">
              <span>Author: {note.author_name}</span>
              <span className="font-bold text-slate-600">Sample Page {currentPage} / {totalPreviewPages}</span>
            </div>
          </div>
        </div>

        {/* Footer Navigation and CTA */}
        <div className="bg-white border-t border-slate-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <button
              id="preview-prev-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700 px-2">
              Preview Page {currentPage} of {totalPreviewPages}
            </span>
            <button
              id="preview-next-btn"
              disabled={currentPage === totalPreviewPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPreviewPages, p + 1))}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Unlock / Purchase CTA */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="text-right hidden sm:block">
              <div className="text-xs text-slate-500">
                Unlock all <strong>{note.total_pages} Pages</strong>
              </div>
              <div className="text-sm font-extrabold text-slate-900">
                {note.is_free ? 'FREE Access' : `Only ₹${note.price}`}
              </div>
            </div>

            {isPurchased ? (
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-4 py-2.5 rounded-xl">
                Purchased & In Your Library
              </span>
            ) : (
              <button
                id="preview-unlock-btn"
                onClick={() => {
                  if (onBuyNow) {
                    onBuyNow(note);
                  } else {
                    onAddToCart(note);
                  }
                  onClose();
                }}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {note.is_free ? (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Full Free PDF</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Cart & Unlock All Pages (₹{note.price})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
