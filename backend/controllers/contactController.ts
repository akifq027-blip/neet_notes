import { Request, Response } from 'express';
import { memoryStore, getPool, isMySQLConnected } from '../config/db';
import { AuthRequest } from '../middleware/auth';

export async function submitContact(req: Request, res: Response) {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
    }

    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        await pool.query(
          'INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)',
          [name.trim(), email.trim(), subject || 'General Inquiry', message.trim()]
        );
      }
    } else {
      memoryStore.contacts.push({
        id: memoryStore.nextIds.contacts++,
        name: name.trim(),
        email: email.trim(),
        subject: subject || 'General Inquiry',
        message: message.trim(),
        is_read: 0,
        reply: null,
        created_at: new Date().toISOString(),
      });
    }

    return res.json({
      success: true,
      message: 'Thank you for reaching out! Our academic support team will respond to your email within 24 hours.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
}

export async function submitRefundRequest(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { order_id, note_id, reason } = req.body;

    if (!order_id || !note_id || !reason) {
      return res.status(400).json({ success: false, message: 'Order ID, Note ID, and reason are required.' });
    }

    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        await pool.query(
          'INSERT INTO refund_requests (user_id, order_id, note_id, reason, status) VALUES (?, ?, ?, ?, "pending")',
          [req.user.id, order_id, note_id, reason.trim()]
        );
      }
    } else {
      memoryStore.refund_requests.push({
        id: memoryStore.nextIds.refund_requests++,
        user_id: req.user.id,
        order_id,
        note_id,
        reason: reason.trim(),
        status: 'pending',
        created_at: new Date().toISOString(),
      });
    }

    return res.json({
      success: true,
      message: 'Your refund request has been logged and forwarded to administrator review.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to submit refund request.' });
  }
}
