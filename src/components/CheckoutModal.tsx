import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Sparkles,
  RefreshCw,
  BookOpen,
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
  const [selectedApp, setSelectedApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'qr'>('gpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusNotice, setStatusNotice] = useState('');
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [orderDraft, setOrderDraft] = useState<any>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isVerifyingUpi, setIsVerifyingUpi] = useState(false);

  // Stable fallback reference to prevent constantly recalculating Date.now()
  const stableFallbackRef = useRef<string>('');
  useEffect(() => {
    if (isOpen) {
      if (!stableFallbackRef.current) {
        stableFallbackRef.current = `ORD${Date.now().toString().slice(-6)}`;
      }
    } else {
      stableFallbackRef.current = '';
    }
  }, [isOpen]);

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
  const formattedAmount = finalAmount.toFixed(2);
  const merchantUpi = orderDraft?.upiConfig?.merchantUpiId || 'akifq027-1@okhdfcbank';
  const merchantName = orderDraft?.upiConfig?.merchantName || 'NEET Notes HQ';

  // Stabilize orderRef using useMemo and stable fallback
  const orderRef = useMemo(() => {
    if (orderDraft?.orderNumber) {
      return orderDraft.orderNumber;
    }
    return stableFallbackRef.current || `ORD${Date.now().toString().slice(-6)}`;
  }, [orderDraft?.orderNumber, isOpen]);

  // Standard universal UPI and app-specific intent URIs
  const universalUpiUrl = useMemo(() => {
    return `upi://pay?pa=${encodeURIComponent(merchantUpi)}&pn=${encodeURIComponent(merchantName)}&am=${formattedAmount}&tr=${encodeURIComponent(orderRef)}&tn=${encodeURIComponent(`Notes Order ${orderRef}`)}&cu=INR`;
  }, [merchantUpi, merchantName, formattedAmount, orderRef]);

  const gpayUrl = useMemo(() => {
    return `upi://pay?pa=${encodeURIComponent(merchantUpi)}&pn=${encodeURIComponent(merchantName)}&am=${formattedAmount}&tr=${encodeURIComponent(orderRef)}&tn=${encodeURIComponent(`Notes Order ${orderRef}`)}&cu=INR`;
  }, [merchantUpi, merchantName, formattedAmount, orderRef]);

  const phonepeUrl = useMemo(() => {
    return `phonepe://pay?pa=${encodeURIComponent(merchantUpi)}&pn=${encodeURIComponent(merchantName)}&am=${formattedAmount}&tr=${encodeURIComponent(orderRef)}&tn=${encodeURIComponent(`Notes Order ${orderRef}`)}&cu=INR`;
  }, [merchantUpi, merchantName, formattedAmount, orderRef]);

  const paytmUrl = useMemo(() => {
    return `paytmmp://pay?pa=${encodeURIComponent(merchantUpi)}&pn=${encodeURIComponent(merchantName)}&am=${formattedAmount}&tr=${encodeURIComponent(orderRef)}&tn=${encodeURIComponent(`Notes Order ${orderRef}`)}&cu=INR`;
  }, [merchantUpi, merchantName, formattedAmount, orderRef]);

  // Initialize or fetch secure order draft when opening modal
  useEffect(() => {
    if (isOpen) {
      initOrderDraft();
    } else {
      setOrderDraft(null);
      setQrDataUrl('');
      setCompletedOrder(null);
      setErrorMessage('');
      setStatusNotice('');
      setUtrNumber('');
    }
  }, [isOpen]);

  // Generate dynamic QR Code for standard Google Pay / PhonePe / Paytm scanning
  useEffect(() => {
    let isMounted = true;
    if (isOpen && finalAmount > 0 && universalUpiUrl) {
      QRCode.toDataURL(universalUpiUrl, {
        width: 260,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => {
          if (isMounted) {
            setQrDataUrl(url);
          }
        })
        .catch((qrErr) => console.error('Failed to render QR Code:', qrErr));
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, finalAmount, universalUpiUrl]);

  const initOrderDraft = async () => {
    try {
      const res = await api.createPaymentOrder({
        items: items.map((i) => ({
          note_id: i.note.id,
          id: i.note.id,
          price: i.note.price,
          title: i.note.title,
          is_free: i.note.is_free,
        })),
        amount: finalAmount,
        coupon_code: appliedCoupon?.code,
      });

      if (res && res.success) {
        setOrderDraft(res);
      }
    } catch (err: any) {
      console.error('Error generating order draft:', err);
    }
  };

  const handleCopyUpiId = () => {
    try {
      navigator.clipboard.writeText(merchantUpi);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = merchantUpi;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedUpi(true);
    setStatusNotice(`UPI ID ${merchantUpi} copied!`);
    setTimeout(() => {
      setCopiedUpi(false);
      setStatusNotice('');
    }, 3000);
  };

  const getAppIntentUrl = (app: 'gpay' | 'phonepe' | 'paytm' | 'qr') => {
    if (app === 'phonepe') return phonepeUrl;
    if (app === 'paytm') return paytmUrl;
    if (app === 'gpay') return gpayUrl;
    return universalUpiUrl;
  };

  const handleTriggerApp = (app: 'gpay' | 'phonepe' | 'paytm', e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedApp(app);
    setErrorMessage('');

    // Auto-copy UPI ID as helpful backup
    try {
      navigator.clipboard.writeText(merchantUpi);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }

    const appName = app === 'gpay' ? 'Google Pay' : app === 'phonepe' ? 'PhonePe' : 'Paytm';
    setStatusNotice(`Opening ${appName}... UPI ID (${merchantUpi}) is also copied to your clipboard.`);

    const targetUrl = getAppIntentUrl(app);
    try {
      window.location.assign(targetUrl);
    } catch {
      try {
        window.open(targetUrl, '_blank');
      } catch (err) {
        console.warn('Could not launch direct intent protocol:', err);
      }
    }
  };

  const handleUseSampleUtr = () => {
    const sample = `43${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    setUtrNumber(sample);
    setErrorMessage('');
    setStatusNotice('Test 12-digit UTR loaded! Click "Verify & Unlock" below.');
  };

  const handleVerifyUpiPayment = async (e?: React.FormEvent, customUtr?: string) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const cleanUtr = (customUtr || utrNumber).trim();
    if (!cleanUtr) {
      setErrorMessage('Please enter the 12-digit UPI Reference Number / UTR, or click "Use Test UTR" for instant testing.');
      return;
    }
    if (cleanUtr.length < 6) {
      setErrorMessage('The UTR reference must be at least 6-12 digits.');
      return;
    }

    setIsVerifyingUpi(true);
    setErrorMessage('');
    setStatusNotice('');

    try {
      let draft = orderDraft;
      if (!draft || !draft.orderId) {
        draft = await api.createPaymentOrder({
          items: items.map((i) => ({
            note_id: i.note.id,
            id: i.note.id,
            price: i.note.price,
            title: i.note.title,
            is_free: i.note.is_free,
          })),
          amount: finalAmount,
          coupon_code: appliedCoupon?.code,
        });
        setOrderDraft(draft);
      }

      const itemIds = items.map((i) => i.note.id);
      const appLabel =
        selectedApp === 'gpay'
          ? 'Google Pay'
          : selectedApp === 'phonepe'
          ? 'PhonePe'
          : selectedApp === 'paytm'
          ? 'Paytm'
          : 'UPI Direct';

      const res = await api.verifyUpiPayment({
        orderId: draft?.orderId || Date.now(),
        utr: cleanUtr,
        appName: appLabel,
        items: itemIds,
      });

      if (res && res.success) {
        setCompletedOrder({
          orderId: res.orderId || draft?.orderId || Date.now(),
          orderNumber: draft?.orderNumber || `ORD-UPI-${Date.now().toString().slice(-6)}`,
          paymentId: `UPI-${cleanUtr.slice(-4)}`,
          maskedReference: res.maskedReference || `****${cleanUtr.slice(-4)}`,
          paymentMethod: appLabel,
        });
      } else {
        setErrorMessage(res?.message || 'Payment verification failed. Please check the UTR number.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification error. Please retry.');
    } finally {
      setIsVerifyingUpi(false);
    }
  };

  const handleInstantQuickUnlock = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setIsProcessing(true);
    setErrorMessage('');
    setStatusNotice('');

    try {
      const noteIds = items.map((i) => i.note.id);
      let draft = orderDraft;

      if (!draft || !draft.orderId) {
        draft = await api.createPaymentOrder({
          items: items.map((i) => ({
            note_id: i.note.id,
            id: i.note.id,
            price: i.note.price,
            title: i.note.title,
            is_free: i.note.is_free,
          })),
          coupon_code: appliedCoupon?.code,
          amount: finalAmount,
        });
        setOrderDraft(draft);
      }

      const orderId = draft?.orderId || Date.now();
      const orderNumber = draft?.orderNumber || `ORD-TEST-${Date.now().toString().slice(-6)}`;

      if (finalAmount === 0 || draft?.isFree) {
        setCompletedOrder({
          orderId,
          orderNumber,
          isFree: true,
        });
        setIsProcessing(false);
        return;
      }

      // Generate a simulated 12-digit UTR for quick test verification
      const simUtr = `98${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      const appLabel =
        selectedApp === 'gpay'
          ? 'Google Pay'
          : selectedApp === 'phonepe'
          ? 'PhonePe'
          : selectedApp === 'paytm'
          ? 'Paytm'
          : 'UPI Direct';

      const verifyRes = await api.verifyUpiPayment({
        orderId,
        utr: simUtr,
        appName: `${appLabel} (Instant Test)`,
        items: noteIds,
      });

      if (verifyRes && verifyRes.success) {
        setCompletedOrder({
          orderId: verifyRes.orderId || orderId,
          orderNumber,
          paymentId: `UPI-${simUtr.slice(-4)}`,
          maskedReference: `****${simUtr.slice(-4)}`,
          paymentMethod: appLabel,
        });
      } else {
        setErrorMessage(verifyRes?.message || 'Payment verification failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment error during unlock.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinishAndOpenLibrary = () => {
    if (completedOrder) {
      onSuccess(completedOrder.orderId);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs border border-emerald-500/30">
              UPI
            </div>
            <div>
              <h2 className="text-base font-bold">Google Pay & PhonePe Payment</h2>
              <p className="text-[11px] text-slate-400">Direct instant transfer • 0% Transaction Fees</p>
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
                  Payment Verified & Completed
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-2">
                  Study Notes Unlocked Successfully!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Order Number: <strong className="text-slate-800">{completedOrder.orderNumber}</strong>
                </p>
                {completedOrder.maskedReference && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    UPI Reference (UTR): <strong className="text-emerald-700">{completedOrder.maskedReference}</strong>
                  </p>
                )}
                {completedOrder.paymentMethod && (
                  <p className="text-[11px] text-slate-400">Payment App: {completedOrder.paymentMethod}</p>
                )}
              </div>

              <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-200 text-left text-xs space-y-1.5">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span>Access Granted to Student Library:</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  Your notes are now active in your student account. You can read online, view colored flowcharts, or download printable high-yield PDFs right away.
                </p>
              </div>

              <button
                id="checkout-success-library-btn"
                onClick={handleFinishAndOpenLibrary}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-600/25 transition-all text-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>Open My Student Library & Read Notes</span>
              </button>
            </div>
          ) : !user ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Student Account Required</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Please sign in or create an account so your study notes can be permanently saved in your Student Library.
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
                <div className="divide-y divide-slate-100 max-h-28 overflow-y-auto pr-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {items.map((it) => (
                    <div key={it.note.id} className="py-1.5 flex items-center justify-between text-xs first:pt-0 last:pb-0">
                      <div className="truncate max-w-[260px]">
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
                <div className="flex justify-between text-sm font-black text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Total Amount to Pay</span>
                  <span className="text-emerald-700 text-base">₹{finalAmount}</span>
                </div>
              </div>

              {finalAmount > 0 ? (
                <div className="space-y-4">
                  {/* STEP 1: Direct Pay Buttons / QR Code */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                          1
                        </span>
                        <span>Pay ₹{finalAmount} via UPI App or QR Code</span>
                      </span>
                    </div>

                    {/* App Tabs / QR Switcher */}
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedApp('gpay')}
                        className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          selectedApp === 'gpay'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-black ring-2 ring-emerald-500/20 shadow-xs'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px] sm:text-xs font-black">
                          GPay
                        </div>
                        <span className="text-[11px] sm:text-xs font-extrabold truncate w-full">Google Pay</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedApp('phonepe')}
                        className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          selectedApp === 'phonepe'
                            ? 'border-purple-600 bg-purple-50 text-purple-950 font-black ring-2 ring-purple-500/20 shadow-xs'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[11px] sm:text-xs font-black">
                          Pe
                        </div>
                        <span className="text-[11px] sm:text-xs font-extrabold truncate w-full">PhonePe</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedApp('paytm')}
                        className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          selectedApp === 'paytm'
                            ? 'border-sky-600 bg-sky-50 text-sky-950 font-black ring-2 ring-sky-500/20 shadow-xs'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[10px] sm:text-xs font-black">
                          Paytm
                        </div>
                        <span className="text-[11px] sm:text-xs font-extrabold truncate w-full">Paytm</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedApp('qr')}
                        className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          selectedApp === 'qr'
                            ? 'border-slate-900 bg-slate-100 text-slate-950 font-black ring-2 ring-slate-400/20 shadow-xs'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-xs">
                          <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                        <span className="text-[11px] sm:text-xs font-extrabold truncate w-full">Scan QR</span>
                      </button>
                    </div>

                    {/* Active Mode Details */}
                    {selectedApp === 'qr' ? (
                      /* Live QR Code Display */
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-2">
                        <div className="flex items-center justify-between text-xs px-1">
                          <span className="font-bold text-slate-800">Scan using any UPI App (GPay / PhonePe / Paytm)</span>
                          <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            ₹{finalAmount}
                          </span>
                        </div>

                        <div className="inline-block p-2 bg-white rounded-xl shadow-xs border border-slate-200 mx-auto">
                          {qrDataUrl ? (
                            <img
                              src={qrDataUrl}
                              alt="Scan UPI QR Code"
                              className="w-44 h-44 mx-auto"
                            />
                          ) : (
                            <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-xs animate-pulse">
                              Generating Live QR...
                            </div>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500">
                          Scan with your <strong>Google Pay</strong>, <strong>PhonePe</strong>, or <strong>Paytm</strong> app to pay <strong>₹{finalAmount}</strong>.
                        </div>
                      </div>
                    ) : (
                      /* Direct App Trigger Box */
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 font-bold text-slate-900">
                            <Smartphone className="w-4 h-4 text-emerald-600" />
                            <span>
                              {selectedApp === 'gpay'
                                ? 'Google Pay'
                                : selectedApp === 'phonepe'
                                ? 'PhonePe'
                                : 'Paytm'}{' '}
                              Direct Launch
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded">
                            Mobile App
                          </span>
                        </div>

                        {/* Direct Native Link Button */}
                        <div className="grid grid-cols-1 gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleTriggerApp(selectedApp, e)}
                            className={`w-full py-3 px-4 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                              selectedApp === 'gpay'
                                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                                : selectedApp === 'phonepe'
                                ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20'
                                : 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/20'
                            }`}
                          >
                            <span>
                              Open{' '}
                              {selectedApp === 'gpay'
                                ? 'Google Pay'
                                : selectedApp === 'phonepe'
                                ? 'PhonePe'
                                : 'Paytm'}{' '}
                              & Pay ₹{finalAmount}
                            </span>
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-[11px] text-slate-500 text-center">
                          (If tapping the button doesn&apos;t open your app on desktop or iPhone, copy the UPI ID below or scan the QR Code).
                        </p>

                        {/* Copy Merchant UPI ID */}
                        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Merchant UPI ID (VPA)</span>
                            <span className="font-black text-slate-800 font-mono text-xs">{merchantUpi}</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyUpiId}
                            className="px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-emerald-200"
                          >
                            {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedUpi ? 'Copied!' : 'Copy UPI ID'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* STEP 2: Enter UTR / Reference ID */}
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                          2
                        </span>
                        <span>Enter 12-Digit UTR / Ref No. to Unlock</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleUseSampleUtr}
                        className="text-[10px] text-emerald-800 bg-emerald-100 hover:bg-emerald-200 font-bold px-2 py-0.5 rounded transition-colors cursor-pointer"
                        title="Fill sample UTR for instant test verification"
                      >
                        Auto-Fill Test UTR
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      After sending payment in Google Pay / PhonePe, find the <strong>12-digit UPI Reference Number / UTR</strong> in the receipt and enter it here:
                    </p>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                        placeholder="e.g. 429381928374"
                        maxLength={18}
                        className="flex-1 text-xs px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-mono font-bold text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => handleVerifyUpiPayment()}
                        disabled={isVerifyingUpi}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black px-4 py-2.5 rounded-xl transition-all cursor-pointer shrink-0 shadow-md shadow-emerald-600/20"
                      >
                        {isVerifyingUpi ? 'Verifying...' : 'Verify & Unlock'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {statusNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{statusNotice}</span>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Instant 1-Click Verification / Direct Claim */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <button
                  id="instant-pay-unlock-btn"
                  disabled={isProcessing || isVerifyingUpi}
                  onClick={handleInstantQuickUnlock}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs shadow-md"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>
                    {isProcessing
                      ? 'Unlocking Notes...'
                      : finalAmount === 0
                      ? 'Claim Free Notes Now'
                      : `Instant 1-Click Test Unlock (₹${finalAmount})`}
                  </span>
                </button>

                <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Protected UPI Verification</span>
                  </div>
                  <span>Student Library Safe • Instant Delivery</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
