import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Tag, Check, Sparkles, ShieldCheck } from 'lucide-react';
import { CartItem } from '../types';
import { api } from '../services/api';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemoveItem: (noteId: number) => void;
  onClearCart: () => void;
  onProceedToCheckout: (appliedCoupon: any) => void;
  onBrowseNotes: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
  onBrowseNotes,
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.note.is_free ? 0 : item.note.price * item.quantity),
    0
  );

  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      discount = Math.round((subtotal * appliedCoupon.discountValue) / 100);
    } else {
      discount = Math.min(subtotal, appliedCoupon.discountValue);
    }
  }

  const finalTotal = Math.max(0, subtotal - discount);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponError('');
    setIsValidatingCoupon(true);

    try {
      const res = await api.validateCoupon(couponCode, subtotal);
      if (res.success) {
        setAppliedCoupon(res.coupon);
        setCouponError('');
      } else {
        setCouponError(res.message || 'Invalid coupon code');
        setAppliedCoupon(null);
      }
    } catch (err) {
      setCouponError('Failed to validate coupon.');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-200">
          {/* Cart Header */}
          <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold tracking-tight">Your Study Cart</h2>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2 py-0.5 rounded-full">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <button
              id="close-cart-btn"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Your cart is empty</h3>
                  <p className="text-xs text-slate-500 mt-1">Add curated NEET notes to boost your preparation.</p>
                </div>
                <button
                  id="cart-browse-btn"
                  onClick={() => {
                    onClose();
                    onBrowseNotes();
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Explore High-Yield Notes</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                  <span>Selected Resources</span>
                  <button
                    onClick={onClearCart}
                    className="text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div
                      key={item.note.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:shadow-xs transition-all"
                    >
                      <img
                        src={item.note.thumbnail || 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80'}
                        alt={item.note.title}
                        className="w-14 h-14 object-cover rounded-lg shrink-0 border border-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                          {item.note.subject}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5">
                          {item.note.title}
                        </h4>
                        <div className="text-xs font-semibold text-slate-800 mt-1">
                          {item.note.is_free ? (
                            <span className="text-emerald-600 font-bold">FREE</span>
                          ) : (
                            <span>₹{item.note.price}</span>
                          )}
                        </div>
                      </div>
                      <button
                        id={`cart-remove-item-${item.note.id}`}
                        onClick={() => onRemoveItem(item.note.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove from cart"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Coupon Box */}
                <div className="pt-4 border-t border-slate-100">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-emerald-600" />
                        <div>
                          <span className="text-xs font-bold text-emerald-900">
                            Coupon {appliedCoupon.code} Applied
                          </span>
                          <p className="text-[11px] text-emerald-700">
                            Saving ₹{discount} on this order!
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        Have a discount coupon?
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="cart-coupon-input"
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="e.g. NEET20"
                          className="flex-1 text-xs uppercase font-mono px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                        />
                        <button
                          id="cart-apply-coupon-btn"
                          type="submit"
                          disabled={isValidatingCoupon || !couponCode.trim()}
                          className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                        >
                          {isValidatingCoupon ? 'Verifying...' : 'Apply'}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-[11px] text-rose-600 font-medium">{couponError}</p>
                      )}
                      <p className="text-[10px] text-slate-400">
                        Try <strong>NEET20</strong> for 20% off or <strong>DOCTOR50</strong> on orders over ₹199
                      </p>
                    </form>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer Summary & Checkout CTA */}
          {cartItems.length > 0 && (
            <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount</span>
                  <span>₹{finalTotal}</span>
                </div>
              </div>

              <button
                id="cart-checkout-btn"
                onClick={() => {
                  onClose();
                  onProceedToCheckout(appliedCoupon);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <span>Proceed to Secure Checkout (₹{finalTotal})</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Instant PDF Download in My Library upon completion</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
