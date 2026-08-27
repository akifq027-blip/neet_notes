import { Response } from 'express';
import { memoryStore, getPool, isMySQLConnected } from '../config/db';
import { getRazorpayClient, getRazorpayPublicKey, verifyPaymentSignature, isRazorpayConfigured } from '../config/razorpay';
import { AuthRequest } from '../middleware/auth';

export async function createCheckoutOrder(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    }

    const { items, note_id, coupon_code } = req.body;
    let noteIdsToBuy: number[] = [];

    if (Array.isArray(items) && items.length > 0) {
      noteIdsToBuy = items.map((i: any) => parseInt(typeof i === 'object' ? i.note_id : i, 10)).filter(Boolean);
    } else if (note_id) {
      noteIdsToBuy = [parseInt(note_id, 10)];
    }

    if (noteIdsToBuy.length === 0) {
      return res.status(400).json({ success: false, message: 'No notes selected for checkout.' });
    }

    // Fetch genuine prices from database (never trust client-supplied prices)
    let selectedNotes: any[] = [];

    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        const placeholders = noteIdsToBuy.map(() => '?').join(',');
        const [rows]: any = await pool.query(
          `SELECT id, title, price, is_free FROM notes WHERE id IN (${placeholders}) AND status = 'published'`,
          noteIdsToBuy
        );
        selectedNotes = rows;
      }
    } else {
      selectedNotes = memoryStore.notes.filter(n => noteIdsToBuy.includes(n.id) && n.status === 'published');
    }

    if (selectedNotes.length === 0) {
      return res.status(404).json({ success: false, message: 'Selected notes could not be found.' });
    }

    // Check if student already owns any of these
    let alreadyOwned: number[] = [];
    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        const placeholders = selectedNotes.map(() => '?').join(',');
        const [ownedRows]: any = await pool.query(
          `SELECT oi.note_id FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.user_id = ? AND o.payment_status = 'paid' AND oi.note_id IN (${placeholders})`,
          [req.user.id, ...selectedNotes.map(n => n.id)]
        );
        alreadyOwned = ownedRows.map((r: any) => r.note_id);
      }
    } else {
      const paidOrders = memoryStore.orders.filter(o => o.user_id === req.user?.id && o.payment_status === 'paid');
      const paidOrderIds = paidOrders.map(o => o.id);
      alreadyOwned = memoryStore.order_items
        .filter(oi => paidOrderIds.includes(oi.order_id) && selectedNotes.some(n => n.id === oi.note_id))
        .map(oi => oi.note_id);
    }

    // Filter out already owned notes
    const notesToPurchase = selectedNotes.filter(n => !alreadyOwned.includes(n.id) || n.is_free);

    if (notesToPurchase.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'You already own all the selected notes in your library! Go to My Library to download them.',
      });
    }

    const subtotal = notesToPurchase.reduce((sum, n) => sum + (n.is_free ? 0 : parseFloat(n.price)), 0);
    let discountAmount = 0;
    let appliedCoupon: any = null;

    // Validate coupon if provided
    if (coupon_code && subtotal > 0) {
      const codeClean = String(coupon_code).trim().toUpperCase();
      let coupon: any = null;

      if (isMySQLConnected()) {
        const pool = getPool();
        if (pool) {
          const [cRows]: any = await pool.query('SELECT * FROM coupons WHERE code = ? AND active = 1', [codeClean]);
          if (cRows.length > 0) coupon = cRows[0];
        }
      } else {
        coupon = memoryStore.coupons.find(c => c.code === codeClean && c.active === 1);
      }

      if (coupon) {
        const now = new Date();
        const expiry = coupon.expiry_date ? new Date(coupon.expiry_date) : null;

        if ((!expiry || expiry >= now) && subtotal >= parseFloat(coupon.minimum_amount || '0')) {
          appliedCoupon = coupon;
          if (coupon.discount_type === 'percentage') {
            discountAmount = Math.round((subtotal * parseFloat(coupon.discount_value)) / 100);
          } else {
            discountAmount = Math.min(subtotal, parseFloat(coupon.discount_value));
          }
        }
      }
    }

    const totalAmount = Math.max(0, subtotal - discountAmount);
    const orderNumber = `ORD-NEET-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // If total amount is 0 (e.g. Free note or 100% off), create instant paid order
    if (totalAmount === 0) {
      let createdOrderId = 0;

      if (isMySQLConnected()) {
        const pool = getPool();
        if (pool) {
          const [ordRes]: any = await pool.query(
            `INSERT INTO orders (order_number, user_id, subtotal, discount_amount, coupon_code, total_amount, payment_status, payment_method, customer_name, customer_email)
             VALUES (?, ?, ?, ?, ?, ?, 'paid', 'free', ?, ?)`,
            [orderNumber, req.user.id, subtotal, discountAmount, appliedCoupon?.code || null, totalAmount, req.user.name, req.user.email]
          );
          createdOrderId = ordRes.insertId;

          for (const note of notesToPurchase) {
            await pool.query(
              'INSERT INTO order_items (order_id, note_id, price, note_title) VALUES (?, ?, ?, ?)',
              [createdOrderId, note.id, note.price, note.title]
            );
            await pool.query('UPDATE notes SET purchase_count = purchase_count + 1 WHERE id = ?', [note.id]);
          }
        }
      } else {
        createdOrderId = memoryStore.nextIds.orders++;
        const newOrder = {
          id: createdOrderId,
          order_number: orderNumber,
          user_id: req.user.id,
          subtotal,
          discount_amount: discountAmount,
          coupon_code: appliedCoupon?.code || null,
          total_amount: 0,
          payment_status: 'paid',
          payment_method: 'free',
          razorpay_order_id: null,
          razorpay_payment_id: null,
          razorpay_signature: null,
          customer_name: req.user.name,
          customer_email: req.user.email,
          customer_phone: null,
          created_at: new Date().toISOString(),
        };
        memoryStore.orders.push(newOrder);

        notesToPurchase.forEach(note => {
          memoryStore.order_items.push({
            id: memoryStore.nextIds.order_items++,
            order_id: createdOrderId,
            note_id: note.id,
            price: note.price,
            note_title: note.title,
            created_at: new Date().toISOString(),
          });
          note.purchase_count = (note.purchase_count || 0) + 1;
        });
      }

      return res.json({
        success: true,
        isFree: true,
        orderId: createdOrderId,
        orderNumber,
        totalAmount: 0,
        message: 'Notes added directly to your My Library!',
      });
    }

    // Create Razorpay Order
    let razorpayOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const razorpayClient = getRazorpayClient();

    if (razorpayClient && isRazorpayConfigured()) {
      try {
        const rzpOrder = await razorpayClient.orders.create({
          amount: Math.round(totalAmount * 100), // amount in paise
          currency: 'INR',
          receipt: orderNumber,
          notes: {
            userId: String(req.user.id),
            userEmail: req.user.email,
          },
        });
        razorpayOrderId = rzpOrder.id;
      } catch (rzpErr) {
        console.warn('[Razorpay API Notice] Using simulated order ID:', rzpErr);
      }
    }

    let createdOrderId = 0;

    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        const [ordRes]: any = await pool.query(
          `INSERT INTO orders (order_number, user_id, subtotal, discount_amount, coupon_code, total_amount, payment_status, payment_method, razorpay_order_id, customer_name, customer_email)
           VALUES (?, ?, ?, ?, ?, ?, 'pending', 'razorpay', ?, ?, ?)`,
          [
            orderNumber,
            req.user.id,
            subtotal,
            discountAmount,
            appliedCoupon?.code || null,
            totalAmount,
            razorpayOrderId,
            req.user.name,
            req.user.email,
          ]
        );
        createdOrderId = ordRes.insertId;

        for (const note of notesToPurchase) {
          await pool.query(
            'INSERT INTO order_items (order_id, note_id, price, note_title) VALUES (?, ?, ?, ?)',
            [createdOrderId, note.id, note.price, note.title]
          );
        }
      }
    } else {
      createdOrderId = memoryStore.nextIds.orders++;
      const newOrder = {
        id: createdOrderId,
        order_number: orderNumber,
        user_id: req.user.id,
        subtotal,
        discount_amount: discountAmount,
        coupon_code: appliedCoupon?.code || null,
        total_amount: totalAmount,
        payment_status: 'pending',
        payment_method: 'razorpay',
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: null,
        razorpay_signature: null,
        customer_name: req.user.name,
        customer_email: req.user.email,
        customer_phone: null,
        created_at: new Date().toISOString(),
      };
      memoryStore.orders.push(newOrder);

      notesToPurchase.forEach(note => {
        memoryStore.order_items.push({
          id: memoryStore.nextIds.order_items++,
          order_id: createdOrderId,
          note_id: note.id,
          price: note.price,
          note_title: note.title,
          created_at: new Date().toISOString(),
        });
      });
    }

    return res.json({
      success: true,
      isFree: false,
      orderId: createdOrderId,
      orderNumber,
      razorpayOrderId,
      amount: totalAmount,
      amountPaise: Math.round(totalAmount * 100),
      currency: 'INR',
      subtotal,
      discountAmount,
      keyId: getRazorpayPublicKey(),
      isLiveRazorpay: isRazorpayConfigured(),
      customer: {
        name: req.user.name,
        email: req.user.email,
      },
    });
  } catch (error: any) {
    console.error('[Create Order Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to initiate checkout order.' });
  }
}

export async function verifyPayment(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required.' });
    }

    // Verify signature
    const isValid = verifyPaymentSignature(
      razorpay_order_id || '',
      razorpay_payment_id || 'pay_test',
      razorpay_signature || 'sig_test'
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Invalid cryptographic signature.',
      });
    }

    // Update order to paid
    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        await pool.query(
          `UPDATE orders SET payment_status = 'paid', razorpay_payment_id = ?, razorpay_signature = ?, updated_at = NOW() WHERE id = ? AND user_id = ?`,
          [razorpay_payment_id || 'pay_verified', razorpay_signature || 'sig_verified', orderId, req.user.id]
        );

        // Increment purchase counts and coupon times_used
        const [items]: any = await pool.query('SELECT note_id FROM order_items WHERE order_id = ?', [orderId]);
        for (const item of items) {
          await pool.query('UPDATE notes SET purchase_count = purchase_count + 1 WHERE id = ?', [item.note_id]);
        }

        const [ord]: any = await pool.query('SELECT coupon_code FROM orders WHERE id = ?', [orderId]);
        if (ord[0]?.coupon_code) {
          await pool.query('UPDATE coupons SET times_used = times_used + 1 WHERE code = ?', [ord[0].coupon_code]);
        }
      }
    } else {
      const order = memoryStore.orders.find(o => o.id === parseInt(orderId, 10) && o.user_id === req.user?.id);
      if (order) {
        order.payment_status = 'paid';
        order.razorpay_payment_id = razorpay_payment_id || 'pay_test_verified';
        order.razorpay_signature = razorpay_signature || 'sig_test_verified';

        const items = memoryStore.order_items.filter(oi => oi.order_id === order.id);
        items.forEach(item => {
          const note = memoryStore.notes.find(n => n.id === item.note_id);
          if (note) note.purchase_count = (note.purchase_count || 0) + 1;
        });

        if (order.coupon_code) {
          const cp = memoryStore.coupons.find(c => c.code === order.coupon_code);
          if (cp) cp.times_used = (cp.times_used || 0) + 1;
        }
      }
    }

    return res.json({
      success: true,
      message: 'Payment verified successfully! Notes have been added to your library.',
      orderId,
    });
  } catch (error: any) {
    console.error('[Verify Payment Error]', error);
    return res.status(500).json({ success: false, message: 'Payment verification failed.' });
  }
}

export async function getUserOrders(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    let ordersWithItems: any[] = [];

    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        const [orders]: any = await pool.query(
          'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
          [req.user.id]
        );

        for (const order of orders) {
          const [items]: any = await pool.query(
            `SELECT oi.*, n.slug, n.subject, n.chapter, n.thumbnail, n.pdf_file 
             FROM order_items oi 
             LEFT JOIN notes n ON oi.note_id = n.id 
             WHERE oi.order_id = ?`,
            [order.id]
          );
          ordersWithItems.push({ ...order, items });
        }
      }
    } else {
      const userOrders = memoryStore.orders
        .filter(o => o.user_id === req.user?.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      ordersWithItems = userOrders.map(order => {
        const items = memoryStore.order_items
          .filter(oi => oi.order_id === order.id)
          .map(item => {
            const note = memoryStore.notes.find(n => n.id === item.note_id);
            return {
              ...item,
              slug: note?.slug,
              subject: note?.subject,
              chapter: note?.chapter,
              thumbnail: note?.thumbnail,
              pdf_file: note?.pdf_file,
            };
          });
        return { ...order, items };
      });
    }

    return res.json({
      success: true,
      orders: ordersWithItems,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch order history.' });
  }
}
