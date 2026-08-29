import React from 'react';
import { Star, FileText, Download, ShoppingCart, Eye, Heart, Check, Sparkles } from 'lucide-react';
import { Note } from '../types';

interface NoteCardProps {
  note: Note;
  onSelect?: (note: Note) => void;
  onPreview: (note: Note) => void;
  onAddToCart: (note: Note) => void;
  onBuyNow?: (note: Note) => void;
  onOpenDetail?: (noteId: number) => void;
  onToggleWishlist?: (noteId: number) => void;
  isInCart?: boolean;
  isWishlisted?: boolean;
  isPurchased?: boolean;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onSelect,
  onPreview,
  onAddToCart,
  onBuyNow,
  onOpenDetail,
  onToggleWishlist,
  isInCart = false,
  isWishlisted = false,
  isPurchased = false,
}) => {
  const getSubjectWatermark = (subject: string) => {
    switch (subject) {
      case 'Physics':
        return { tag: 'PYQ', bg: 'bg-blue-50', text: 'text-blue-600' };
      case 'Chemistry':
        return { tag: 'DOC', bg: 'bg-amber-50', text: 'text-amber-600' };
      case 'Biology':
        return { tag: 'NCERT', bg: 'bg-teal-50', text: 'text-teal-600' };
      default:
        return { tag: 'PDF', bg: 'bg-purple-50', text: 'text-purple-600' };
    }
  };

  const watermark = getSubjectWatermark(note.subject);

  const handleClick = () => {
    if (onOpenDetail) {
      onOpenDetail(note.id);
    } else if (onSelect) {
      onSelect(note);
    }
  };

  return (
    <div
      id={`note-card-${note.id}`}
      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
      onClick={handleClick}
    >
      <div>
        {/* Top Media / Thumbnail Section */}
        <div className={`relative ${watermark.bg} h-36 rounded-xl mb-3 flex items-center justify-center overflow-hidden border border-slate-100/60`}>
          {/* Real image if available, with watermark fallback */}
          {note.thumbnail ? (
            <img
              src={note.thumbnail}
              alt={note.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <span className={`${watermark.text} font-black text-5xl opacity-25 italic select-none`}>
              {watermark.tag}
            </span>
          )}

          {/* Typographic Watermark Overlay if image exists */}
          {note.thumbnail && (
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end justify-between p-2.5">
              <span className="text-white/90 font-black text-xl italic drop-shadow-sm">
                {watermark.tag}
              </span>
              <span className="text-[10px] text-white/90 font-bold bg-slate-900/60 backdrop-blur-xs px-2 py-0.5 rounded">
                {note.total_pages} Pages
              </span>
            </div>
          )}

          {/* Badges Overlay */}
          <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
            <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
              {note.subject}
            </span>
          </div>

          {Boolean(note.is_bestseller) && (
            <span className="absolute top-2 right-2 bg-orange-500 text-white text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-wider shadow-sm z-10">
              Bestseller
            </span>
          )}

          {/* Wishlist Button */}
          {onToggleWishlist && (
            <button
              id={`wishlist-btn-${note.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleWishlist(note.id);
              }}
              className={`absolute bottom-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all cursor-pointer z-10 ${
                isWishlisted
                  ? 'bg-rose-500 text-white'
                  : 'bg-black/30 hover:bg-black/50 text-white hover:text-rose-300'
              }`}
              title="Add to Wishlist"
            >
              <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        {/* Note Title & Chapter */}
        <h3 className="font-bold text-slate-800 leading-tight mb-1 group-hover:text-teal-700 transition-colors line-clamp-2 text-sm">
          {note.title}
        </h3>

        {/* Subtitle / Author & Pages */}
        <p className="text-xs text-slate-500 mb-3 flex items-center justify-between font-medium">
          <span className="truncate max-w-[170px]">{note.chapter || 'Medical Notes'}</span>
          <span className="flex items-center gap-1 text-amber-500 font-bold text-xs shrink-0">
            <Star className="w-3 h-3 fill-current" />
            {Number(note.rating_avg).toFixed(1)}
          </span>
        </p>
      </div>

      {/* Pricing & Actions Strip */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
        <div className="flex flex-col">
          {note.is_free ? (
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] text-slate-400 line-through">₹99</span>
              <span className="text-lg font-black text-teal-600">Free</span>
            </div>
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-teal-600">₹{note.price}</span>
              {note.original_price > note.price && (
                <span className="text-[10px] text-slate-400 line-through font-medium">
                  ₹{note.original_price}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id={`preview-btn-${note.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onPreview(note);
            }}
            className="p-1.5 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
            title="Preview Free Sample"
          >
            <Eye className="w-4 h-4" />
          </button>

          {isPurchased ? (
            <button
              id={`owned-btn-${note.id}`}
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              className="bg-teal-100 text-teal-800 text-[10px] uppercase font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3 h-3" />
              <span>Owned</span>
            </button>
          ) : note.is_free ? (
            <button
              id={`get-free-btn-${note.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(note);
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white text-[10px] uppercase font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span>Download</span>
            </button>
          ) : (
            <button
              id={`add-cart-btn-${note.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(note);
              }}
              className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                isInCart
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {isInCart ? (
                <>
                  <Check className="w-3 h-3 text-teal-300" />
                  <span>In Cart</span>
                </>
              ) : (
                <span>Add to Cart</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
