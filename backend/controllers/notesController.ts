import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { memoryStore, getPool, isMySQLConnected } from '../config/db';
import { AuthRequest } from '../middleware/auth';

export async function getNotes(req: AuthRequest, res: Response) {
  try {
    const {
      search,
      subject,
      chapter,
      category,
      category_id,
      is_free,
      is_featured,
      is_bestseller,
      minPrice,
      maxPrice,
      sort = 'newest',
      page = '1',
      limit = '12',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 12));
    const offset = (pageNum - 1) * limitNum;

    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        let whereClauses = ['n.status = "published"'];
        const params: any[] = [];

        if (search) {
          whereClauses.push('(n.title LIKE ? OR n.description LIKE ? OR n.chapter LIKE ? OR n.subject LIKE ?)');
          const term = `%${search}%`;
          params.push(term, term, term, term);
        }

        if (subject && subject !== 'All') {
          whereClauses.push('n.subject = ?');
          params.push(subject);
        }

        if (chapter) {
          whereClauses.push('n.chapter LIKE ?');
          params.push(`%${chapter}%`);
        }

        if (category_id) {
          whereClauses.push('n.category_id = ?');
          params.push(category_id);
        } else if (category && category !== 'all') {
          whereClauses.push('c.slug = ?');
          params.push(category);
        }

        if (is_free !== undefined && is_free !== '') {
          whereClauses.push('n.is_free = ?');
          params.push(is_free === 'true' || is_free === '1' ? 1 : 0);
        }

        if (is_featured === 'true' || is_featured === '1') {
          whereClauses.push('n.is_featured = 1');
        }

        if (is_bestseller === 'true' || is_bestseller === '1') {
          whereClauses.push('n.is_bestseller = 1');
        }

        if (minPrice) {
          whereClauses.push('n.price >= ?');
          params.push(parseFloat(minPrice as string));
        }

        if (maxPrice) {
          whereClauses.push('n.price <= ?');
          params.push(parseFloat(maxPrice as string));
        }

        let orderBy = 'n.created_at DESC';
        if (sort === 'popular') orderBy = 'n.purchase_count DESC, n.rating_avg DESC';
        else if (sort === 'price_asc') orderBy = 'n.price ASC';
        else if (sort === 'price_desc') orderBy = 'n.price DESC';
        else if (sort === 'rating') orderBy = 'n.rating_avg DESC';

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Count query
        const [countRows]: any = await pool.query(
          `SELECT COUNT(*) as total FROM notes n LEFT JOIN categories c ON n.category_id = c.id ${whereSql}`,
          params
        );
        const total = countRows[0]?.total || 0;

        // Data query
        const dataSql = `
          SELECT n.*, c.name as category_name, c.slug as category_slug 
          FROM notes n 
          LEFT JOIN categories c ON n.category_id = c.id 
          ${whereSql} 
          ORDER BY ${orderBy} 
          LIMIT ? OFFSET ?
        `;
        const [rows]: any = await pool.query(dataSql, [...params, limitNum, offset]);

        return res.json({
          success: true,
          notes: rows,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
          },
        });
      }
    }

    // In-memory Store Filtering
    let results = memoryStore.notes.filter(n => n.status === 'published');

    if (search) {
      const q = String(search).toLowerCase();
      results = results.filter(
        n =>
          n.title.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q) ||
          n.chapter.toLowerCase().includes(q) ||
          n.subject.toLowerCase().includes(q)
      );
    }

    if (subject && subject !== 'All') {
      results = results.filter(n => n.subject.toLowerCase() === String(subject).toLowerCase());
    }

    if (chapter) {
      results = results.filter(n => n.chapter.toLowerCase().includes(String(chapter).toLowerCase()));
    }

    if (category_id) {
      results = results.filter(n => n.category_id === parseInt(category_id as string, 10));
    } else if (category && category !== 'all') {
      const cat = memoryStore.categories.find(c => c.slug === category);
      if (cat) {
        results = results.filter(n => n.category_id === cat.id);
      }
    }

    if (is_free !== undefined && is_free !== '') {
      const freeBool = is_free === 'true' || is_free === '1' ? 1 : 0;
      results = results.filter(n => n.is_free === freeBool);
    }

    if (is_featured === 'true' || is_featured === '1') {
      results = results.filter(n => n.is_featured === 1);
    }

    if (is_bestseller === 'true' || is_bestseller === '1') {
      results = results.filter(n => n.is_bestseller === 1);
    }

    if (minPrice) {
      results = results.filter(n => n.price >= parseFloat(minPrice as string));
    }

    if (maxPrice) {
      results = results.filter(n => n.price <= parseFloat(maxPrice as string));
    }

    // Sorting
    if (sort === 'popular') {
      results.sort((a, b) => b.purchase_count - a.purchase_count || b.rating_avg - a.rating_avg);
    } else if (sort === 'price_asc') {
      results.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      results.sort((a, b) => b.price - a.price);
    } else if (sort === 'rating') {
      results.sort((a, b) => b.rating_avg - a.rating_avg);
    } else {
      // Newest
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    const total = results.length;
    const paginated = results.slice(offset, offset + limitNum).map(n => {
      const cat = memoryStore.categories.find(c => c.id === n.category_id);
      return {
        ...n,
        category_name: cat ? cat.name : null,
        category_slug: cat ? cat.slug : null,
      };
    });

    return res.json({
      success: true,
      notes: paginated,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('[Get Notes Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch notes.' });
  }
}

export async function getNoteById(req: AuthRequest, res: Response) {
  try {
    const idParam = req.params.id;
    const isNumeric = /^\d+$/.test(idParam);

    let note: any = null;

    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        const queryStr = isNumeric
          ? 'SELECT n.*, c.name as category_name, c.slug as category_slug FROM notes n LEFT JOIN categories c ON n.category_id = c.id WHERE n.id = ?'
          : 'SELECT n.*, c.name as category_name, c.slug as category_slug FROM notes n LEFT JOIN categories c ON n.category_id = c.id WHERE n.slug = ?';
        const [rows]: any = await pool.query(queryStr, [idParam]);
        if (rows.length > 0) note = rows[0];
      }
    } else {
      note = isNumeric
        ? memoryStore.notes.find(n => n.id === parseInt(idParam, 10))
        : memoryStore.notes.find(n => n.slug === idParam);
      if (note) {
        const cat = memoryStore.categories.find(c => c.id === note.category_id);
        note = { ...note, category_name: cat?.name, category_slug: cat?.slug };
      }
    }

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    // Check if user has purchased this note or if it's free
    let isPurchased = false;
    let inWishlist = false;

    if (req.user) {
      if (isMySQLConnected()) {
        const pool = getPool();
        if (pool) {
          const [orderRows]: any = await pool.query(
            'SELECT oi.id FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.user_id = ? AND oi.note_id = ? AND o.payment_status = "paid"',
            [req.user.id, note.id]
          );
          isPurchased = orderRows.length > 0;

          const [wRows]: any = await pool.query(
            'SELECT id FROM wishlist WHERE user_id = ? AND note_id = ?',
            [req.user.id, note.id]
          );
          inWishlist = wRows.length > 0;
        }
      } else {
        const paidOrders = memoryStore.orders.filter(o => o.user_id === req.user?.id && o.payment_status === 'paid');
        const paidOrderIds = paidOrders.map(o => o.id);
        isPurchased = memoryStore.order_items.some(oi => paidOrderIds.includes(oi.order_id) && oi.note_id === note.id);
        inWishlist = memoryStore.wishlist.some(w => w.user_id === req.user?.id && w.note_id === note.id);
      }
    }

    // Fetch related notes
    let relatedNotes: any[] = [];
    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        const [related]: any = await pool.query(
          'SELECT id, title, slug, subject, chapter, price, original_price, thumbnail, rating_avg, rating_count, is_free FROM notes WHERE subject = ? AND id != ? AND status = "published" LIMIT 4',
          [note.subject, note.id]
        );
        relatedNotes = related;
      }
    } else {
      relatedNotes = memoryStore.notes
        .filter(n => n.subject === note.subject && n.id !== note.id && n.status === 'published')
        .slice(0, 4);
    }

    // Fetch approved reviews for this note
    let reviews: any[] = [];
    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        const [revRows]: any = await pool.query(
          'SELECT r.*, u.name as user_name, u.avatar as user_avatar FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.note_id = ? AND r.status = "approved" ORDER BY r.created_at DESC',
          [note.id]
        );
        reviews = revRows;
      }
    } else {
      reviews = memoryStore.reviews
        .filter(r => r.note_id === note.id && r.status === 'approved')
        .map(r => {
          const user = memoryStore.users.find(u => u.id === r.user_id);
          return {
            ...r,
            user_name: user ? user.name : 'Student',
            user_avatar: user ? user.avatar : null,
          };
        });
    }

    return res.json({
      success: true,
      note,
      isPurchased: isPurchased || Boolean(note.is_free),
      inWishlist,
      reviews,
      relatedNotes,
    });
  } catch (error: any) {
    console.error('[Get Note Detail Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch note details.' });
  }
}

// SECURE DOWNLOAD HANDLER
export async function downloadNote(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'You must be logged in to download study notes.',
      });
    }

    const noteId = parseInt(req.params.id, 10);
    if (!noteId) {
      return res.status(400).json({ success: false, message: 'Invalid note ID.' });
    }

    let note: any = null;

    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        const [nRows]: any = await pool.query('SELECT * FROM notes WHERE id = ?', [noteId]);
        if (nRows.length > 0) note = nRows[0];
      }
    } else {
      note = memoryStore.notes.find(n => n.id === noteId);
    }

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    // Free Note access
    const isFree = Boolean(note.is_free);

    // If note is paid, verify ownership in database
    let isAuthorized = isFree || req.user.role === 'admin';
    let orderId: number | null = null;

    if (!isAuthorized) {
      if (isMySQLConnected()) {
        const pool = getPool();
        if (pool) {
          const [oRows]: any = await pool.query(
            'SELECT o.id FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.user_id = ? AND oi.note_id = ? AND o.payment_status = "paid"',
            [req.user.id, noteId]
          );
          if (oRows.length > 0) {
            isAuthorized = true;
            orderId = oRows[0].id;
          }
        }
      } else {
        const paidOrders = memoryStore.orders.filter(o => o.user_id === req.user?.id && o.payment_status === 'paid');
        const paidOrderIds = paidOrders.map(o => o.id);
        const item = memoryStore.order_items.find(oi => paidOrderIds.includes(oi.order_id) && oi.note_id === noteId);
        if (item) {
          isAuthorized = true;
          orderId = item.order_id;
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: You have not purchased this premium note yet. Please complete checkout to unlock your download.',
      });
    }

    // Log the download for telemetry & security
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        await pool.query(
          'INSERT INTO downloads (user_id, note_id, order_id, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
          [req.user.id, noteId, orderId, ip, userAgent]
        );
        await pool.query('UPDATE notes SET download_count = download_count + 1 WHERE id = ?', [noteId]);
      }
    } else {
      memoryStore.downloads.push({
        id: memoryStore.nextIds.downloads++,
        user_id: req.user.id,
        note_id: noteId,
        order_id: orderId,
        ip_address: ip,
        user_agent: userAgent,
        downloaded_at: new Date().toISOString(),
      });
      note.download_count = (note.download_count || 0) + 1;
    }

    // File serving: Check if actual physical file exists, or generate high-yield study PDF packet
    const filePath = path.join(process.cwd(), 'backend', 'uploads', 'pdfs', note.pdf_file || '');

    if (note.pdf_file && fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${note.slug || 'neet-notes'}.pdf"`);
      const fileStream = fs.createReadStream(filePath);
      return fileStream.pipe(res);
    }

    // If running in development without binary PDF uploads yet, generate high-yield printable study packet
    const studyDocument = generateSyntheticStudyPDF(note, req.user);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="${note.slug || 'neet-notes'}.html"`);
    return res.send(studyDocument);
  } catch (error: any) {
    console.error('[Download Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to process secure download.' });
  }
}

// Preview viewer
export async function getPreview(req: Request, res: Response) {
  try {
    const noteId = parseInt(req.params.id, 10);
    let note: any = null;

    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        const [rows]: any = await pool.query('SELECT * FROM notes WHERE id = ?', [noteId]);
        if (rows.length > 0) note = rows[0];
      }
    } else {
      note = memoryStore.notes.find(n => n.id === noteId);
    }

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    return res.json({
      success: true,
      noteId: note.id,
      title: note.title,
      subject: note.subject,
      chapter: note.chapter,
      previewPages: note.preview_pages || 4,
      totalPages: note.total_pages || 45,
      previewSamples: [
        {
          pageNumber: 1,
          title: `Chapter Overview: ${note.chapter}`,
          contentSnippet: `High-Yield NCERT Summary Points for NEET: Key definitions, formula breakdown, and high-frequency previous 15-year question trends.`,
        },
        {
          pageNumber: 2,
          title: `Essential Formulae & Memory Tricks`,
          contentSnippet: `Arrow-pushing flowcharts, standard mnemonic shortcuts, sign conventions, and unit conversion cheat sheets.`,
        },
        {
          pageNumber: 3,
          title: `Solved Illustrative Exemplar Problems`,
          contentSnippet: `Step-by-step solutions for tricky multi-statement and assertion-reason type questions with NCERT page references.`,
        },
      ],
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to generate preview.' });
  }
}

// Toggle Wishlist
export async function toggleWishlist(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Please log in to manage your wishlist.' });
    }

    const { note_id } = req.body;
    if (!note_id) {
      return res.status(400).json({ success: false, message: 'Note ID is required.' });
    }

    let isSaved = false;

    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        const [existing]: any = await pool.query('SELECT id FROM wishlist WHERE user_id = ? AND note_id = ?', [
          req.user.id,
          note_id,
        ]);
        if (existing.length > 0) {
          await pool.query('DELETE FROM wishlist WHERE id = ?', [existing[0].id]);
          isSaved = false;
        } else {
          await pool.query('INSERT INTO wishlist (user_id, note_id) VALUES (?, ?)', [req.user.id, note_id]);
          isSaved = true;
        }
      }
    } else {
      const idx = memoryStore.wishlist.findIndex(w => w.user_id === req.user?.id && w.note_id === note_id);
      if (idx >= 0) {
        memoryStore.wishlist.splice(idx, 1);
        isSaved = false;
      } else {
        memoryStore.wishlist.push({
          id: memoryStore.nextIds.wishlist++,
          user_id: req.user.id,
          note_id,
          created_at: new Date().toISOString(),
        });
        isSaved = true;
      }
    }

    return res.json({
      success: true,
      isSaved,
      message: isSaved ? 'Added to your wishlist!' : 'Removed from wishlist.',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update wishlist.' });
  }
}

// Student Library
export async function getStudentLibrary(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    let libraryNotes: any[] = [];

    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        const [rows]: any = await pool.query(
          `SELECT DISTINCT n.*, o.order_number, o.created_at as purchased_at, c.name as category_name
           FROM order_items oi
           JOIN orders o ON oi.order_id = o.id
           JOIN notes n ON oi.note_id = n.id
           LEFT JOIN categories c ON n.category_id = c.id
           WHERE o.user_id = ? AND o.payment_status = "paid"
           ORDER BY o.created_at DESC`,
          [req.user.id]
        );
        libraryNotes = rows;
      }
    } else {
      const paidOrders = memoryStore.orders.filter(o => o.user_id === req.user?.id && o.payment_status === 'paid');
      const paidOrderIds = paidOrders.map(o => o.id);
      const items = memoryStore.order_items.filter(oi => paidOrderIds.includes(oi.order_id));
      const seenNoteIds = new Set<number>();

      items.forEach(item => {
        if (!seenNoteIds.has(item.note_id)) {
          seenNoteIds.add(item.note_id);
          const note = memoryStore.notes.find(n => n.id === item.note_id);
          const order = memoryStore.orders.find(o => o.id === item.order_id);
          if (note) {
            const cat = memoryStore.categories.find(c => c.id === note.category_id);
            libraryNotes.push({
              ...note,
              order_number: order?.order_number,
              purchased_at: order?.created_at,
              category_name: cat?.name,
            });
          }
        }
      });
    }

    return res.json({
      success: true,
      library: libraryNotes,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch library notes.' });
  }
}

// Categories list
export async function getCategories(req: Request, res: Response) {
  try {
    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        const [rows]: any = await pool.query(
          'SELECT c.*, COUNT(n.id) as notes_count FROM categories c LEFT JOIN notes n ON c.id = n.category_id AND n.status = "published" GROUP BY c.id ORDER BY c.display_order ASC'
        );
        return res.json({ success: true, categories: rows });
      }
    }

    const categoriesWithCount = memoryStore.categories.map(c => {
      const count = memoryStore.notes.filter(n => n.category_id === c.id && n.status === 'published').length;
      return { ...c, notes_count: count };
    });

    return res.json({ success: true, categories: categoriesWithCount });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
}

function generateSyntheticStudyPDF(note: any, user: any): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${note.title} - NEET Notes Marketplace</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 40px 20px; }
    .container { max-width: 800px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { border-bottom: 2px solid #059669; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
    .badge { background: #d1fae5; color: #065f46; font-weight: bold; padding: 4px 12px; border-radius: 9999px; font-size: 13px; }
    h1 { color: #0f172a; font-size: 26px; margin: 0 0 10px 0; }
    .meta { font-size: 14px; color: #64748b; margin-bottom: 25px; }
    .content-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 18px; border-radius: 6px; margin-bottom: 24px; }
    .section-title { font-size: 18px; font-weight: 700; color: #047857; margin: 24px 0 10px 0; }
    ul { line-height: 1.8; color: #334155; }
    .watermark { margin-top: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1; font-size: 12px; color: #94a3b8; text-align: center; }
    .print-btn { background: #059669; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <span class="badge">Verified NEET Study Packet</span>
        <h1>${note.title}</h1>
        <div class="meta">Subject: <strong>${note.subject}</strong> | Chapter: <strong>${note.chapter}</strong> | Pages: ${note.total_pages || 40}</div>
      </div>
      <button class="print-btn" onclick="window.print()">Print / Save PDF</button>
    </div>

    <div class="content-box">
      <strong>License & Verification:</strong> Licensed exclusively to <strong>${user.name} (${user.email})</strong>. Authorized for individual NEET entrance exam preparation.
    </div>

    <div class="section-title">1. High-Yield Chapter Highlights</div>
    <p>${note.description}</p>

    <div class="section-title">2. NCERT Line-by-Line Key Extracts</div>
    <ul>
      <li>High-probability assertion & reason connections extracted directly from latest NTA syllabus.</li>
      <li>Comprehensive formula derivations, reaction mechanisms, and anatomical flowchart summaries.</li>
      <li>Previous 15-year NEET/AIPMT exam trends tagged with exact repetition patterns.</li>
    </ul>

    <div class="section-title">3. Fast Revision Checklist</div>
    <ul>
      <li>Review the core definitions and exception tables at least 3 times before mock exams.</li>
      <li>Solve all accompanying PYQs within timed 45-minute blocks.</li>
    </ul>

    <div class="watermark">
      Generated by NEET Notes Marketplace &copy; 2026. All rights reserved. User ID: ${user.id} | Timestamp: ${new Date().toLocaleString()}
    </div>
  </div>
</body>
</html>`;
}
