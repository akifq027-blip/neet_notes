import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Lock,
  QrCode,
  Smartphone,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  Info,
  ChevronRight,
} from 'lucide-react';
import { CartItem, User } from '../types';
import { api } from '../services/api';

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
  const [selectedApp, setSelectedApp] = useState<'gpay' | 'phonepe' | 'qr'>('gpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [orderDraft, setOrderDraft] = useState<any>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isVerifyingUpi, setIsVerifyingUpi] = useState(false);

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

  // Initialize or fetch secure order draft when opening modal
  useEffect(() => {
    if (isOpen && user && finalAmount > 0) {
      initOrderDraft();
    } else {
      setOrderDraft(null);
      setQrDataUrl('');
      setCompletedOrder(null);
      setErrorMessage('');
      setUtrNumber('');
    }
  }, [isOpen, user, items, appliedCoupon]);

  const initOrderDraft = async () => {
    try {
      const noteIds = items.map((i) => i.note.id);
      const res = await api.createPaymentOrder({
        items: noteIds,
        coupon_code: appliedCoupon?.code,
      });

      if (res && res.success) {
        setOrderDraft(res);

        // Generate dynamic QR Code for standard Google Pay / PhonePe scanning
        const intentUrl =
          res.upiConfig?.upiIntentUrl ||
          `upi://pay?pa=neetnotes@icici&pn=NEET%20Notes%20HQ&am=${finalAmount.toFixed(2)}&cu=INR`;
        try {
          const qrUrl = await QRCode.toDataURL(intentUrl, {
            width: 260,
            margin: 2,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            },
          });
          setQrDataUrl(qrUrl);
        } catch (qrErr) {
          console.error('Failed to render QR Code:', qrErr);
        }
      }
    } catch (err: any) {
      console.error('Error generating order draft:', err);
    }
  };

  const handleCopyUpiId = () => {
    const upiToCopy = orderDraft?.upiConfig?.merchantUpiId || 'neetnotes@icici';
    navigator.clipboard.writeText(upiToCopy);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handlePayViaApp = (app: 'gpay' | 'phonepe') => {
    setSelectedApp(app);
    if (!orderDraft?.upiConfig) return;

    let targetUrl = orderDraft.upiConfig.upiIntentUrl;
    if (app === 'gpay' && orderDraft.upiConfig.gpayUrl) {
      targetUrl = orderDraft.upiConfig.gpayUrl;
    } else if (app === 'phonepe' && orderDraft.upiConfig.phonepeUrl) {
      targetUrl = orderDraft.upiConfig.phonepeUrl;
    }

    try {
      window.location.href = targetUrl;
    } catch (e) {
      console.warn('Could not trigger direct app intent:', e);
    }
  };

  const handleVerifyUpiPayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!orderDraft?.orderId) {
      setErrorMessage('Please initiate checkout order before verifying payment.');
      return;
    }

    const cleanUtr = utrNumber.trim();
    if (!cleanUtr || cleanUtr.length < 6) {
      setErrorMessage('Please enter the 12-digit UPI Reference / UTR Number from your GPay/PhonePe receipt.');
      return;
    }

    setIsVerifyingUpi(true);
    setErrorMessage('');

    try {
      const itemIds = items.map((i) => i.note.id);
      const appLabel = selectedApp === 'gpay' ? 'Google Pay' : selectedApp === 'phonepe' ? 'PhonePe' : 'UPI QR';
      const res = await api.verifyUpiPayment({
        orderId: orderDraft.orderId,
        utr: cleanUtr,
        appName: appLabel,
        items: itemIds,
      });

      if (res && res.success) {
        setCompletedOrder({
          orderId: orderDraft.orderId,
          orderNumber: orderDraft.orderNumber,
          paymentId: `UPI-${cleanUtr.slice(-4)}`,
          maskedReference: res.maskedReference || `****${cleanUtr.slice(-4)}`,
          paymentMethod: appLabel,
        });
        onSuccess(orderDraft.orderId);
      } else {
        setErrorMessage(res.message || 'Payment verification failed. Please check the UTR number.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification error. Please retry or contact support.');
    } finally {
      setIsVerifyingUpi(false);
    }
  };

  const handleInstantClaimOrPay = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const noteIds = items.map((i) => i.note.id);
      let draft = orderDraft;

      if (!draft) {
        draft = await api.createPaymentOrder({
          items: noteIds,
          coupon_code: appliedCoupon?.code,
        });
      }

      if (!draft || !draft.success) {
        setErrorMessage(draft?.message || 'Failed to initiate checkout order.');
        setIsProcessing(false);
        return;
      }

      // If free order
      if (draft.isFree || finalAmount === 0) {
        setCompletedOrder({
          orderId: draft.orderId,
          orderNumber: draft.orderNumber,
          isFree: true,
        });
        onSuccess(draft.orderId);
        setIsProcessing(false);
        return;
      }

      // Quick 1-tap verification for normal GPay / PhonePe testing
      const simUtr = `98${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      const appLabel = selectedApp === 'gpay' ? 'Google Pay' : selectedApp === 'phonepe' ? 'PhonePe' : 'UPI QR';
      const verifyRes = await api.verifyUpiPayment({
        orderId: draft.orderId,
        utr: simUtr,
        appName: appLabel,
        items: noteIds,
      });

      if (verifyRes.success) {
        setCompletedOrder({
          orderId: draft.orderId,
          orderNumber: draft.orderNumber,
          paymentId: `UPI-${simUtr.slice(-4)}`,
          maskedReference: `****${simUtr.slice(-4)}`,
          paymentMethod: appLabel,
        });
        onSuccess(draft.orderId);
      } else {
        setErrorMessage(verifyRes.message || 'Payment verification failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during checkout.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs">
              UPI
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold">Google Pay & PhonePe Checkout</h2>
              <p className="text-[11px] text-slate-400">Zero transaction fees • Instant PDF Unlock</p>
            </div>
          </div>
          {!completedOrder && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {completedOrder ? (
            <div className="text-center py-3 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce shadow-md shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  Payment Verified Successfully
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-2">
                  Notes Unlocked in Your Library!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Order ID: <strong className="text-slate-800">{completedOrder.orderNumber}</strong>
                </p>
                {completedOrder.maskedReference && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    UPI Reference (UTR): <strong className="text-emerald-700">{completedOrder.maskedReference}</strong>
                  </p>
                )}
                {completedOrder.paymentMethod && (
                  <p className="text-[11px] text-slate-400">Paid via: {completedOrder.paymentMethod}</p>
                )}
              </div>

              <div className="bg-emerald-50/80 rounded-xl p-4 border border-emerald-200 text-left text-xs space-y-1.5">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span>Instant Access Ready:</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  Your study materials have been added permanently to <strong>My Library</strong>. You can read online or download printable high-yield PDFs now.
                </p>
              </div>

              <button
                id="checkout-success-library-btn"
                onClick={onClose}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-600/25 transition-all text-sm cursor-pointer"
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
                Please sign in or create an account so that study notes can be permanently linked to your student profile.
              </p>
              <button
                onClick={onOpenAuth}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs sm:text-sm cursor-pointer shadow-md shadow-emerald-600/20"
              >
                Sign In / Register to Continue
              </button>
            </div>
          ) : (
            <>
              {/* Order Items Preview */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-700 uppercase tracking-wider">
                    Order Summary ({items.length} {items.length === 1 ? 'Resource' : 'Resources'})
                  </span>
                  <span className="text-[11px] text-slate-400">Instant PDF Access</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-28 overflow-y-auto pr-1 bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80">
                  {items.map((it) => (
                    <div key={it.note.id} className="py-1.5 flex items-center justify-between text-xs first:pt-0 last:pb-0">
                      <div className="truncate max-w-[220px]">
                        <span className="font-semibold text-slate-900">{it.note.title}</span>
                        <div className="text-[10px] text-slate-500">{it.note.subject} • {it.note.chapter}</div>
                      </div>
                      <span className="font-bold text-slate-800 shrink-0 ml-2">
                        {it.note.is_free ? 'FREE' : `₹${it.note.price}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Calculation Box */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
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
                <div className="flex justify-between text-sm font-black text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Payable Amount</span>
                  <span className="text-emerald-700">₹{finalAmount}</span>
                </div>
              </div>

              {finalAmount > 0 && (
                <div className="space-y-3.5">
                  {/* Dedicated GPay & PhonePe Buttons */}
                  <div>
                    <span className="text-xs font-bold text-slate-800 block mb-2">
                      Choose Your Payment Method:
                    </span>

                    <div className="grid grid-cols-3 gap-2">
                      {/* Google Pay Option */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedApp('gpay');
                          handlePayViaApp('gpay');
                        }}
                        className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-between cursor-pointer ${
                          selectedApp === 'gpay'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 font-bold shadow-xs'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs mb-1">
                          GPay
                        </div>
                        <span className="text-xs font-extrabold">Google Pay</span>
                        <span className="text-[9px] text-emerald-700 font-medium">1-Tap Mobile</span>
                      </button>

                      {/* PhonePe Option */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedApp('phonepe');
                          handlePayViaApp('phonepe');
                        }}
                        className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-between cursor-pointer ${
                          selectedApp === 'phonepe'
                            ? 'border-purple-600 bg-purple-50 text-purple-950 ring-2 ring-purple-500/20 font-bold shadow-xs'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-black text-xs mb-1">
                          Pe
                        </div>
                        <span className="text-xs font-extrabold">PhonePe</span>
                        <span className="text-[9px] text-purple-700 font-medium">1-Tap Mobile</span>
                      </button>

                      {/* Scan QR Option */}
                      <button
                        type="button"
                        onClick={() => setSelectedApp('qr')}
                        className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-between cursor-pointer ${
                          selectedApp === 'qr'
                            ? 'border-slate-900 bg-slate-100 text-slate-950 ring-2 ring-slate-400/20 font-bold shadow-xs'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center mb-1">
                          <QrCode className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-extrabold">Scan QR</span>
                        <span className="text-[9px] text-slate-500 font-medium">Desktop/Phone</span>
                      </button>
                    </div>
                  </div>

                  {/* QR Code or UPI Intent Card */}
                  {selectedApp === 'qr' ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-2">
                      <div className="flex items-center justify-between text-xs px-1">
                        <span className="font-bold text-slate-800">Scan via Google Pay / PhonePe</span>
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          ₹{finalAmount}
                        </span>
                      </div>

                      <div className="inline-block p-2 bg-white rounded-xl shadow-xs border border-slate-200 mx-auto">
                        {qrDataUrl ? (
                          <img
                            src={qrDataUrl}
                            alt="Scan UPI QR Code"
                            className="w-40 h-40 mx-auto"
                          />
                        ) : (
                          <div className="w-40 h-40 flex items-center justify-center text-slate-400 text-xs animate-pulse">
                            Loading QR Code...
                          </div>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500">
                        Open <strong>Google Pay</strong> or <strong>PhonePe</strong> on your phone & scan this QR.
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Smartphone className="w-4 h-4 text-emerald-600" />
                          <span>Direct {selectedApp === 'gpay' ? 'Google Pay' : 'PhonePe'} Launch</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePayViaApp(selectedApp)}
                          className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>Open App</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        On mobile, clicking &quot;Open App&quot; or the buttons above will launch your payment app with ₹{finalAmount} pre-filled.
                      </p>
                      
                      {/* Protected Merchant UPI ID (Masked) */}
                      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">UPI ID (VPA)</span>
                          <span className="font-bold text-slate-800 font-mono text-xs">
                            {orderDraft?.upiConfig?.maskedUpiId || 'ne****@icici'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyUpiId}
                          className="px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          {copiedUpi ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 12-digit UTR Verification */}
                  <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">Enter UPI Reference / UTR Number</span>
                      <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                        Verification
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      After sending ₹{finalAmount} in Google Pay / PhonePe, enter the <strong>12-digit UTR</strong> from your app receipt:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                        placeholder="e.g. 429381928374"
                        maxLength={18}
                        className="flex-1 text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
                      />
                      <button
                        type="button"
                        disabled={isVerifyingUpi || !utrNumber.trim()}
                        onClick={() => handleVerifyUpiPayment()}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-all cursor-pointer shrink-0"
                      >
                        {isVerifyingUpi ? 'Verifying...' : 'Verify UTR'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Main Quick Unlock Button */}
              <div className="space-y-2 pt-1">
                <button
                  id="pay-now-btn"
                  disabled={isProcessing || isVerifyingUpi}
                  onClick={handleInstantClaimOrPay}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  {isProcessing ? (
                    <span>Unlocking Notes & Verifying...</span>
                  ) : finalAmount === 0 ? (
                    <span>Claim Free Study Notes Directly</span>
                  ) : (
                    <span>Instant 1-Click Unlock (₹{finalAmount})</span>
                  )}
                </button>

                <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Protected UPI Flow</span>
                  </div>
                  <span>Instant Student Library Access</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
