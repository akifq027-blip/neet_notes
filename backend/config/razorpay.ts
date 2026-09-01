import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

let razorpayInstance: Razorpay | null = null;

export function isRazorpayConfigured(): boolean {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) return false;
  const key = RAZORPAY_KEY_ID.trim();
  const secret = RAZORPAY_KEY_SECRET.trim();
  
  if (
    key.includes('YourKeyId') ||
    secret.includes('YourKeySecret') ||
    key.length < 10 ||
    secret.length < 10 ||
    key === 'rzp_test_TW9S6IV6qcqE6z' // placeholder test key
  ) {
    return false;
  }
  return true;
}

export function getRazorpayClient(): Razorpay | null {
  if (isRazorpayConfigured()) {
    if (!razorpayInstance) {
      try {
        razorpayInstance = new Razorpay({
          key_id: RAZORPAY_KEY_ID,
          key_secret: RAZORPAY_KEY_SECRET,
        });
      } catch (err) {
        console.warn('[Razorpay Init Warning] Could not instantiate Razorpay SDK:', err);
        return null;
      }
    }
    return razorpayInstance;
  }
  return null;
}

export function getRazorpayPublicKey(): string {
  return isRazorpayConfigured() ? RAZORPAY_KEY_ID : '';
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  // If in test simulation mode without real keys:
  if (!isRazorpayConfigured()) {
    return Boolean(signature && (signature.startsWith('sig_') || signature.length >= 4));
  }

  try {
    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return generatedSignature === signature;
  } catch {
    return false;
  }
}

