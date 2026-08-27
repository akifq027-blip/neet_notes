import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Zap, Lock, CreditCard, Smartphone, Building, Sparkles } from 'lucide-react';
import { CartItem, User } from '../types';
import { api } from '../services/api';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  appliedCoupon: any;
  user: User | null;
  onOpenAuth: () => void;
  onSuccess: (orderId: number) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  appliedCoupon,
  user,
  onOpenAuth,
  onSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  if (!isOpen) return null;

  const subtotal = items.reduce(
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

  const finalAmount = Math.max(0, subtotal - discount);

  const handleStartPayment = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      // 1. Create order on backend
      const noteIds = items.map((i) => i.note.id);
      const res = await api.createPaymentOrder({
        items: noteIds,
        coupon_code: appliedCoupon?.code,
      });

      if (!res.success) {
        setErrorMessage(res.message || 'Failed to initiate checkout order.');
        setIsProcessing(false);
        return;
      }

      // If free order or zero cost, completed directly
      if (res.isFree) {
        setCompletedOrder({
          orderId: res.orderId,
          orderNumber: res.orderNumber,
          isFree: true,
        });
        onSuccess(res.orderId);
        setIsProcessing(false);
        return;
      }

      // If Razorpay JS is available and live credentials exist
      if (typeof window !== 'undefined' && window.Razorpay && res.isLiveRazorpay) {
        const options = {
          key: res.keyId,
          amount: res.amountPaise,
          currency: res.currency || 'INR',
          name: 'NEET Notes HQ',
          description: `Order ${res.orderNumber} - Study Materials`,
          order_id: res.razorpayOrderId,
          handler: async function (response: any) {
            try {
              const verifyRes = await api.verifyPayment({
                orderId: res.orderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              if (verifyRes.success) {
                setCompletedOrder({
                  orderId: res.orderId,
                  orderNumber: res.orderNumber,
                  paymentId: response.razorpay_payment_id,
                });
                onSuccess(res.orderId);
              } else {
                setErrorMessage('Payment verification failed.');
              }
            } catch (vErr) {
              setErrorMessage('Failed to verify payment with server.');
            }
          },
          prefill: {
            name: user.name,
            email: user.email,
            contact: user.phone || '9999999999',
          },
          theme: {
            color: '#059669',
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          setErrorMessage(resp.error?.description || 'Payment was cancelled or failed.');
          setIsProcessing(false);
        });
        rzp.open();
        setIsProcessing(false);
      } else {
        // Instant verified checkout simulation (for local dev / testing)
        setTimeout(async () => {
          try {
            const simPaymentId = `pay_sim_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
            const verifyRes = await api.verifyPayment({
              orderId: res.orderId,
              razorpay_order_id: res.razorpayOrderId,
              razorpay_payment_id: simPaymentId,
              razorpay_signature: 'sig_verified_sim',
            });

            if (verifyRes.success) {
              setCompletedOrder({
                orderId: res.orderId,
                orderNumber: res.orderNumber,
                paymentId: simPaymentId,
              });
              onSuccess(res.orderId);
            } else {
              setErrorMessage(verifyRes.message || 'Payment verification failed.');
            }
          } catch (simErr) {
            setErrorMessage('Payment failed. Please retry.');
          } finally {
            setIsProcessing(false);
          }
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during checkout.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-bold">Encrypted Checkout</h2>
          </div>
          {!completedOrder && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {completedOrder ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Payment Confirmed
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                  Order Successfully Completed!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Order Reference: <strong>{completedOrder.orderNumber}</strong>
                </p>
                {completedOrder.paymentId && (
                  <p className="text-[11px] text-slate-400">Payment ID: {completedOrder.paymentId}</p>
                )}
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left text-xs space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span>Instant Access Granted:</span>
                </div>
                <p className="text-slate-600">
                  Your purchased study notes are now unlocked and ready for high-resolution PDF download in <strong>My Library</strong>.
                </p>
              </div>

              <button
                id="checkout-success-library-btn"
                onClick={onClose}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-600/25 transition-all text-sm cursor-pointer"
              >
                Go to My Library & Download
              </button>
            </div>
          ) : !user ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Student Account Required</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Please log in or create a student account to attach study notes securely to your library.
              </p>
              <button
                onClick={onOpenAuth}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs sm:text-sm cursor-pointer"
              >
                Sign In / Register to Continue
              </button>
            </div>
          ) : (
            <>
              {/* Order Items Preview */}
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Order Summary ({items.length} {items.length === 1 ? 'Resource' : 'Resources'})
                </span>
                <div className="mt-2 divide-y divide-slate-100 max-h-36 overflow-y-auto pr-1">
                  {items.map((it) => (
                    <div key={it.note.id} className="py-2 flex items-center justify-between text-xs">
                      <div className="truncate max-w-[260px]">
                        <span className="font-semibold text-slate-900">{it.note.title}</span>
                        <div className="text-[10px] text-slate-500">{it.note.subject} • {it.note.chapter}</div>
                      </div>
                      <span className="font-bold text-slate-800">
                        {it.note.is_free ? 'FREE' : `₹${it.note.price}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Calculation Box */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Coupon ({appliedCoupon?.code})</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Total Payable</span>
                  <span>₹{finalAmount}</span>
                </div>
              </div>

              {/* Payment Mode Selection */}
              {finalAmount > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700">Select Payment Method (Razorpay Gateway)</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('upi')}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                        selectedMethod === 'upi'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Smartphone className="w-5 h-5 text-emerald-600" />
                      <span className="text-[11px]">UPI / QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedMethod('card')}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                        selectedMethod === 'card'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      <span className="text-[11px]">Debit/Credit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedMethod('netbanking')}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                        selectedMethod === 'netbanking'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Building className="w-5 h-5 text-purple-600" />
                      <span className="text-[11px]">NetBanking</span>
                    </button>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                  {errorMessage}
                </div>
              )}

              {/* Pay Button */}
              <button
                id="pay-now-btn"
                disabled={isProcessing}
                onClick={handleStartPayment}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                {isProcessing ? (
                  <span>Securing & Processing Order...</span>
                ) : finalAmount === 0 ? (
                  <span>Claim Free Study Notes Directly</span>
                ) : (
                  <span>Pay ₹{finalAmount} via {selectedMethod.toUpperCase()} & Unlock</span>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>256-Bit SSL Encrypted Transaction • Razorpay Verified</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
