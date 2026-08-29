import { Request, Response } from 'express';
import { memoryStore, getPool, isMySQLConnected, getDatabaseStatus } from '../config/db';
import { AuthRequest } from '../middleware/auth';

// 1. DASHBOARD ANALYTICS
export async function getDashboardAnalytics(req: AuthRequest, res: Response) {
  try {
    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        // Students count
        const [studentRows]: any = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "student"');
        const totalStudents = studentRows[0]?.count || 0;

        // Notes counts
        const [notesRows]: any = await pool.query('SELECT COUNT(*) as total, SUM(CASE WHEN is_free = 1 THEN 1 ELSE 0 END) as free_count, SUM(CASE WHEN is_free = 0 THEN 1 ELSE 0 END) as paid_count FROM notes');
        const totalNotes = notesRows[0]?.total || 0;
        const freeNotes = notesRows[0]?.free_count || 0;
        const paidNotes = notesRows[0]?.paid_count || 0;

        // Orders & Revenue
        const [orderRows]: any = await pool.query(
          'SELECT COUNT(*) as total_orders, SUM(CASE WHEN payment_status = "paid" THEN 1 ELSE 0 END) as paid_orders, SUM(CASE WHEN payment_status = "paid" THEN total_amount ELSE 0 END) as total_revenue FROM orders'
        );
        const totalOrders = orderRows[0]?.total_orders || 0;
        const paidOrders = orderRows[0]?.paid_orders || 0;
        const totalRevenue = parseFloat(orderRows[0]?.total_revenue || '0');

        // Downloads
        const [dlRows]: any = await pool.query('SELECT COUNT(*) as count FROM downloads');
        const totalDownloads = dlRows[0]?.count || 0;

        // Recent 5 Orders
        const [recentOrders]: any = await pool.query(
          'SELECT id, order_number, customer_name, customer_email, total_amount, payment_status, created_at FROM orders ORDER BY created_at DESC LIMIT 5'
        );

        // Top 5 Most Purchased Notes
        const [topNotes]: any = await pool.query(
          'SELECT id, title, subject, chapter, price, purchase_count, rating_avg, thumbnail FROM notes ORDER BY purchase_count DESC LIMIT 5'
        );

        // Subject Breakdown
        const [subjectStats]: any = await pool.query(
          'SELECT subject, COUNT(*) as count, SUM(purchase_count) as total_sales FROM notes GROUP BY subject'
        );

        return res.json({
          success: true,
          stats: {
            totalStudents,
            totalNotes,
            freeNotes,
            paidNotes,
            totalOrders,
            paidOrders,
            totalRevenue,
            totalDownloads,
          },
          recentOrders,
          topNotes,
          subjectStats,
          databaseStatus: getDatabaseStatus(),
        });
      }
    }

    // In-memory fallback analytics
    const totalStudents = memoryStore.users.filter(u => u.role === 'student').length;
    const totalNotes = memoryStore.notes.length;
    const freeNotes = memoryStore.notes.filter(n => n.is_free === 1).length;
    const paidNotes = memoryStore.notes.filter(n => n.is_free === 0).length;
    const totalOrders = memoryStore.orders.length;
    const paidOrders = memoryStore.orders.filter(o => o.payment_status === 'paid').length;
    const totalRevenue = memoryStore.orders
      .filter(o => o.payment_status === 'paid')
      .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
    const totalDownloads = memoryStore.downloads.length + memoryStore.notes.reduce((sum, n) => sum + (n.download_count || 0), 0);

    const recentOrders = [...memoryStore.orders]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    const topNotes = [...memoryStore.notes]
      .sort((a, b) => (b.purchase_count || 0) - (a.purchase_count || 0))
      .slice(0, 5);

    const subjects = ['Physics', 'Chemistry', 'Biology', 'General NEET'];
    const subjectStats = subjects.map(s => ({
      subject: s,
      count: memoryStore.notes.filter(n => n.subject === s).length,
      total_sales: memoryStore.notes.filter(n => n.subject === s).reduce((sum, n) => sum + (n.purchase_count || 0), 0),
    }));

    return res.json({
      success: true,
      stats: {
        totalStudents,
        totalNotes,
        freeNotes,
        paidNotes,
        totalOrders,
        paidOrders,
        totalRevenue,
        totalDownloads,
      },
      recentOrders,
      topNotes,
      subjectStats,
      databaseStatus: getDatabaseStatus(),
    });
  } catch (error: any) {
    console.error('[Admin Analytics Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch admin analytics' });
  }
}

// 2. NOTES CRUD
export async function getAdminNotes(req: Request, res: Response) {
  try {
    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        const [rows]: any = await pool.query(
          'SELECT n.*, c.name as category_name FROM notes n LEFT JOIN categories c ON n.category_id = c.id ORDER BY n.id DESC'
        );
        return res.json({ success: true, notes: rows });
      }
    }

    const notes = memoryStore.notes.map(n => {
      const cat = memoryStore.categories.find(c => c.id === n.category_id);
      return { ...n, category_name: cat?.name || 'General' };
    });

    return res.json({ success: true, notes });
  } catch (error: any) {
    console.error('[Get Admin Notes Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch admin notes' });
  }
}

export async function createAdminNote(req: Request, res: Response) {
  try {
    const {
      title,
      description,
      subject,
      chapter,
      category_id,
      price,
      original_price,
      is_free,
      is_featured,
      is_bestseller,
      author_name,
      total_pages,
      preview_pages,
      status,
      thumbnail_url,
    } = req.body;

    if (!title || !subject || !chapter || !description) {
      return res.status(400).json({ success: false, message: 'Title, Subject, Chapter, and Description are required.' });
    }

    // Normalize subject to match enum ('Physics', 'Chemistry', 'Biology', 'General NEET')
    let safeSubject = 'General NEET';
    const subLower = String(subject || '').toLowerCase();
    if (subLower.includes('bio') || subLower.includes('botan') || subLower.includes('zool')) safeSubject = 'Biology';
    else if (subLower.includes('chem') || subLower.includes('organ') || subLower.includes('inorgan')) safeSubject = 'Chemistry';
    else if (subLower.includes('phys')) safeSubject = 'Physics';
    else if (['Physics', 'Chemistry', 'Biology', 'General NEET'].includes(subject)) safeSubject = subject;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const pdfFilename = files?.['pdf_file']?.[0]?.filename || 'sample-handbook.pdf';
    const previewFilename = files?.['preview_file']?.[0]?.filename || null;
    const thumbFilename = files?.['thumbnail']?.[0]?.filename
      ? `/backend/uploads/thumbnails/${files['thumbnail'][0].filename}`
      : (thumbnail_url || 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80');

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Math.floor(100 + Math.random() * 900);

    const priceNum = isNaN(parseFloat(price)) ? 0 : parseFloat(price);
    const origPriceNum = isNaN(parseFloat(original_price)) ? priceNum : parseFloat(original_price);
    const isFreeVal = is_free === '1' || is_free === 'true' || is_free === 1 || is_free === true || priceNum === 0 ? 1 : 0;
    const isFeaturedVal = is_featured === '1' || is_featured === 'true' || is_featured === 1 || is_featured === true ? 1 : 0;
    const isBestsellerVal = is_bestseller === '1' || is_bestseller === 'true' || is_bestseller === 1 || is_bestseller === true ? 1 : 0;
    const safeTotalPages = parseInt(total_pages, 10) || 35;
    const safePreviewPages = parseInt(preview_pages, 10) || 4;
    const safeAuthor = author_name?.trim() || 'Dr. AIIMS NEET Faculty';
    const safeStatus = status || 'published';

    let safeCategoryId: number | null = null;
    if (category_id && !isNaN(parseInt(category_id, 10))) {
      safeCategoryId = parseInt(category_id, 10);
    }

    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        // Validate category exists in categories table to satisfy foreign key
        if (safeCategoryId) {
          const [catRows]: any = await pool.query('SELECT id FROM categories WHERE id = ?', [safeCategoryId]);
          if (catRows.length === 0) {
            safeCategoryId = null;
          }
        }

        const [result]: any = await pool.query(
          `INSERT INTO notes (
            title, slug, description, subject, chapter, category_id,
            price, original_price, thumbnail, pdf_file, preview_file,
            preview_pages, total_pages, is_free, is_featured, is_bestseller,
            author_name, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            title.trim(),
            slug,
            description.trim(),
            safeSubject,
            chapter.trim(),
            safeCategoryId,
            priceNum,
            origPriceNum,
            thumbFilename,
            pdfFilename,
            previewFilename,
            safePreviewPages,
            safeTotalPages,
            isFreeVal,
            isFeaturedVal,
            isBestsellerVal,
            safeAuthor,
            safeStatus,
          ]
        );

        const newId = result.insertId;
        const [createdRows]: any = await pool.query(
          'SELECT n.*, c.name as category_name FROM notes n LEFT JOIN categories c ON n.category_id = c.id WHERE n.id = ?',
          [newId]
        );

        const createdNote = createdRows[0] || {
          id: newId,
          title: title.trim(),
          slug,
          description: description.trim(),
          subject: safeSubject,
          chapter: chapter.trim(),
          category_id: safeCategoryId,
          price: priceNum,
          original_price: origPriceNum,
          thumbnail: thumbFilename,
          pdf_file: pdfFilename,
          preview_file: previewFilename,
          preview_pages: safePreviewPages,
          total_pages: safeTotalPages,
          file_size_mb: 4.5,
          is_free: isFreeVal,
          is_featured: isFeaturedVal,
          is_bestseller: isBestsellerVal,
          author_name: safeAuthor,
          rating_avg: 5.0,
          rating_count: 1,
          purchase_count: 0,
          download_count: 0,
          status: safeStatus,
          created_at: new Date().toISOString(),
        };

        memoryStore.notes.unshift(createdNote);

        console.log(`[Admin] Successfully created note #${newId} (${title.trim()}) in MySQL.`);
        return res.status(201).json({
          success: true,
          message: 'Study note uploaded and published successfully in database!',
          noteId: newId,
          note: createdNote,
        });
      }
    }

    const newId = memoryStore.nextIds.notes++;
    const newNote = {
      id: newId,
      title: title.trim(),
      slug,
      description: description.trim(),
      subject: safeSubject,
      chapter: chapter.trim(),
      category_id: safeCategoryId || 1,
      price: priceNum,
      original_price: origPriceNum,
      thumbnail: thumbFilename,
      pdf_file: pdfFilename,
      preview_file: previewFilename,
      preview_pages: safePreviewPages,
      total_pages: safeTotalPages,
      file_size_mb: 4.5,
      is_free: isFreeVal,
      is_featured: isFeaturedVal,
      is_bestseller: isBestsellerVal,
      author_name: safeAuthor,
      rating_avg: 5.0,
      rating_count: 1,
      purchase_count: 0,
      download_count: 0,
      status: safeStatus,
      created_at: new Date().toISOString(),
    };

    memoryStore.notes.unshift(newNote);

    return res.status(201).json({
      success: true,
      message: 'Study note uploaded and published successfully!',
      note: newNote,
    });
  } catch (error: any) {
    console.error('[Create Note Error]', error);
    return res.status(500).json({ success: false, message: `Failed to create note: ${error.message || 'Database error'}` });
  }
}

export async function updateAdminNote(req: Request, res: Response) {
  try {
    const noteId = parseInt(req.params.id, 10);
    const {
      title,
      description,
      subject,
      chapter,
      category_id,
      price,
      original_price,
      is_free,
      is_featured,
      is_bestseller,
      author_name,
      total_pages,
      preview_pages,
      status,
      thumbnail_url,
    } = req.body;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        let updateFields: string[] = [];
        let params: any[] = [];

        if (title) { updateFields.push('title = ?'); params.push(title.trim()); }
        if (description) { updateFields.push('description = ?'); params.push(description.trim()); }
        if (subject) {
          let safeSubject = subject;
          const subLower = String(subject).toLowerCase();
          if (subLower.includes('bio')) safeSubject = 'Biology';
          else if (subLower.includes('chem')) safeSubject = 'Chemistry';
          else if (subLower.includes('phys')) safeSubject = 'Physics';
          else if (['Physics', 'Chemistry', 'Biology', 'General NEET'].includes(subject)) safeSubject = subject;
          updateFields.push('subject = ?');
          params.push(safeSubject);
        }
        if (chapter) { updateFields.push('chapter = ?'); params.push(chapter.trim()); }
        if (category_id !== undefined) {
          const parsedCat = parseInt(category_id, 10);
          let safeCat: number | null = null;
          if (!isNaN(parsedCat)) {
            const [catCheck]: any = await pool.query('SELECT id FROM categories WHERE id = ?', [parsedCat]);
            if (catCheck.length > 0) safeCat = parsedCat;
          }
          updateFields.push('category_id = ?');
          params.push(safeCat);
        }
        if (price !== undefined) { updateFields.push('price = ?'); params.push(parseFloat(price) || 0); }
        if (original_price !== undefined) { updateFields.push('original_price = ?'); params.push(parseFloat(original_price) || 0); }
        if (is_free !== undefined) { updateFields.push('is_free = ?'); params.push(is_free === '1' || is_free === 'true' || is_free === 1 || is_free === true ? 1 : 0); }
        if (is_featured !== undefined) { updateFields.push('is_featured = ?'); params.push(is_featured === '1' || is_featured === 'true' || is_featured === 1 || is_featured === true ? 1 : 0); }
        if (is_bestseller !== undefined) { updateFields.push('is_bestseller = ?'); params.push(is_bestseller === '1' || is_bestseller === 'true' || is_bestseller === 1 || is_bestseller === true ? 1 : 0); }
        if (author_name) { updateFields.push('author_name = ?'); params.push(author_name.trim()); }
        if (total_pages) { updateFields.push('total_pages = ?'); params.push(parseInt(total_pages, 10) || 35); }
        if (preview_pages) { updateFields.push('preview_pages = ?'); params.push(parseInt(preview_pages, 10) || 4); }
        if (status) { updateFields.push('status = ?'); params.push(status); }

        if (files?.['pdf_file']?.[0]) {
          updateFields.push('pdf_file = ?');
          params.push(files['pdf_file'][0].filename);
        }
        if (files?.['preview_file']?.[0]) {
          updateFields.push('preview_file = ?');
          params.push(files['preview_file'][0].filename);
        }
        if (files?.['thumbnail']?.[0]) {
          updateFields.push('thumbnail = ?');
          params.push(`/backend/uploads/thumbnails/${files['thumbnail'][0].filename}`);
        } else if (thumbnail_url) {
          updateFields.push('thumbnail = ?');
          params.push(thumbnail_url);
        }

        if (updateFields.length > 0) {
          params.push(noteId);
          await pool.query(`UPDATE notes SET ${updateFields.join(', ')} WHERE id = ?`, params);
        }

        const [updatedRows]: any = await pool.query(
          'SELECT n.*, c.name as category_name FROM notes n LEFT JOIN categories c ON n.category_id = c.id WHERE n.id = ?',
          [noteId]
        );

        const updatedNote = updatedRows[0];
        const memIdx = memoryStore.notes.findIndex(n => n.id === noteId);
        if (memIdx >= 0 && updatedNote) {
          memoryStore.notes[memIdx] = { ...memoryStore.notes[memIdx], ...updatedNote };
        }

        console.log(`[Admin] Successfully updated note #${noteId} in MySQL.`);
        return res.json({ success: true, message: 'Note updated successfully in database!', note: updatedNote });
      }
    }

    const note = memoryStore.notes.find(n => n.id === noteId);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });

    if (title) note.title = title.trim();
    if (description) note.description = description.trim();
    if (subject) note.subject = subject;
    if (chapter) note.chapter = chapter.trim();
    if (category_id !== undefined) note.category_id = parseInt(category_id, 10) || 1;
    if (price !== undefined) note.price = parseFloat(price);
    if (original_price !== undefined) note.original_price = parseFloat(original_price);
    if (is_free !== undefined) note.is_free = is_free === '1' || is_free === 'true' || is_free === 1 || is_free === true ? 1 : 0;
    if (is_featured !== undefined) note.is_featured = is_featured === '1' || is_featured === 'true' || is_featured === 1 || is_featured === true ? 1 : 0;
    if (is_bestseller !== undefined) note.is_bestseller = is_bestseller === '1' || is_bestseller === 'true' || is_bestseller === 1 || is_bestseller === true ? 1 : 0;
    if (author_name) note.author_name = author_name;
    if (total_pages) note.total_pages = parseInt(total_pages, 10);
    if (preview_pages) note.preview_pages = parseInt(preview_pages, 10);
    if (status) note.status = status;
    if (thumbnail_url) note.thumbnail = thumbnail_url;

    if (files?.['pdf_file']?.[0]) note.pdf_file = files['pdf_file'][0].filename;
    if (files?.['preview_file']?.[0]) note.preview_file = files['preview_file'][0].filename;
    if (files?.['thumbnail']?.[0]) note.thumbnail = `/backend/uploads/thumbnails/${files['thumbnail'][0].filename}`;

    return res.json({ success: true, message: 'Note updated successfully!', note });
  } catch (error: any) {
    console.error('[Update Note Error]', error);
    return res.status(500).json({ success: false, message: `Failed to update note: ${error.message || 'Database error'}` });
  }
}

export async function deleteAdminNote(req: Request, res: Response) {
  try {
    const noteId = parseInt(req.params.id, 10);

    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        // Clean up child dependencies safely if not handled by foreign key cascade
        try { await pool.query('DELETE FROM order_items WHERE note_id = ?', [noteId]); } catch (e) {}
        try { await pool.query('DELETE FROM reviews WHERE note_id = ?', [noteId]); } catch (e) {}
        try { await pool.query('DELETE FROM downloads WHERE note_id = ?', [noteId]); } catch (e) {}
        try { await pool.query('DELETE FROM wishlist WHERE note_id = ?', [noteId]); } catch (e) {}
        try { await pool.query('DELETE FROM refund_requests WHERE note_id = ?', [noteId]); } catch (e) {}

        await pool.query('DELETE FROM notes WHERE id = ?', [noteId]);
        console.log(`[Admin] Successfully deleted note #${noteId} from MySQL.`);
      }
    }

    const idx = memoryStore.notes.findIndex(n => n.id === noteId);
    if (idx >= 0) {
      memoryStore.notes.splice(idx, 1);
    }

    return res.json({ success: true, message: 'Note deleted permanently from database.' });
  } catch (error: any) {
    console.error('[Delete Note Error]', error);
    return res.status(500).json({ success: false, message: `Failed to delete note: ${error.message || 'Database error'}` });
  }
}

// 3. ORDERS MANAGEMENT
export async function getAdminOrders(req: Request, res: Response) {
  try {
    const { status, search } = req.query;

    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        let sql = 'SELECT * FROM orders';
        const params: any[] = [];
        const where: string[] = [];

        if (status && status !== 'all') {
          where.push('payment_status = ?');
          params.push(status);
        }
        if (search) {
          where.push('(order_number LIKE ? OR customer_name LIKE ? OR customer_email LIKE ?)');
          const t = `%${search}%`;
          params.push(t, t, t);
        }

        if (where.length > 0) sql += ` WHERE ${where.join(' AND ')}`;
        sql += ' ORDER BY created_at DESC';

        const [orders]: any = await pool.query(sql, params);
        return res.json({ success: true, orders });
      }
    }

    let orders = [...memoryStore.orders];
    if (status && status !== 'all') {
      orders = orders.filter(o => o.payment_status === status);
    }
    if (search) {
      const q = String(search).toLowerCase();
      orders = orders.filter(
        o =>
          o.order_number.toLowerCase().includes(q) ||
          o.customer_name?.toLowerCase().includes(q) ||
          o.customer_email?.toLowerCase().includes(q)
      );
    }

    orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return res.json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch admin orders' });
  }
}

export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { payment_status } = req.body;

    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        await pool.query('UPDATE orders SET payment_status = ? WHERE id = ?', [payment_status, orderId]);
        return res.json({ success: true, message: 'Order status updated successfully.' });
      }
    }

    const order = memoryStore.orders.find(o => o.id === orderId);
    if (order) {
      order.payment_status = payment_status;
    }

    return res.json({ success: true, message: 'Order status updated.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update order' });
  }
}

// 4. USERS MANAGEMENT
export async function getAdminUsers(req: Request, res: Response) {
  try {
    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        const [users]: any = await pool.query(
          `SELECT u.id, u.name, u.email, u.role, u.phone, u.status, u.created_at,
                  COUNT(DISTINCT o.id) as orders_count,
                  COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END), 0) as total_spent
           FROM users u
           LEFT JOIN orders o ON u.id = o.user_id
           GROUP BY u.id
           ORDER BY u.created_at DESC`
        );
        return res.json({ success: true, users });
      }
    }

    const users = memoryStore.users.map(u => {
      const userOrders = memoryStore.orders.filter(o => o.user_id === u.id);
      const totalSpent = userOrders
        .filter(o => o.payment_status === 'paid')
        .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone,
        status: u.status,
        created_at: u.created_at,
        orders_count: userOrders.length,
        total_spent: totalSpent,
      };
    });

    return res.json({ success: true, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
}

export async function toggleUserStatus(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
        return res.json({ success: true, message: `User status changed to ${status}.` });
      }
    }

    const user = memoryStore.users.find(u => u.id === userId);
    if (user) user.status = status;

    return res.json({ success: true, message: `User status changed to ${status}.` });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update user status' });
  }
}

// 5. REVIEWS MODERATION
export async function getAdminReviews(req: Request, res: Response) {
  try {
    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        const [reviews]: any = await pool.query(
          `SELECT r.*, COALESCE(u.name, 'Student') as user_name, COALESCE(u.email, '') as user_email, COALESCE(n.title, 'Study Note') as note_title
           FROM reviews r
           LEFT JOIN users u ON r.user_id = u.id
           LEFT JOIN notes n ON r.note_id = n.id
           ORDER BY r.created_at DESC`
        );
        return res.json({ success: true, reviews });
      }
    }

    const reviews = memoryStore.reviews.map(r => {
      const user = memoryStore.users.find(u => u.id === r.user_id);
      const note = memoryStore.notes.find(n => n.id === r.note_id);
      return {
        ...r,
        user_name: user?.name || 'Student',
        user_email: user?.email || '',
        note_title: note?.title || 'Study Note',
      };
    });

    return res.json({ success: true, reviews });
  } catch (error: any) {
    console.error('[Get Admin Reviews Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
}

export async function updateReviewStatus(req: Request, res: Response) {
  try {
    const reviewId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        await pool.query('UPDATE reviews SET status = ? WHERE id = ?', [status, reviewId]);
        return res.json({ success: true, message: `Review marked as ${status}.` });
      }
    }

    const review = memoryStore.reviews.find(r => r.id === reviewId);
    if (review) review.status = status;

    return res.json({ success: true, message: `Review marked as ${status}.` });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update review' });
  }
}

export async function deleteReview(req: Request, res: Response) {
  try {
    const reviewId = parseInt(req.params.id, 10);

    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        await pool.query('DELETE FROM reviews WHERE id = ?', [reviewId]);
        return res.json({ success: true, message: 'Review deleted successfully.' });
      }
    }

    const idx = memoryStore.reviews.findIndex(r => r.id === reviewId);
    if (idx >= 0) memoryStore.reviews.splice(idx, 1);

    return res.json({ success: true, message: 'Review deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete review' });
  }
}

// 6. COUPONS CRUD
export async function getAdminCoupons(req: Request, res: Response) {
  try {
    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        const [coupons]: any = await pool.query('SELECT * FROM coupons ORDER BY id DESC');
        return res.json({ success: true, coupons });
      }
    }
    return res.json({ success: true, coupons: memoryStore.coupons });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch coupons' });
  }
}

export async function createAdminCoupon(req: Request, res: Response) {
  try {
    const { code, description, discount_type, discount_value, minimum_amount, usage_limit, expiry_date } = req.body;

    if (!code || !discount_value) {
      return res.status(400).json({ success: false, message: 'Coupon code and discount value are required.' });
    }

    const cleanCode = String(code).trim().toUpperCase();

    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        await pool.query(
          `INSERT INTO coupons (code, description, discount_type, discount_value, minimum_amount, usage_limit, expiry_date, active)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1)
           ON DUPLICATE KEY UPDATE description = VALUES(description), discount_type = VALUES(discount_type), discount_value = VALUES(discount_value), minimum_amount = VALUES(minimum_amount), usage_limit = VALUES(usage_limit), expiry_date = VALUES(expiry_date), active = 1`,
          [
            cleanCode,
            description || '',
            discount_type || 'percentage',
            parseFloat(discount_value),
            parseFloat(minimum_amount || '0'),
            parseInt(usage_limit || '500', 10),
            expiry_date || null,
          ]
        );
        return res.status(201).json({ success: true, message: 'Coupon saved successfully!' });
      }
    }

    const newCoupon = {
      id: memoryStore.nextIds.coupons++,
      code: cleanCode,
      description: description || '',
      discount_type: discount_type || 'percentage',
      discount_value: parseFloat(discount_value),
      minimum_amount: parseFloat(minimum_amount || '0'),
      usage_limit: parseInt(usage_limit || '500', 10),
      times_used: 0,
      expiry_date: expiry_date || '2026-12-31',
      active: 1,
      created_at: new Date().toISOString(),
    };
    memoryStore.coupons.unshift(newCoupon);

    return res.status(201).json({ success: true, message: 'Coupon created successfully!', coupon: newCoupon });
  } catch (error: any) {
    console.error('[Create Coupon Error]', error);
    return res.status(500).json({ success: false, message: `Failed to create coupon: ${error.message || 'Error'}` });
  }
}

export async function deleteAdminCoupon(req: Request, res: Response) {
  try {
    const couponId = parseInt(req.params.id, 10);
    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        await pool.query('DELETE FROM coupons WHERE id = ?', [couponId]);
        return res.json({ success: true, message: 'Coupon deleted.' });
      }
    }
    const idx = memoryStore.coupons.findIndex(c => c.id === couponId);
    if (idx >= 0) memoryStore.coupons.splice(idx, 1);
    return res.json({ success: true, message: 'Coupon deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete coupon' });
  }
}

// 7. CONTACT MESSAGES & REFUNDS
export async function getAdminContacts(req: Request, res: Response) {
  try {
    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        const [rows]: any = await pool.query('SELECT * FROM contacts ORDER BY created_at DESC');
        return res.json({ success: true, contacts: rows });
      }
    }
    return res.json({ success: true, contacts: memoryStore.contacts });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch contacts' });
  }
}

export async function replyContact(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    const { reply } = req.body;

    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        await pool.query('UPDATE contacts SET reply = ?, is_read = 1, replied_at = NOW() WHERE id = ?', [reply, id]);
        return res.json({ success: true, message: 'Reply recorded and email dispatch simulated.' });
      }
    }

    const contact = memoryStore.contacts.find(c => c.id === id);
    if (contact) {
      contact.reply = reply;
      contact.is_read = 1;
      contact.replied_at = new Date().toISOString();
    }

    return res.json({ success: true, message: 'Reply recorded and email dispatched.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to record reply' });
  }
}

export async function getAdminRefunds(req: Request, res: Response) {
  try {
    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        const [rows]: any = await pool.query(
          `SELECT rr.*, COALESCE(u.name, 'Student') as user_name, COALESCE(u.email, '') as user_email, COALESCE(o.order_number, 'ORD-N/A') as order_number, COALESCE(n.title, 'Study Note') as note_title, COALESCE(o.total_amount, 0) as total_amount
           FROM refund_requests rr
           LEFT JOIN users u ON rr.user_id = u.id
           LEFT JOIN orders o ON rr.order_id = o.id
           LEFT JOIN notes n ON rr.note_id = n.id
           ORDER BY rr.created_at DESC`
        );
        return res.json({ success: true, refunds: rows });
      }
    }

    const refunds = memoryStore.refund_requests.map(r => {
      const user = memoryStore.users.find(u => u.id === r.user_id);
      const order = memoryStore.orders.find(o => o.id === r.order_id);
      const note = memoryStore.notes.find(n => n.id === r.note_id);
      return {
        ...r,
        user_name: user?.name || 'Student',
        user_email: user?.email || '',
        order_number: order?.order_number || 'ORD-1001',
        note_title: note?.title || 'Study Note',
        total_amount: order?.total_amount || 0,
      };
    });

    return res.json({ success: true, refunds });
  } catch (error: any) {
    console.error('[Get Admin Refunds Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch refunds' });
  }
}

export async function handleRefundDecision(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, admin_note } = req.body;

    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        await pool.query('UPDATE refund_requests SET status = ?, admin_note = ?, updated_at = NOW() WHERE id = ?', [
          status,
          admin_note,
          id,
        ]);
        if (status === 'approved') {
          const [rf]: any = await pool.query('SELECT order_id FROM refund_requests WHERE id = ?', [id]);
          if (rf.length > 0) {
            await pool.query('UPDATE orders SET payment_status = "refunded" WHERE id = ?', [rf[0].order_id]);
          }
        }
        return res.json({ success: true, message: `Refund request ${status}.` });
      }
    }

    const refund = memoryStore.refund_requests.find(r => r.id === id);
    if (refund) {
      refund.status = status;
      refund.admin_note = admin_note;
      if (status === 'approved') {
        const ord = memoryStore.orders.find(o => o.id === refund.order_id);
        if (ord) ord.payment_status = 'refunded';
      }
    }

    return res.json({ success: true, message: `Refund request ${status}.` });
  } catch (error: any) {
    console.error('[Refund Decision Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to process refund' });
  }
}

// 8. SITE SETTINGS
export async function getSettings(req: Request, res: Response) {
  try {
    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        const [rows]: any = await pool.query('SELECT * FROM site_settings');
        const settings: any = {};
        rows.forEach((r: any) => { settings[r.key_name] = r.key_value; });
        return res.json({ success: true, settings });
      }
    }
    return res.json({ success: true, settings: memoryStore.site_settings });
  } catch (error: any) {
    console.error('[Get Settings Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
}

export async function updateSettings(req: Request, res: Response) {
  try {
    const { settings } = req.body;

    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool && settings) {
        for (const [key, value] of Object.entries(settings)) {
          await pool.query(
            'INSERT INTO site_settings (key_name, key_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE key_value = ?',
            [key, String(value), String(value)]
          );
        }
      }
    }
    
    if (settings) {
      Object.assign(memoryStore.site_settings, settings);
    }

    return res.json({ success: true, message: 'Site configuration updated successfully.' });
  } catch (error: any) {
    console.error('[Update Settings Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
}
