import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { memoryStore, getPool, isMySQLConnected } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { getOrRenderPdfPages } from '../utils/pdfRenderer';

export const CELL_UNIT_OF_LIFE_PAGES = [
  {
    pageNumber: 1,
    sectionTitle: 'Chapter 8: Cell - The Unit of Life (Introduction, What is a Cell?, Cell Theory)',
    badge: 'Introduction & History',
    paragraphs: [
      'What makes an organism living? The answer to this is the presence of the basic unit of life - the cell - in all living organisms. All organisms are composed of cells.',
      'Anton Von Leeuwenhoek first saw and described a live cell.',
      'In 1838, Matthias Schleiden, a German botanist, examined a large number of plants and observed that all plants are composed of different kinds of cells which form the tissues of the plant.',
    ],
    bulletPoints: [
      'Cell is the fundamental structural and functional unit of all living organisms.',
      'Anything less than a complete structure of a cell does not ensure independent living.',
      'Anton Von Leeuwenhoek first saw and described a live cell.',
      'Matthias Schleiden (1838) observed plant tissues are composed of cells.',
    ],
  },
  {
    pageNumber: 2,
    sectionTitle: '4. An Overview of Cell (Cell Theory & Dimensions)',
    badge: 'Cell Overview',
    paragraphs: [
      'Theodore Schwann (1839), British Zoologist, reported that animal cells had a thin outer plasma membrane and plant cells possess cell walls.',
      'Rudolf Virchow (1855) modified cell theory: Omnis cellula-e cellula (All cells arise from pre-existing cells).',
      'The cytoplasm is the main arena of cellular activities in both plant and animal cells.',
    ],
    bulletPoints: [
      'Cell Theory: (i) All living organisms are composed of cells and products of cells; (ii) All cells arise from pre-existing cells.',
      'Mycoplasma is the smallest cell (~0.3 µm); Ostrich egg is the largest isolated single cell; Nerve cells are among the longest.',
      'Ribosomes are non-membrane bound organelles found in cytoplasm, chloroplast, mitochondria, and rough ER.',
      'Animal cells contain centrosome which helps in cell division.',
    ],
  },
  {
    pageNumber: 3,
    sectionTitle: '5. Prokaryotic Cells & Cell Envelope Modifications',
    badge: 'Prokaryotic Structure',
    paragraphs: [
      'Prokaryotic cells lack membrane bound nuclei and organelles. Represented by bacteria, blue-green algae, Mycoplasma, or PPLO.',
      'In addition to genomic DNA, bacteria have small circular DNA called plasmids conferring unique characters like antibiotic resistance.',
      'Most prokaryotes have a tightly bound three-layered cell envelope: outermost glycocalyx, middle cell wall, inner plasma membrane.',
    ],
    bulletPoints: [
      'All prokaryotes have cell wall surrounding cell membrane (except Mycoplasma).',
      'Glycocalyx: loose sheath (slime layer) or thick and tough (capsule).',
      'The cell wall prevents bacteria from bursting or collapsing.',
      'Plasmids are used to monitor bacterial transformation with foreign DNA.',
    ],
  },
  {
    pageNumber: 4,
    sectionTitle: 'Ribosomes & Inclusion Bodies in Prokaryotes',
    badge: 'Prokaryotic Organelles',
    paragraphs: [
      'Mesosomes are plasma membrane infoldings (vesicles, tubules, lamellae) aiding cell wall formation, DNA replication, respiration, and secretion.',
      'In cyanobacteria, chromatophores contain photosynthetic pigments.',
      'Ribosomes are 70S (50S and 30S subunits). Several ribosomes attach to single mRNA forming polyribosome/polysome to translate mRNA into proteins.',
    ],
    bulletPoints: [
      'Bacteria can be Gram positive or Gram negative based on cell envelope differences.',
      'Motility flagella consist of three parts: filament, hook, and basal body. Pili and fimbriae do not play role in motility.',
      'Inclusion bodies: reserve material stored in prokaryotic cytoplasm (phosphate granules, cyanophycean granules, glycogen granules).',
    ],
  },
  {
    pageNumber: 5,
    sectionTitle: '6. Eukaryotic Cells & Fluid Mosaic Cell Membrane',
    badge: 'Eukaryotic Membrane',
    paragraphs: [
      'Eukaryotes include protists, plants, animals, and fungi, featuring compartmentalization via membrane-bound organelles.',
      'Plant cells have large vacuoles and cell walls; animal cells have centrioles which are absent in higher plants.',
      'Singer and Nicolson (1972) proposed the widely accepted Fluid Mosaic Model for the structure of cell membrane.',
    ],
    bulletPoints: [
      'Eukaryotic cytoplasmic ribosomes are 80S (small 40S + large 60S).',
      'Human RBC membrane composition: 52% proteins, 40% lipids.',
      'Phospholipids consist of polar head (outward) and non-polar tail (hydrophobic) on inner side.',
      'Membrane proteins can be integral or peripheral.',
    ],
  },
  {
    pageNumber: 6,
    sectionTitle: '7. Cell Wall & Membrane Transport Mechanisms',
    badge: 'Cell Wall & Transport',
    paragraphs: [
      'Plasma membrane is selectively permeable. Passive transport requires no energy; movement of water by diffusion is osmosis.',
      'Active transport requires ATP energy (e.g., Na+/K+ pump) against concentration gradient.',
      'Non-living rigid cell wall forms outer covering of plasma membrane in plants and fungi.',
    ],
    bulletPoints: [
      'The middle lamella is a layer mainly of calcium pectate gluing neighboring cells.',
      'Primary cell wall of young plant cells is capable of growth; diminishes as secondary wall forms on inner side.',
      'Algal cell wall: cellulose, galactans, mannans, and calcium carbonate.',
      'Higher plant cell wall: cellulose, hemicellulose, pectin, and proteins.',
    ],
  },
  {
    pageNumber: 7,
    sectionTitle: '8. Endomembrane System (ER, Golgi & Lysosomes)',
    badge: 'Endomembrane System',
    paragraphs: [
      'Endomembrane system includes membranous organelles whose functions are coordinated: ER, Golgi complex, lysosomes, and vacuoles.',
      'Endoplasmic Reticulum (ER): Rough ER (RER, bearing ribosomes) for protein synthesis; Smooth ER (SER) for lipid/steroid synthesis.',
      'Golgi apparatus (Camillo Golgi): Concentrically arranged cisternae with convex cis (forming) and concave trans (maturing) faces.',
    ],
    bulletPoints: [
      'Golgi apparatus functions: Packaging of materials, formation of glycoproteins and glycolipids.',
      'Lysosomes: Membrane-bound vesicular structures rich in hydrolytic enzymes (lipases, proteases, carbohydrases) active at acidic pH.',
    ],
  },
  {
    pageNumber: 8,
    sectionTitle: 'Vacuoles & 9. Mitochondria (Powerhouse of the Cell)',
    badge: 'Vacuoles & Mitochondria',
    paragraphs: [
      'Vacuole is bound by tonoplast membrane. In Amoeba, contractile vacuole is important for excretion/osmoregulation.',
      'Mitochondria are double membrane-bound sites of aerobic cellular respiration generating ATP ("power house of the cell").',
      'Outer membrane forms continuous boundary; inner membrane forms folds called cristae to increase surface area.',
    ],
    bulletPoints: [
      'Mitochondrial matrix contains single circular dsDNA, RNA molecules, 70S ribosomes, and divides by fission.',
      'Svedberg unit (S) stands for sedimentation coefficient (indirect measure of density and size).',
    ],
  },
  {
    pageNumber: 9,
    sectionTitle: '10. Plastids (Chloroplasts) & 11. Cytoskeleton',
    badge: 'Plastids & Cytoskeleton',
    paragraphs: [
      'Plastids found in plant cells and euglenoids: Chloroplasts (green chlorophyll/carotenoids), Chromoplasts (carotenoid pigments), Leucoplasts (colourless storage).',
      'Leucoplasts: Amyloplasts (starch), Elaioplasts (fats/oils), Aleuroplasts (proteins).',
      'Chloroplast: double-membrane, stroma matrix, thylakoid stacks (grana) linked by stroma lamellae.',
    ],
    bulletPoints: [
      'Stroma contains circular DNA, 70S ribosomes, and enzymes for carbohydrate and protein synthesis.',
      'Cytoskeleton: Elaborate network of filamentous proteinaceous structures providing mechanical support, motility, and cell shape.',
    ],
  },
  {
    pageNumber: 10,
    sectionTitle: '12. Cilia & Flagella (9+2 Array) & 13. Centrosome',
    badge: 'Cilia, Flagella & Centrioles',
    paragraphs: [
      'Cilia and flagella are hair-like outgrowths of cell membrane. Central core (axoneme) features 9 doublet microtubules peripherally and 1 pair centrally (9 + 2 array).',
      'Cilia and flagella arise from centriole-like basal bodies covered with plasma membrane.',
      'Centrosome contains two cylindrical centrioles perpendicular to each other surrounded by amorphous pericentriolar material.',
    ],
    bulletPoints: [
      'Centriole has cartwheel hub with 9 peripheral triplets connected by protein radial spokes.',
      'Centrioles form basal bodies of cilia/flagella and spindle apparatus during cell division.',
    ],
  },
  {
    pageNumber: 11,
    sectionTitle: '14. Nucleus (Chromatin, Nucleolus & Chromosomes)',
    badge: 'Nucleus & Chromosomes',
    paragraphs: [
      'Nucleus first described by Robert Brown (1831); chromatin named by Flemming. Double membrane separated by perinuclear space.',
      'Nuclear matrix (nucleoplasm) contains nucleolus (active site for rRNA synthesis) and chromatin (DNA, histones, non-histones, RNA).',
      'Chromosomes classified by centromere position: Metacentric (middle), Sub-metacentric (slightly away from middle), Acrocentric (close to end), Telocentric (terminal).',
    ],
    bulletPoints: [
      'Kinetochores: Disc-shaped structures present on sides of primary constriction (centromere).',
      'Secondary constrictions give appearance of a small fragment called satellite chromosome.',
    ],
  },
  {
    pageNumber: 12,
    sectionTitle: '15. Microbodies & Summary Revision',
    badge: 'Microbodies & Wrap-up',
    paragraphs: [
      'Nucleolus is not membrane-bound; highly active in cells carrying out rapid protein synthesis.',
      'Microbodies: Membrane-bound minute vesicles containing various enzymes, present in both plant and animal cells.',
      'Summary: Cell is the structural and functional unit of life; master the organelle differences for NEET.',
    ],
    bulletPoints: [
      'Prokaryotes vs Eukaryotes: 70S vs 80S ribosomes, lack of nuclear membrane vs organized nucleus.',
      'Semi-autonomous organelles: Mitochondria and chloroplasts contain circular DNA and 70S ribosomes.',
    ],
  },
];

export async function getNotes(req: AuthRequest, res: Response) {
  try {
    const {
      search,
      subject,
      class_level,
      exam,
      resource_type,
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
          whereClauses.push('(n.title LIKE ? OR n.description LIKE ? OR n.chapter LIKE ? OR n.subject LIKE ? OR n.class_level LIKE ? OR n.exam LIKE ?)');
          const term = `%${search}%`;
          params.push(term, term, term, term, term, term);
        }

        if (subject && subject !== 'All') {
          whereClauses.push('n.subject = ?');
          params.push(subject);
        }

        if (class_level && class_level !== 'All') {
          whereClauses.push('n.class_level = ?');
          params.push(class_level);
        }

        if (exam && exam !== 'All') {
          whereClauses.push('n.exam = ?');
          params.push(exam);
        }

        if (resource_type && resource_type !== 'All') {
          whereClauses.push('n.resource_type = ?');
          params.push(resource_type);
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
          n.subject.toLowerCase().includes(q) ||
          (n.class_level && n.class_level.toLowerCase().includes(q)) ||
          (n.exam && n.exam.toLowerCase().includes(q)) ||
          (n.resource_type && n.resource_type.toLowerCase().includes(q))
      );
    }

    if (subject && subject !== 'All') {
      results = results.filter(n => n.subject.toLowerCase() === String(subject).toLowerCase());
    }

    if (class_level && class_level !== 'All') {
      results = results.filter(n => (n.class_level || 'NEET').toLowerCase() === String(class_level).toLowerCase());
    }

    if (exam && exam !== 'All') {
      results = results.filter(n => (n.exam || 'NEET').toLowerCase() === String(exam).toLowerCase());
    }

    if (resource_type && resource_type !== 'All') {
      results = results.filter(n => (n.resource_type || 'Notes').toLowerCase() === String(resource_type).toLowerCase());
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

    let renderedInfo = null;
    if (note.pdf_file) {
      renderedInfo = await getOrRenderPdfPages(note.pdf_file);
    }

    const totalPages = renderedInfo?.totalPages || note.total_pages || 12;
    const previewPagesCount = Math.min(note.preview_pages || 4, totalPages);

    const isCellChapter =
      (note.chapter || '').toLowerCase().includes('cell') ||
      (note.title || '').toLowerCase().includes('cell');

    let previewSamples: any[] = [];
    if (renderedInfo && renderedInfo.pages.length > 0) {
      previewSamples = renderedInfo.pages.slice(0, previewPagesCount).map((p, idx) => {
        const meta = (isCellChapter && CELL_UNIT_OF_LIFE_PAGES[idx]) ? CELL_UNIT_OF_LIFE_PAGES[idx] : null;
        return {
          pageNumber: p.pageNumber,
          imageUrl: p.imageUrl,
          title: meta ? meta.sectionTitle : `Preview Page ${p.pageNumber}: ${note.chapter || note.title}`,
          contentSnippet: meta ? meta.paragraphs[0] : `High-Yield NCERT Summary Points for NEET: Key definitions, formula breakdown, and high-frequency question trends.`,
        };
      });
    } else {
      previewSamples = [
        {
          pageNumber: 1,
          title: isCellChapter ? CELL_UNIT_OF_LIFE_PAGES[0].sectionTitle : `Chapter Overview: ${note.chapter}`,
          contentSnippet: isCellChapter ? CELL_UNIT_OF_LIFE_PAGES[0].paragraphs[0] : `High-Yield NCERT Summary Points for NEET: Key definitions, formula breakdown, and high-frequency previous 15-year question trends.`,
        },
        {
          pageNumber: 2,
          title: isCellChapter ? CELL_UNIT_OF_LIFE_PAGES[1].sectionTitle : `Essential Formulae & Memory Tricks`,
          contentSnippet: isCellChapter ? CELL_UNIT_OF_LIFE_PAGES[1].paragraphs[0] : `Arrow-pushing flowcharts, standard mnemonic shortcuts, sign conventions, and unit conversion cheat sheets.`,
        },
        {
          pageNumber: 3,
          title: isCellChapter ? CELL_UNIT_OF_LIFE_PAGES[2].sectionTitle : `Solved Illustrative Exemplar Problems`,
          contentSnippet: isCellChapter ? CELL_UNIT_OF_LIFE_PAGES[2].paragraphs[0] : `Step-by-step solutions for tricky multi-statement and assertion-reason type questions with NCERT page references.`,
        },
      ];
    }

    return res.json({
      success: true,
      noteId: note.id,
      title: note.title,
      subject: note.subject,
      chapter: note.chapter,
      previewPages: previewPagesCount,
      totalPages: totalPages,
      previewSamples,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to generate preview.' });
  }
}

// Full Secure In-App Reader Content (Protected with User Watermark & Ownership Verification)
export async function getReaderContent(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'You must be logged in to access the online study reader.',
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
      note = memoryStore.notes.find((n) => n.id === noteId);
    }

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    // Check authorization: free note, admin role, or paid order
    const isFree = Boolean(note.is_free);
    let isAuthorized = isFree || req.user.role === 'admin';
    let orderNumber = 'FREE-ACCESS';

    if (!isAuthorized) {
      if (isMySQLConnected()) {
        const pool = getPool();
        if (pool) {
          const [oRows]: any = await pool.query(
            'SELECT o.id, o.order_number FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.user_id = ? AND oi.note_id = ? AND o.payment_status = "paid"',
            [req.user.id, noteId]
          );
          if (oRows.length > 0) {
            isAuthorized = true;
            orderNumber = oRows[0].order_number;
          }
        }
      } else {
        const paidOrders = memoryStore.orders.filter(
          (o) => o.user_id === req.user?.id && o.payment_status === 'paid'
        );
        const paidOrderIds = paidOrders.map((o) => o.id);
        const item = memoryStore.order_items.find(
          (oi) => paidOrderIds.includes(oi.order_id) && oi.note_id === noteId
        );
        if (item) {
          isAuthorized = true;
          const matchedOrder = paidOrders.find((o) => o.id === item.order_id);
          orderNumber = matchedOrder?.order_number || `ORD-${item.order_id}`;
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message:
          'Access Denied: This premium note is locked. Please purchase and wait for payment verification to unlock the secure reader.',
      });
    }

    // Process PDF rendering if available
    let renderedInfo = null;
    if (note.pdf_file) {
      renderedInfo = await getOrRenderPdfPages(note.pdf_file);
    }

    const isCellChapter =
      (note.chapter || '').toLowerCase().includes('cell') ||
      (note.title || '').toLowerCase().includes('cell');

    let totalPages = note.total_pages || 12;
    let pages: any[] = [];

    if (renderedInfo && renderedInfo.totalPages > 0) {
      totalPages = renderedInfo.totalPages;
      note.total_pages = totalPages;

      pages = renderedInfo.pages.map((pInfo, idx) => {
        const pageNum = pInfo.pageNumber;
        if (isCellChapter && CELL_UNIT_OF_LIFE_PAGES[idx]) {
          const meta = CELL_UNIT_OF_LIFE_PAGES[idx];
          return {
            ...meta,
            pageNumber: pageNum,
            imageUrl: pInfo.imageUrl,
          };
        }

        return {
          pageNumber: pageNum,
          imageUrl: pInfo.imageUrl,
          sectionTitle: `Page ${pageNum}: ${note.chapter || note.title} (Part ${pageNum})`,
          badge: `Study Page ${pageNum}`,
          paragraphs: [
            `High-yield study notes for ${note.chapter || note.title} - Page ${pageNum} of ${totalPages}.`,
            `Key concepts verified against NCERT guidelines for NEET & Board examinations.`,
          ],
          bulletPoints: [
            `Core Concept #${pageNum}.1: Review fundamental mechanisms and diagrams carefully.`,
            `Key Exam Point #${pageNum}.2: Verify formulas, exceptions, and high-frequency PYQ trends.`,
            `Standard syllabus guideline for ${note.subject || 'NEET Prep'}.`,
          ],
        };
      });
    } else if (isCellChapter) {
      totalPages = CELL_UNIT_OF_LIFE_PAGES.length;
      pages = CELL_UNIT_OF_LIFE_PAGES;
    } else {
      totalPages = Math.max(6, Math.min(12, note.total_pages || 8));
      pages = Array.from({ length: totalPages }, (_, i) => ({
        pageNumber: i + 1,
        sectionTitle: `Section ${i + 1}: ${note.chapter || note.title}`,
        badge: `High-Yield Part ${i + 1}`,
        paragraphs: [
          `Master syllabus notes for ${note.chapter || note.title} (${note.subject || 'NEET'}).`,
          `Essential concepts arranged in sequence for maximum retention.`,
        ],
        bulletPoints: [
          'Direct Assertion & Reason links with line-by-line NCERT references.',
          'Critical exceptions and high-negative-marking traps flagged by top rankers.',
          'Formulae arranged in increasing complexity with dimensional shortcuts.',
        ],
        infobox: {
          title: 'Exam Target Strategy',
          text: 'Master primary conceptual mechanisms first, then complete the timed self-test drill.',
        },
      }));
    }

    const watermarkText = `LICENSED TO: ${req.user.name.toUpperCase()} • ${req.user.email} • ${req.user.phone ? `PH: ${req.user.phone}` : 'VERIFIED STUDENT'} • ORDER: #${orderNumber} • UID: #${req.user.id}`;

    return res.json({
      success: true,
      note: {
        id: note.id,
        title: note.title,
        subject: note.subject,
        chapter: note.chapter,
        class_level: note.class_level || 'NEET',
        author_name: note.author_name,
        total_pages: totalPages,
        order_number: orderNumber,
        pdf_file: note.pdf_file,
      },
      license: {
        userName: req.user.name,
        userEmail: req.user.email,
        userPhone: req.user.phone || '',
        userId: req.user.id,
        orderNumber,
        watermarkText,
        unlockedAt: new Date().toISOString(),
      },
      pages,
    });
  } catch (error: any) {
    console.error('[Reader Content Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to load reader content.' });
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
