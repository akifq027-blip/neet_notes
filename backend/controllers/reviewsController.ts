import { Response } from 'express';
import { memoryStore, getPool, isMySQLConnected } from '../config/db';
import { AuthRequest } from '../middleware/auth';

export async function addReview(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Please log in to submit a review.' });
    }

    const { note_id, rating, review } = req.body;
    const ratingNum = parseInt(rating, 10);
    const noteId = parseInt(note_id, 10);

    if (!noteId || !ratingNum || ratingNum < 1 || ratingNum > 5 || !review?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid rating (1-5 stars) and a written review.',
      });
    }

    // Verify ownership: User MUST have purchased the note or note is free
    let isEligible = req.user.role === 'admin';

    if (!isEligible) {
      if (isMySQLConnected()) {
        const pool = getPool();
        if (pool) {
          const [freeCheck]: any = await pool.query('SELECT is_free FROM notes WHERE id = ?', [noteId]);
          if (freeCheck.length > 0 && freeCheck[0].is_free) {
            isEligible = true;
          } else {
            const [oRows]: any = await pool.query(
              'SELECT o.id FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.user_id = ? AND oi.note_id = ? AND o.payment_status = "paid"',
              [req.user.id, noteId]
            );
            if (oRows.length > 0) isEligible = true;
          }
        }
      } else {
        const note = memoryStore.notes.find(n => n.id === noteId);
        if (note?.is_free) {
          isEligible = true;
        } else {
          const paidOrders = memoryStore.orders.filter(o => o.user_id === req.user?.id && o.payment_status === 'paid');
          const paidOrderIds = paidOrders.map(o => o.id);
          const hasItem = memoryStore.order_items.some(oi => paidOrderIds.includes(oi.order_id) && oi.note_id === noteId);
          if (hasItem) isEligible = true;
        }
      }
    }

    if (!isEligible) {
      return res.status(403).json({
        success: false,
        message: 'Only verified purchasers who own this resource can post a review.',
      });
    }

    // Check for existing review by this user
    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        const [existing]: any = await pool.query('SELECT id FROM reviews WHERE user_id = ? AND note_id = ?', [
          req.user.id,
          noteId,
        ]);
        if (existing.length > 0) {
          await pool.query('UPDATE reviews SET rating = ?, review = ?, updated_at = NOW() WHERE id = ?', [
            ratingNum,
            review.trim(),
            existing[0].id,
          ]);
        } else {
          await pool.query(
            'INSERT INTO reviews (user_id, note_id, rating, review, status) VALUES (?, ?, ?, ?, "approved")',
            [req.user.id, noteId, ratingNum, review.trim()]
          );
        }

        // Recalculate average rating for note
        const [avgRows]: any = await pool.query(
          'SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE note_id = ? AND status = "approved"',
          [noteId]
        );
        const avg = parseFloat(avgRows[0]?.avg || '5.0');
        const count = parseInt(avgRows[0]?.count || '1', 10);
        await pool.query('UPDATE notes SET rating_avg = ?, rating_count = ? WHERE id = ?', [avg, count, noteId]);
      }
    } else {
      const existing = memoryStore.reviews.find(r => r.user_id === req.user?.id && r.note_id === noteId);
      if (existing) {
        existing.rating = ratingNum;
        existing.review = review.trim();
        existing.updated_at = new Date().toISOString();
      } else {
        memoryStore.reviews.push({
          id: memoryStore.nextIds.reviews++,
          user_id: req.user.id,
          note_id: noteId,
          rating: ratingNum,
          review: review.trim(),
          status: 'approved',
          created_at: new Date().toISOString(),
        });
      }

      const noteReviews = memoryStore.reviews.filter(r => r.note_id === noteId && r.status === 'approved');
      const note = memoryStore.notes.find(n => n.id === noteId);
      if (note && noteReviews.length > 0) {
        const avg = noteReviews.reduce((sum, r) => sum + r.rating, 0) / noteReviews.length;
        note.rating_avg = parseFloat(avg.toFixed(2));
        note.rating_count = noteReviews.length;
      }
    }

    return res.json({
      success: true,
      message: 'Thank you! Your review and rating have been posted.',
    });
  } catch (error: any) {
    console.error('[Add Review Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to submit review.' });
  }
}
