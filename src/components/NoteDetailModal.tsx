import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  Download,
  ShoppingCart,
  Eye,
  Heart,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Zap,
  Sparkles,
  MessageSquare,
  Send,
  Lock,
} from 'lucide-react';
import { Note, Review, User } from '../types';
import { api } from '../services/api';

interface NoteDetailModalProps {
  noteId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onPreview: (note: Note) => void;
  onAddToCart: (note: Note) => void;
  onBuyNow: (note: Note) => void;
  onToggleWishlist: (noteId: number) => void;
  user: User | null;
  onOpenAuth: () => void;
  isWishlisted?: boolean;
}

export const NoteDetailModal: React.FC<NoteDetailModalProps> = ({
  noteId,
  isOpen,
  onClose,
  onPreview,
  onAddToCart,
  onBuyNow,
  onToggleWishlist,
  user,
  onOpenAuth,
  isWishlisted = false,
}) => {
  const [noteData, setNoteData] = useState<Note | null>(null);
  const [isPurchased, setIsPurchased] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedNotes, setRelatedNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Review submission state
  const [newRating, setNewRating] = useState(5);
  const [newReviewText, setNewReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');

  useEffect(() => {
    if (!isOpen || !noteId) return;

    let isMounted = true;
    setIsLoading(true);

    api.getNoteById(noteId).then((res) => {
      if (isMounted && res.success) {
        setNoteData(res.note);
        setIsPurchased(res.isPurchased);
        setReviews(res.reviews || []);
        setRelatedNotes(res.relatedNotes || []);
      }
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, noteId]);

  if (!isOpen || !noteId) return null;

  const handleDownload = () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    const downloadUrl = api.getDownloadUrl(noteId);
    window.open(downloadUrl, '_blank');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }

    setIsSubmittingReview(true);
    setReviewMessage('');

    try {
      const res = await api.submitReview(noteId, newRating, newReviewText);
      if (res.success) {
        setReviewMessage('Review submitted successfully!');
        setNewReviewText('');
        // Refresh note details
        const updated = await api.getNoteById(noteId);
        if (updated.success) {
          setReviews(updated.reviews);
          if (noteData) {
            setNoteData({
              ...noteData,
              rating_avg: updated.note.rating_avg,
              rating_count: updated.note.rating_count,
            });
          }
        }
      } else {
        setReviewMessage(res.message || 'Failed to post review.');
      }
    } catch (err: any) {
      setReviewMessage(err.message || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              {noteData?.subject || 'NEET Study Material'}
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">• {noteData?.chapter}</span>
          </div>

          <button
            id="close-note-detail-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {isLoading || !noteData ? (
            <div className="py-20 text-center text-slate-400">Loading comprehensive note packet...</div>
          ) : (
            <>
              {/* Top Hero Card with Thumbnail + Core Stats */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Thumbnail */}
                <div className="md:col-span-5 relative rounded-2xl overflow-hidden shadow-md border border-slate-200 aspect-[4/3] bg-slate-100">
                  <img
                    src={noteData.thumbnail || 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80'}
                    alt={noteData.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => onToggleWishlist(noteData.id)}
                      className={`p-2.5 rounded-full backdrop-blur-md transition-colors cursor-pointer ${
                        isWishlisted
                          ? 'bg-rose-500 text-white'
                          : 'bg-black/40 text-white hover:text-rose-400'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Info & Purchase Box */}
                <div className="md:col-span-7 space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-amber-500 text-sm font-bold">
                        <Star className="w-4 h-4 fill-current" />
                        <span>{Number(noteData.rating_avg).toFixed(1)}</span>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">
                        ({noteData.rating_count} student reviews)
                      </span>
                      <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                        {noteData.purchase_count} Downloads
                      </span>
                    </div>

                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                      {noteData.title}
                    </h1>

                    <p className="text-xs text-slate-500 font-medium">
                      Curated by <strong>{noteData.author_name}</strong> • Chapter: <strong>{noteData.chapter}</strong>
                    </p>
                  </div>

                  {/* Price Tag */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      {noteData.is_free ? (
                        <div>
                          <div className="text-emerald-700 font-black text-2xl">FREE ACCESS</div>
                          <p className="text-[11px] text-slate-500">Sponsored public study material</p>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900">₹{noteData.price}</span>
                            {noteData.original_price > noteData.price && (
                              <span className="text-xs text-slate-400 line-through">
                                ₹{noteData.original_price}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-emerald-700 font-semibold">
                            Full Lifetime Access + All Revision Updates
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="text-right text-xs text-slate-500">
                      <div className="font-bold text-slate-800">{noteData.total_pages} Total Pages</div>
                      <div>PDF format (Printable)</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    <button
                      id="detail-preview-btn"
                      onClick={() => onPreview(noteData)}
                      className="px-4 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-slate-500" />
                      <span>Free Sample ({noteData.preview_pages} Pages)</span>
                    </button>

                    {isPurchased ? (
                      <button
                        id="detail-download-btn"
                        onClick={handleDownload}
                        className="col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Full Study PDF</span>
                      </button>
                    ) : noteData.is_free ? (
                      <button
                        id="detail-claim-free-btn"
                        onClick={() => onAddToCart(noteData)}
                        className="col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Free PDF</span>
                      </button>
                    ) : (
                      <>
                        <button
                          id="detail-add-cart-btn"
                          onClick={() => onAddToCart(noteData)}
                          className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>Add to Cart</span>
                        </button>
                        <button
                          id="detail-buy-now-btn"
                          onClick={() => onBuyNow(noteData)}
                          className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Zap className="w-4 h-4" />
                          <span>Instant Buy</span>
                        </button>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      100% NCERT Verified
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      Instant PDF Delivery
                    </span>
                  </div>
                </div>
              </div>

              {/* Description & Syllabus Highlights */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <h3 className="text-base font-bold text-slate-900">What's Inside This Study Module?</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {noteData.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-950">High-Yield NCERT Line Extract</h4>
                      <p className="text-[11px] text-emerald-800">Every single potential question line mapped from latest NTA syllabus.</p>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/80 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-teal-950">15-Year PYQ Trend Decoders</h4>
                      <p className="text-[11px] text-teal-800">Questions grouped by weightage with AIIMS topper solution techniques.</p>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-blue-950">Color-Coded Reaction/Flow Maps</h4>
                      <p className="text-[11px] text-blue-800">Visual memory anchors designed for rapid recall under exam pressure.</p>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200/80 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-purple-950">Formula & Shortcut Sheet</h4>
                      <p className="text-[11px] text-purple-800">Elimination tricks to solve numericals in under 45 seconds.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Reviews & Ratings Section */}
              <div className="space-y-6 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      <span>Student Reviews & Feedback</span>
                    </h3>
                    <p className="text-xs text-slate-500">Verified NEET aspirants who studied from this module</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-extrabold text-slate-900 flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-current" />
                      <span>{Number(noteData.rating_avg).toFixed(1)} / 5.0</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{reviews.length} written reviews</span>
                  </div>
                </div>

                {/* Write a Review Box (For Verified Owners / Free Notes) */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 mb-2">Leave Your Rating & Review</h4>
                  {user ? (
                    <form onSubmit={handleSubmitReview} className="space-y-3">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-slate-600">Your Rating:</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setNewRating(star)}
                              className="text-amber-400 hover:text-amber-500 cursor-pointer"
                            >
                              <Star className={`w-5 h-5 ${star <= newRating ? 'fill-current' : ''}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <textarea
                        required
                        rows={2}
                        value={newReviewText}
                        onChange={(e) => setNewReviewText(e.target.value)}
                        placeholder="Share how these notes assisted your chapter revision..."
                        className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                      />

                      {reviewMessage && (
                        <p className="text-xs text-emerald-700 font-semibold">{reviewMessage}</p>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmittingReview || !newReviewText.trim()}
                        className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSubmittingReview ? 'Submitting...' : 'Post Review'}</span>
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500">Sign in to post your review and rate this resource.</p>
                      <button
                        onClick={onOpenAuth}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer"
                      >
                        Sign In Now
                      </button>
                    </div>
                  )}
                </div>

                {/* Review List */}
                <div className="space-y-3">
                  {reviews.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">Be the first aspirant to review this note!</p>
                  ) : (
                    reviews.map((rev) => (
                      <div key={rev.id} className="p-3.5 rounded-xl border border-slate-100 bg-white space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                              {rev.user_name?.charAt(0) || 'S'}
                            </div>
                            <span className="text-xs font-bold text-slate-900">{rev.user_name}</span>
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold">
                              Verified Student
                            </span>
                          </div>
                          <div className="flex items-center text-amber-500">
                            {Array.from({ length: rev.rating }).map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-current" />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{rev.review}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
