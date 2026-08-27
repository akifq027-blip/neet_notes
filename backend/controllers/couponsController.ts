import { Request, Response } from 'express';
import { memoryStore, getPool, isMySQLConnected } from '../config/db';
import { AuthRequest } from '../middleware/auth';

export async function validateCoupon(req: Request, res: Response) {
  try {
    const { code, amount } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required.' });
    }

    const cleanCode = String(code).trim().toUpperCase();
    const subtotal = parseFloat(amount || '0');

    let coupon: any = null;

    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        const [rows]: any = await pool.query('SELECT * FROM coupons WHERE code = ?', [cleanCode]);
        if (rows.length > 0) coupon = rows[0];
      }
    } else {
      coupon = memoryStore.coupons.find(c => c.code === cleanCode);
    }

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code. Please check and try again.' });
    }

    if (!coupon.active) {
      return res.status(400).json({ success: false, message: 'This coupon is currently inactive.' });
    }

    if (coupon.expiry_date) {
      const expiry = new Date(coupon.expiry_date);
      if (expiry < new Date()) {
        return res.status(400).json({ success: false, message: 'This coupon has expired.' });
      }
    }

    if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit has been reached.' });
    }

    if (subtotal < parseFloat(coupon.minimum_amount || '0')) {
      return res.status(400).json({
        success: false,
        message: `This coupon requires a minimum cart value of ₹${coupon.minimum_amount}.`,
      });
    }

    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = Math.round((subtotal * parseFloat(coupon.discount_value)) / 100);
    } else {
      discount = Math.min(subtotal, parseFloat(coupon.discount_value));
    }

    return res.json({
      success: true,
      message: `Coupon '${coupon.code}' applied successfully!`,
      coupon: {
        code: coupon.code,
        discountType: coupon.discount_type,
        discountValue: coupon.discount_value,
        calculatedDiscount: discount,
        finalAmount: Math.max(0, subtotal - discount),
        description: coupon.description,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to validate coupon.' });
  }
}
