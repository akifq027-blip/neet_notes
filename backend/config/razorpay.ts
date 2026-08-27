import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_YourKeyIdHere';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'YourKeySecretHere';

let razorpayInstance: Razorpay | null = null;

export function getRazorpayClient(): Razorpay | null {
  if (
    RAZORPAY_KEY_ID &&
    RAZORPAY_KEY_SECRET &&
    !RAZORPAY_KEY_ID.includes('YourKeyId') &&
    !RAZORPAY_KEY_SECRET.includes('YourKeySecret')
  ) {
    if (!razorpayInstance) {
      razorpayInstance = new Razorpay({
        key_id: RAZORPAY_KEY_ID,
        key_secret: RAZORPAY_KEY_SECRET,
      });
    }
    return razorpayInstance;
  }
  return null;
}

export function getRazorpayPublicKey(): string {
  return RAZORPAY_KEY_ID;
}

export function isRazorpayConfigured(): boolean {
  return Boolean(
    RAZORPAY_KEY_ID &&
    RAZORPAY_KEY_SECRET &&
    !RAZORPAY_KEY_ID.includes('YourKeyId') &&
    !RAZORPAY_KEY_SECRET.includes('YourKeySecret')
  );
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  // If in test simulation mode without real keys:
  if (!isRazorpayConfigured()) {
    return signature.startsWith('sig_') || signature.length > 5;
  }

  const generatedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
}
