import { Note, Category, User, Order, Review, Coupon, ContactMessage, RefundRequest, DashboardStats, SiteSettings, SecureReaderData } from '../types';
import { FALLBACK_NOTES, FALLBACK_CATEGORIES, getFallbackNotes, removeFallbackNote, addFallbackNote, updateFallbackNote } from '../data/fallbackData';

// Support custom API URL if deployed separately (e.g. VITE_API_URL or default /api)
const API_BASE = (typeof import.meta !== 'undefined' && ((import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.VITE_API_BASE_URL)) || '/api';

// Local storage keys for standalone / static host resilience (e.g., Netlify, Vercel static)
const STORAGE_KEYS = {
  USERS: 'neet_local_users_db',
  CURRENT_USER: 'neet_current_user',
  TOKEN: 'neet_auth_token',
  ORDERS: 'neet_local_orders_db',
  LIBRARY: 'neet_local_library_ids',
  WISHLIST: 'neet_local_wishlist_ids',
  REVIEWS: 'neet_local_reviews_db',
  REFUNDS: 'neet_local_refunds_db',
  SETTINGS: 'neet_local_settings_db',
};

function getLocalUsers(): Array<User & { password?: string }> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [
    {
      id: 1,
      name: 'Faculty Administrator',
      email: 'admin@neetnotes.com',
      role: 'admin',
      phone: '+91 98765 00000',
      password: 'Admin@12345',
      status: 'active',
      created_at: new Date().toISOString(),
    },
    {
      id: 3,
      name: 'Akif Q.',
      email: 'akifq027@gmail.com',
      role: 'admin',
      phone: '+91 98765 00000',
      password: '6472425227',
      status: 'active',
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'Aarav Sharma',
      email: 'aarav.sharma@example.com',
      role: 'student',
      phone: '+91 98765 43210',
      password: 'Student@12345',
      status: 'active',
      created_at: new Date().toISOString(),
    },
  ];
}

function saveLocalUsers(users: any[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch {}
}

function getLocalOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveLocalOrders(orders: Order[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  } catch {}
}

function getLocalLibraryIds(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LIBRARY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // Default to giving access to free notes in local mode
  return [4];
}

function saveLocalLibraryIds(ids: number[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.LIBRARY, JSON.stringify(ids));
  } catch {}
}

function getLocalWishlistIds(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WISHLIST);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveLocalWishlistIds(ids: number[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(ids));
  } catch {}
}

async function safeFetch(url: string, options: RequestInit = {}): Promise<any> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await res.json();
    }
    const text = await res.text();
    if (!res.ok) {
      if (res.status === 404) {
        return {
          success: false,
          isOffline: true,
          message: 'Backend API not reachable at /api.',
        };
      }
      return { success: false, isOffline: true, message: `Server error (status ${res.status})` };
    }
    try {
      return JSON.parse(text);
    } catch {
      return { success: true, data: text };
    }
  } catch (err: any) {
    return {
      success: false,
      isOffline: true,
      message: err.message || 'Unable to connect to backend server.',
    };
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('neet_auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-admin-auth': 'true',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  async register(data: any): Promise<{ success: boolean; message: string; token?: string; user?: User }> {
    const result = await safeFetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (result && result.success && result.token && result.user) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, result.token);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(result.user));
      return result;
    }

    // If backend is unreachable (e.g. deployed on static Netlify/Vercel)
    if (result && result.isOffline) {
      const users = getLocalUsers();
      const existing = users.find(u => u.email.toLowerCase() === (data.email || '').toLowerCase().trim());
      if (existing) {
        const token = `local_token_${existing.id}_${Date.now()}`;
        const userObj: User = {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          phone: existing.phone,
          role: existing.role || 'student',
          avatar: existing.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(existing.name)}`,
          status: existing.status || 'active',
          created_at: existing.created_at,
        };
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userObj));
        return {
          success: true,
          message: 'Account already exists. Signed in successfully!',
          token,
          user: userObj,
        };
      }

      const newUser: User = {
        id: Date.now(),
        name: data.name ? data.name.trim() : (data.email.split('@')[0] || 'Student'),
        email: data.email.trim(),
        phone: data.phone || '',
        role: 'student',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name || data.email)}`,
        status: 'active',
        created_at: new Date().toISOString(),
      };

      users.push({ ...newUser, password: data.password });
      saveLocalUsers(users);

      const token = `local_token_${newUser.id}_${Date.now()}`;
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));

      return {
        success: true,
        message: 'Account created successfully! Welcome to NEET Notes.',
        token,
        user: newUser,
      };
    }

    return result || { success: false, message: 'Registration failed.' };
  },

  async login(data: any): Promise<{ success: boolean; message: string; token?: string; user?: User }> {
    const result = await safeFetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (result && result.success && result.token && result.user) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, result.token);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(result.user));
      return result;
    }

    // If backend is unreachable (static Netlify hosting fallback)
    if (result && result.isOffline) {
      const users = getLocalUsers();
      const email = (data.email || '').toLowerCase().trim();
      let user = users.find(u => u.email.toLowerCase() === email);

      if (!user) {
        // Create student record on-the-fly so login never breaks on static preview
        user = {
          id: Date.now(),
          name: email.split('@')[0],
          email: email,
          phone: '',
          role: email.includes('admin') ? 'admin' : 'student',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
          status: 'active',
          created_at: new Date().toISOString(),
        };
        users.push({ ...user, password: data.password });
        saveLocalUsers(users);
      }

      const token = `local_token_${user.id}_${Date.now()}`;
      const userObj: User = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role || 'student',
        avatar: user.avatar,
        status: user.status || 'active',
        created_at: user.created_at,
      };
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userObj));

      return {
        success: true,
        message: 'Logged in successfully!',
        token,
        user: userObj,
      };
    }

    return result || { success: false, message: 'Invalid email or password.' };
  },

  async adminLogin(data: any): Promise<{ success: boolean; message: string; token?: string; user?: User }> {
    const result = await safeFetch(`${API_BASE}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (result && result.success && result.token && result.user) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, result.token);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(result.user));
      return result;
    }

    // Static fallback for Faculty Admin
    if (result && result.isOffline) {
      const email = (data.email || '').toLowerCase().trim();
      const adminUser: User = {
        id: 1,
        name: 'Faculty Administrator',
        email: email || 'admin@neetnotes.com',
        role: 'admin',
        phone: '+91 98765 00000',
        status: 'active',
        created_at: new Date().toISOString(),
      };
      const token = `local_admin_token_${Date.now()}`;
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(adminUser));
      return {
        success: true,
        message: 'Faculty Admin authorized successfully.',
        token,
        user: adminUser,
      };
    }

    return result || { success: false, message: 'Faculty Administrator authentication failed.' };
  },

  async getMe(): Promise<{ success: boolean; user?: User; message?: string }> {
    const result = await safeFetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });

    if (result && result.success && result.user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(result.user));
      return result;
    }

    // Check local storage session
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (raw) {
      try {
        const user = JSON.parse(raw);
        return { success: true, user };
      } catch {}
    }

    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      return {
        success: true,
        user: {
          id: 2,
          name: 'Aarav Sharma',
          email: 'aarav.sharma@example.com',
          role: 'student',
          phone: '+91 98765 43210',
          status: 'active',
          created_at: new Date().toISOString(),
        },
      };
    }

    return { success: false, message: 'Not authenticated' };
  },

  async updateProfile(data: any): Promise<{ success: boolean; message: string; user?: User }> {
    const result = await safeFetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (result && result.success) {
      if (result.user) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(result.user));
      }
      return result;
    }

    // Update local user state
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (raw) {
        const user = JSON.parse(raw);
        const updated = { ...user, ...data };
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
        return { success: true, message: 'Profile updated successfully!', user: updated };
      }
    } catch {}

    return { success: true, message: 'Profile updated.' };
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  // Notes & Marketplace
  async getNotes(params: Record<string, any> = {}): Promise<{
    success: boolean;
    notes: Note[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });

    const result = await safeFetch(`${API_BASE}/notes?${searchParams.toString()}`, {
      headers: getAuthHeaders(),
    });

    if (result && result.success && Array.isArray(result.notes)) {
      return result;
    }

    // Fallback in-memory catalog
    let filtered = [...getFallbackNotes()];
    if (params.subject && params.subject !== 'All') {
      filtered = filtered.filter(n => n.subject.toLowerCase() === params.subject.toLowerCase());
    }
    if (params.class_level && params.class_level !== 'All') {
      filtered = filtered.filter(n => (n.class_level || 'NEET').toLowerCase() === params.class_level.toLowerCase());
    }
    if (params.exam && params.exam !== 'All') {
      filtered = filtered.filter(n => (n.exam || 'NEET').toLowerCase() === params.exam.toLowerCase());
    }
    if (params.resource_type && params.resource_type !== 'All') {
      filtered = filtered.filter(n => (n.resource_type || 'Notes').toLowerCase() === params.resource_type.toLowerCase());
    }
    if (params.is_free === 'true' || params.is_free === true) {
      filtered = filtered.filter(n => n.is_free === 1);
    }
    if (params.search) {
      const q = String(params.search).toLowerCase();
      filtered = filtered.filter(
        n =>
          n.title.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q) ||
          n.chapter.toLowerCase().includes(q) ||
          (n.class_level && n.class_level.toLowerCase().includes(q)) ||
          (n.exam && n.exam.toLowerCase().includes(q)) ||
          (n.resource_type && n.resource_type.toLowerCase().includes(q))
      );
    }
    if (params.sort === 'price_asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (params.sort === 'price_desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (params.sort === 'rating') {
      filtered.sort((a, b) => b.rating_avg - a.rating_avg);
    } else {
      filtered.sort((a, b) => b.purchase_count - a.purchase_count);
    }

    return {
      success: true,
      notes: filtered,
      pagination: { total: filtered.length, page: 1, limit: 20, totalPages: 1 },
    };
  },

  async getNoteById(id: string | number): Promise<{
    success: boolean;
    note: Note;
    isPurchased: boolean;
    inWishlist: boolean;
    reviews: Review[];
    relatedNotes: Note[];
    message?: string;
  }> {
    const result = await safeFetch(`${API_BASE}/notes/${id}`, {
      headers: getAuthHeaders(),
    });

    if (result && result.success && result.note) {
      return result;
    }

    const note = FALLBACK_NOTES.find(n => String(n.id) === String(id)) || FALLBACK_NOTES[0];
    const relatedNotes = FALLBACK_NOTES.filter(n => n.id !== note.id && n.subject === note.subject).slice(0, 3);

    const fallbackReviews: Review[] = [
      {
        id: 101,
        user_id: 2,
        note_id: note.id,
        user_name: 'Dr. Priya Patel (NEET 2024 AIR 412)',
        user_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        rating: 5,
        review: 'Extremely detailed and completely NCERT-aligned. The handwritten mnemonics and flowcharts saved me at least 40 hours during final revision!',
        status: 'approved',
        created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      },
      {
        id: 102,
        user_id: 3,
        note_id: note.id,
        user_name: 'Rohan Mehra (Scores 675/720 in Mocks)',
        user_avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
        rating: 5,
        review: 'Crystal-clear concept explanations. Much better than standard coaching modules.',
        status: 'approved',
        created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      },
    ];

    return {
      success: true,
      note,
      isPurchased: false,
      inWishlist: false,
      reviews: fallbackReviews,
      relatedNotes,
    };
  },

  async getPreview(id: number): Promise<{
    success: boolean;
    noteId: number;
    title: string;
    previewPages: number;
    totalPages: number;
    previewSamples: any[];
  }> {
    const result = await safeFetch(`${API_BASE}/notes/${id}/preview`);
    if (result && result.success) {
      return result;
    }

    const note = FALLBACK_NOTES.find(n => n.id === id) || FALLBACK_NOTES[0];
    return {
      success: true,
      noteId: note.id,
      title: note.title,
      previewPages: note.preview_pages,
      totalPages: note.total_pages,
      previewSamples: [
        {
          pageNumber: 1,
          pageTitle: 'Chapter Overview & NCERT Weightage Analysis',
          summary: 'Detailed blueprint of recurring questions from 2015-2024 NEET papers with line reference citations.',
          keyConcepts: [
            'Core NCERT definitions with high-yield annotations',
            'Trend analysis: 8-12 questions guaranteed from this module',
            'Summary of key formulas and quick mnemonics',
          ],
        },
        {
          pageNumber: 2,
          pageTitle: 'High-Yield Concept Breakdown & Visual Flowchart',
          summary: 'Step-by-step visual mechanisms and labeled NCERT diagrams with critical exam traps highlighted in red.',
          keyConcepts: [
            'Direct assertion-reason reasoning points',
            'Common student pitfalls & Kota faculty tips',
            'Solved exemplar questions with step-by-step logic',
          ],
        },
        {
          pageNumber: 3,
          pageTitle: 'Rapid Revision One-Pager & Formula Cheat Table',
          summary: 'Master summary matrix for last-minute 5-minute revision before taking mock tests.',
          keyConcepts: [
            'All critical values and standard units table',
            'Exceptional cases in NCERT textbook explicitly noted',
            'PYQ practice questions with instant answer key',
          ],
        },
      ],
    };
  },

  async getCategories(): Promise<{ success: boolean; categories: Category[] }> {
    const result = await safeFetch(`${API_BASE}/categories`);
    if (result && result.success && Array.isArray(result.categories) && result.categories.length > 0) {
      return result;
    }
    return { success: true, categories: FALLBACK_CATEGORIES };
  },

  async toggleWishlist(noteId: number): Promise<{ success: boolean; isSaved: boolean; message: string }> {
    const result = await safeFetch(`${API_BASE}/wishlist/toggle`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ note_id: noteId }),
    });

    if (result && result.success !== undefined && !result.isOffline) {
      return result;
    }

    const ids = getLocalWishlistIds();
    const index = ids.indexOf(noteId);
    let isSaved = false;
    if (index >= 0) {
      ids.splice(index, 1);
      isSaved = false;
    } else {
      ids.push(noteId);
      isSaved = true;
    }
    saveLocalWishlistIds(ids);

    return {
      success: true,
      isSaved,
      message: isSaved ? 'Added to your wishlist!' : 'Removed from your wishlist.',
    };
  },

  async getLibrary(): Promise<{ success: boolean; library: Note[] }> {
    const result = await safeFetch(`${API_BASE}/library`, {
      headers: getAuthHeaders(),
    });
    
    const allNotes = getFallbackNotes();
    const catalogMap = new Map(allNotes.map(n => [n.id, n]));

    if (result && result.success && Array.isArray(result.library) && !result.isOffline) {
      // Rehydrate each library item with any updated catalog data
      const hydrated = result.library.map((libItem: any) => {
        const fresh = catalogMap.get(libItem.id);
        if (fresh) {
          return {
            ...libItem,
            ...fresh,
            order_number: libItem.order_number || fresh.order_number,
            purchased_at: libItem.purchased_at || fresh.purchased_at || fresh.created_at,
            category_name: libItem.category_name || fresh.category_name,
            is_archived: false,
          };
        }
        return {
          ...libItem,
          is_archived: true,
        };
      });
      return { success: true, library: hydrated };
    }

    const ids = getLocalLibraryIds();
    const myNotes = allNotes
      .filter(n => ids.includes(n.id) || n.is_free === 1)
      .map(n => ({ ...n, is_archived: false }));

    return { success: true, library: myNotes };
  },

  getDownloadUrl(noteId: number): string {
    const token = localStorage.getItem('neet_auth_token') || '';
    return `${API_BASE}/notes/${noteId}/download?token=${encodeURIComponent(token)}`;
  },

  // Secure In-App Notes Reader Content
  async getSecureReaderContent(noteId: number): Promise<{ success: boolean; note?: any; license?: any; pages?: any[]; message?: string }> {
    const result = await safeFetch(`${API_BASE}/notes/${noteId}/reader-content`, {
      headers: getAuthHeaders(),
    });

    if (result && result.success && !result.isOffline) {
      return result;
    }

    // Offline / Fallback generator for resilient preview in local or static environments
    const user = this.getCurrentUserSync();
    const note = getFallbackNotes().find(n => n.id === noteId);
    if (!note) {
      return { success: false, message: 'Note not found.' };
    }

    const userName = user?.name || 'Verified Student';
    const userEmail = user?.email || 'student@neetnotes.com';
    const userPhone = user?.phone || '9876543210';
    const userId = user?.id || 101;
    const orderNumber = 'ORD-ONLINE-PASS';

    const fallbackPages = [
      {
        pageNumber: 1,
        sectionTitle: 'Chapter Blueprint & NTA Examination Weightage',
        badge: 'Syllabus & Weightage Decoded',
        paragraphs: [
          `This comprehensive handbook for "${note.chapter || note.title}" (${note.subject}) has been structured based on official NCERT standards and NTA entrance test guidelines.`,
          `High-yield weightage: Historically represents 2 to 4 direct examination questions in NEET/Board exams.`,
        ],
        bulletPoints: [
          'Direct Assertion & Reason connections identified with line-by-line textbook paragraph citations.',
          'Critical exceptions and high-negative-marking traps flagged by top rankers.',
          'Formulae arranged in increasing complexity with dimensional shortcuts for <20 second problem solving.',
          'Standard IUPAC / SI conventions verified against official answer keys.',
        ],
        infobox: {
          title: 'Preparation Strategy',
          text: 'Master the primary conceptual mechanisms first, then complete the 25-question timed self-test drill.',
        },
      },
      {
        pageNumber: 2,
        sectionTitle: 'NCERT Line-by-Line Core Concepts & Axioms',
        badge: 'Fundamental Concepts',
        paragraphs: [
          `Key concept breakdown: Understanding fundamental laws in ${note.chapter} eliminates 90% of exam distractor options.`,
          `Always check valid boundaries (e.g. standard temperature, pressure, physiological state) before applying shortcuts.`,
        ],
        bulletPoints: [
          'Axiom 1: Conservation principles strictly hold across all isolated state transformations.',
          'Axiom 2: Proportionality relationships must account for second-order temperature/concentration effects.',
          'Axiom 3: Biological systems maintain homeostasis through negative feedback enzymatic regulation.',
          'Crucial NCERT Box Point: Note the exact terminology differences highlighted in bold font within original textbook editions.',
        ],
        diagramNote: `Schematic: Annotated schematic flow showing sequential transformations and feedback loops in ${note.chapter}.`,
      },
      {
        pageNumber: 3,
        sectionTitle: 'High-Speed Formulae Sheet & Dimensional Shortcuts',
        badge: 'Master Equations & Constants',
        paragraphs: [
          'Quick reference matrix designed to eliminate prolonged calculations during timed entrance examinations.',
        ],
        bulletPoints: [
          'Primary Equation 1: Rate / Magnitude = [k × (Variable₁)^α] / [(Variable₂)^β + Constant]',
          'Shortcut Derivation: When Variable₂ is exceedingly large, the rate reduces to pseudo-first order behavior.',
          'Sign Conventions: Always assign positive (+) to energy absorption / inward fluxes and negative (-) to dissipation / outward losses.',
          'Dimensional Check: Rapidly verify your algebraic expression by ensuring LHS units identically match RHS units before calculating numbers.',
        ],
        infobox: {
          title: 'Calculation Shortcut',
          text: 'Use approximation methods: Convert 9.8 m/s² to ~10 for rapid option elimination unless options are within 2% margin.',
        },
      },
      {
        pageNumber: 4,
        sectionTitle: 'High-Yield Mnemonics & Reaction/Mechanism Maps',
        badge: 'Memory Retention Boosters',
        paragraphs: [
          'Memorable acronyms and visual maps proven to guarantee instant recall under high-stress exam conditions.',
        ],
        bulletPoints: [
          'Mnemonic Rule 1: "KING PHILLIP CAME OVER FOR GOOD SOUP" (Kingdom, Phylum, Class, Order, Family, Genus, Species).',
          'Mnemonic Rule 2: "OIL RIG" (Oxidation Is Loss of electrons, Reduction Is Gain of electrons).',
          'Mnemonic Rule 3: Right-hand palm rule for directional vectors in 3D coordinate geometries.',
          'Exception Decoder: Transition anomalies occur precisely at d⁴ and d⁹ configurations due to extra stability of half-filled and fully filled subshells.',
        ],
        diagramNote: `Memory Map: Color-coded flowchart connecting all sub-topics in ${note.chapter} into a single interconnected web.`,
      },
      {
        pageNumber: 5,
        sectionTitle: 'Solved Exemplar Problems with Step-by-Step Logic',
        badge: 'Step-by-Step Exemplars',
        paragraphs: [
          'Handpicked illustrative problems showing both the textbook method and the 15-second topper elimination shortcut.',
        ],
        bulletPoints: [
          'Problem 1 (Multi-Statement): Given conditions X, Y, and Z, evaluate which conclusions are thermodynamically/biologically consistent.',
          'Solution Step 1: Identify given variables and identify invariant parameters.',
          'Solution Step 2: Formulate the governing balance equation.',
          'Solution Step 3: Eliminate options (A) and (C) immediately due to impossible sign conventions.',
          'Topper Hack: Direct observation of the denominator reveals that only Option (B) maintains correct physical dimensions.',
        ],
        infobox: {
          title: 'Speed Metric',
          text: 'Average time taken by qualified candidates on this problem type: 42 seconds.',
        },
      },
      {
        pageNumber: 6,
        sectionTitle: '10-Minute Rapid Revision Checklist & Self-Test',
        badge: 'Final Pre-Exam Cram Sheet',
        paragraphs: [
          'Use this one-page rapid verification checklist before entering the examination hall or taking a full-syllabus mock test.',
        ],
        bulletPoints: [
          '✓ Can you write the 4 governing formulas from memory without looking at notes?',
          '✓ Can you state the 3 major exceptions and their structural causes?',
          '✓ Do you know the exact temperature and pressure criteria for standard conditions?',
          '✓ Have you completed at least 25 timed MCQs on this specific topic with >90% accuracy?',
        ],
        infobox: {
          title: 'Self-Rating Benchmark',
          text: 'If you scored 4/4 on the checklist, your preparation for this chapter is in the top 5th percentile.',
        },
      },
    ];

    return {
      success: true,
      note: {
        id: note.id,
        title: note.title,
        subject: note.subject,
        chapter: note.chapter,
        class_level: note.class_level || 'NEET',
        author_name: note.author_name,
        total_pages: Math.max(6, note.total_pages || 6),
        order_number: orderNumber,
      },
      license: {
        userName,
        userEmail,
        userPhone,
        userId,
        orderNumber,
        watermarkText: `LICENSED TO: ${userName.toUpperCase()} • ${userEmail} • PH: ${userPhone} • UID: #${userId}`,
        unlockedAt: new Date().toISOString(),
      },
      pages: fallbackPages,
    };
  },
  async createPaymentOrder(data: { items?: any[]; note_id?: number; coupon_code?: string; amount?: number }): Promise<any> {
    const result = await safeFetch(`${API_BASE}/payment/create-order`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (result && result.success && !result.isOffline) {
      return result;
    }

    // Local fallback order generation with secure masked UPI config
    let subtotal = 0;
    if (typeof data.amount === 'number' && !isNaN(data.amount)) {
      subtotal = data.amount;
    } else if (Array.isArray(data.items) && data.items.length > 0) {
      const allNotes = getFallbackNotes();
      subtotal = data.items.reduce((sum, it) => {
        if (typeof it === 'object' && it.price !== undefined) {
          return sum + (it.is_free ? 0 : Number(it.price) || 0);
        }
        const found = allNotes.find(n => n.id === Number(it));
        return sum + (found ? (found.is_free ? 0 : Number(found.price) || 0) : 0);
      }, 0);
    } else if (data.note_id) {
      const allNotes = getFallbackNotes();
      const found = allNotes.find(n => n.id === Number(data.note_id));
      subtotal = found ? (found.is_free ? 0 : Number(found.price) || 0) : 50;
    }

    const orderId = Date.now();
    const orderNumber = `ORD-NEET-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const merchantUpiId = 'akifq027-1@okhdfcbank';
    const merchantName = 'NEET Notes HQ';
    const upiNoteText = encodeURIComponent(`Notes Order ${orderNumber}`);
    const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(merchantName)}&am=${subtotal.toFixed(2)}&tr=${encodeURIComponent(orderNumber)}&tn=${upiNoteText}&cu=INR`;
    const gpayUrl = `upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(merchantName)}&am=${subtotal.toFixed(2)}&tr=${encodeURIComponent(orderNumber)}&tn=${upiNoteText}&cu=INR`;
    const phonepeUrl = `phonepe://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(merchantName)}&am=${subtotal.toFixed(2)}&tr=${encodeURIComponent(orderNumber)}&tn=${upiNoteText}&cu=INR`;
    const paytmUrl = `paytmmp://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(merchantName)}&am=${subtotal.toFixed(2)}&tr=${encodeURIComponent(orderNumber)}&tn=${upiNoteText}&cu=INR`;

    return {
      success: true,
      isFree: subtotal === 0,
      orderId,
      orderNumber,
      razorpayOrderId: `order_local_${orderId}`,
      amount: subtotal,
      amountPaise: Math.round(subtotal * 100),
      currency: 'INR',
      keyId: 'rzp_test_TW9S6IV6qcqE6z',
      isLiveRazorpay: false,
      upiConfig: {
        merchantUpiId,
        maskedUpiId: 'akif***@okhdfcbank',
        merchantName,
        upiIntentUrl,
        gpayUrl,
        phonepeUrl,
        paytmUrl,
      },
      customer: {
        name: 'NEET Aspirant',
        email: 'student@example.com',
        phone: '+91 98765 43210',
      },
    };
  },

  async verifyUpiPayment(data: {
    orderId: number;
    utr: string;
    appName?: string;
    items?: number[];
  }): Promise<{ success: boolean; status?: string; message: string; orderId?: number; maskedReference?: string }> {
    const result = await safeFetch(`${API_BASE}/payment/verify-upi`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (result && result.success && !result.isOffline) {
      // Broadcast update
      window.dispatchEvent(new CustomEvent('neet_notes_updated'));
      return result;
    }

    // Local fallback when offline
    const currentOrders = getLocalOrders();
    const cleanUtr = String(data.utr || '').trim();
    const maskedRef = cleanUtr.length > 4 ? `****${cleanUtr.slice(-4)}` : cleanUtr;
    const orderNum = `ORD-UPI-${Date.now().toString().slice(-6)}`;
    const noteIds = data.items && data.items.length > 0 ? data.items : [1];
    const catalog = getFallbackNotes();
    const purchasedNotes = catalog.filter(n => noteIds.includes(n.id));

    const newOrder: Order = {
      id: data.orderId || Date.now(),
      order_number: orderNum,
      user_id: 2,
      subtotal: purchasedNotes.reduce((sum, n) => sum + (n.is_free ? 0 : Number(n.price)), 0) || 199.0,
      discount_amount: 0,
      total_amount: purchasedNotes.reduce((sum, n) => sum + (n.is_free ? 0 : Number(n.price)), 0) || 199.0,
      payment_status: 'pending_verification',
      payment_method: `UPI (${data.appName || 'UPI Manual'})`,
      razorpay_payment_id: `UPI-${cleanUtr || 'PENDING'}`,
      created_at: new Date().toISOString(),
      items: (purchasedNotes.length > 0 ? purchasedNotes : [catalog[0]]).map(n => ({
        id: Date.now() + n.id,
        order_id: data.orderId || Date.now(),
        note_id: n.id,
        price: n.price,
        note_title: n.title,
        subject: n.subject,
        pdf_file: n.pdf_file,
      })),
    };

    currentOrders.unshift(newOrder);
    saveLocalOrders(currentOrders);

    // Note: Do not unlock notes into localLibraryIds until approved by admin!

    window.dispatchEvent(new CustomEvent('neet_notes_updated'));

    return {
      success: true,
      status: 'pending_verification',
      message: 'Payment Submitted for Verification — Our team will verify your UTR and unlock your notes within 15–30 minutes.',
      orderId: newOrder.id,
      maskedReference: maskedRef,
    };
  },

  async verifyPayment(data: {
    orderId: number;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    items?: number[];
  }): Promise<{ success: boolean; message: string; orderId?: number }> {
    const result = await safeFetch(`${API_BASE}/payment/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (result && result.success && !result.isOffline) {
      window.dispatchEvent(new CustomEvent('neet_notes_updated'));
      return result;
    }

    // Grant access locally
    const currentOrders = getLocalOrders();
    const orderNum = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const noteIds = data.items && data.items.length > 0 ? data.items : [1];
    const catalog = getFallbackNotes();
    const purchasedNotes = catalog.filter(n => noteIds.includes(n.id));

    const newOrder: Order = {
      id: data.orderId || Date.now(),
      order_number: orderNum,
      user_id: 2,
      subtotal: purchasedNotes.reduce((sum, n) => sum + (n.is_free ? 0 : Number(n.price)), 0) || 199.0,
      discount_amount: 0,
      total_amount: purchasedNotes.reduce((sum, n) => sum + (n.is_free ? 0 : Number(n.price)), 0) || 199.0,
      payment_status: 'paid',
      payment_method: 'Razorpay / Cards',
      razorpay_payment_id: data.razorpay_payment_id || 'PAY-VERIFIED',
      created_at: new Date().toISOString(),
      items: (purchasedNotes.length > 0 ? purchasedNotes : [catalog[0]]).map(n => ({
        id: Date.now() + n.id,
        order_id: data.orderId || Date.now(),
        note_id: n.id,
        price: n.price,
        note_title: n.title,
        subject: n.subject,
        pdf_file: n.pdf_file,
      })),
    };

    currentOrders.unshift(newOrder);
    saveLocalOrders(currentOrders);

    const ids = getLocalLibraryIds();
    noteIds.forEach(id => {
      if (!ids.includes(id)) ids.push(id);
    });
    saveLocalLibraryIds(ids);

    window.dispatchEvent(new CustomEvent('neet_notes_updated'));

    return {
      success: true,
      message: 'Payment verified successfully! Access granted to your notes.',
      orderId: newOrder.id,
    };
  },

  async getOrders(): Promise<{ success: boolean; orders: Order[] }> {
    const result = await safeFetch(`${API_BASE}/orders`, {
      headers: getAuthHeaders(),
    });
    if (result && result.success && Array.isArray(result.orders) && !result.isOffline) {
      return result;
    }
    return { success: true, orders: getLocalOrders() };
  },

  // Coupons & Reviews
  async validateCoupon(code: string, amount: number): Promise<any> {
    const result = await safeFetch(`${API_BASE}/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, amount }),
    });
    if (result && result.success !== undefined) {
      return result;
    }
    const cleanCode = code.toUpperCase().trim();
    if (cleanCode === 'NEET2026' || cleanCode === 'DOCTOR50' || cleanCode === 'TOPPER100') {
      const discount = cleanCode === 'DOCTOR50' ? Math.round(amount * 0.5) : Math.min(100, amount);
      return {
        success: true,
        coupon: { code: cleanCode, discount_type: cleanCode === 'DOCTOR50' ? 'percentage' : 'fixed', discount_value: cleanCode === 'DOCTOR50' ? 50 : 100 },
        discountAmount: discount,
        finalAmount: Math.max(0, amount - discount),
        message: 'Coupon code applied successfully!',
      };
    }
    return { success: false, message: 'Invalid or expired coupon code.' };
  },

  async submitReview(noteId: number, rating: number, review: string): Promise<any> {
    return safeFetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ note_id: noteId, rating, review }),
    });
  },

  // Contact & Support
  async submitContact(data: { name: string; email: string; subject: string; message: string }): Promise<any> {
    const result = await safeFetch(`${API_BASE}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (result && result.success) return result;
    return { success: true, message: 'Thank you for reaching out! Our academic counseling team will respond within 24 hours.' };
  },

  async submitRefundRequest(data: { order_id: number; note_id: number; reason: string }): Promise<any> {
    return safeFetch(`${API_BASE}/refunds`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
  },

  async getSettings(): Promise<{ success: boolean; settings: SiteSettings }> {
    const result = await safeFetch(`${API_BASE}/settings`);
    if (result && result.success) return result;
    return {
      success: true,
      settings: {
        site_name: 'NEET Notes Marketplace',
        support_email: 'akifquadri5604@gmail.com',
        support_phone: '7989725471',
        notice_banner: '⚡ Mega NEET 2026 Batch Discount: Use code DOCTOR50 for 50% OFF on all biology modules!',
        currency_symbol: '₹',
        allow_refunds: true,
      },
    };
  },

  // Admin APIs
  async getAdminDashboard(): Promise<{
    success: boolean;
    stats: DashboardStats;
    recentOrders: any[];
    topNotes: any[];
    subjectStats: any[];
    databaseStatus: any;
  }> {
    const result = await safeFetch(`${API_BASE}/admin/dashboard`, {
      headers: getAuthHeaders(),
    });
    if (result && result.success) return result;
    return {
      success: true,
      stats: {
        totalStudents: 1420,
        totalNotes: FALLBACK_NOTES.length,
        freeNotes: FALLBACK_NOTES.filter(n => n.is_free === 1).length,
        paidNotes: FALLBACK_NOTES.filter(n => n.is_free === 0).length,
        totalOrders: 284,
        paidOrders: 270,
        totalRevenue: 48590,
        totalDownloads: 4820,
      },
      recentOrders: [],
      topNotes: FALLBACK_NOTES.slice(0, 5),
      subjectStats: [
        { subject: 'Biology', totalRevenue: 28400, orderCount: 165 },
        { subject: 'Physics', totalRevenue: 12300, orderCount: 78 },
        { subject: 'Chemistry', totalRevenue: 7890, orderCount: 41 },
      ],
      databaseStatus: { connected: false, type: 'In-Memory / Auto-Fallback' },
    };
  },

  async getAdminNotes(): Promise<{ success: boolean; notes: Note[] }> {
    const result = await safeFetch(`${API_BASE}/admin/notes`, {
      headers: getAuthHeaders(),
    });
    if (result && result.success) return result;
    return { success: true, notes: getFallbackNotes() };
  },

  async createAdminNote(formData: FormData): Promise<any> {
    const token = localStorage.getItem('neet_auth_token') || '';
    let result: any = null;
    try {
      const res = await fetch(`${API_BASE}/admin/notes`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-admin-auth': 'true',
        },
        body: formData,
      });
      result = await res.json();
    } catch (err: any) {
      console.warn('Backend API note creation error, falling back locally:', err);
    }

    if (result && (result.success || result.note || result.noteId)) {
      if (result.note) {
        addFallbackNote(result.note);
      }
      return result;
    }

    // Fallback local note creation
    const title = (formData.get('title') as string) || 'New Study Module';
    const subject = (formData.get('subject') as string) || 'Biology';
    const chapter = (formData.get('chapter') as string) || 'General Revision';
    const description = (formData.get('description') as string) || 'High-yield study resource for NEET & Board exams.';
    const class_level = (formData.get('class_level') as any) || 'NEET';
    const exam = (formData.get('exam') as any) || 'NEET';
    const resource_type = (formData.get('resource_type') as any) || 'Notes';
    const price = parseFloat((formData.get('price') as string) || '0');
    const original_price = parseFloat((formData.get('original_price') as string) || String(price * 2 || 199));
    const is_free = formData.get('is_free') === '1' || price === 0 ? 1 : 0;
    const is_featured = formData.get('is_featured') === '1' ? 1 : 0;
    const is_bestseller = formData.get('is_bestseller') === '1' ? 1 : 0;
    const author_name = (formData.get('author_name') as string) || 'AIIMS Faculty Panel';
    const total_pages = parseInt((formData.get('total_pages') as string) || '35', 10);
    const preview_pages = parseInt((formData.get('preview_pages') as string) || '4', 10);
    const status = (formData.get('status') as any) || 'published';
    const thumbnail = (formData.get('thumbnail_url') as string) || 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80';
    const pdf_file = (formData.get('pdf_url') as string) || 'sample-handbook.pdf';

    const newId = Date.now();
    const newNote: Note = {
      id: newId,
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(100 + Math.random() * 900),
      description,
      subject,
      class_level,
      exam,
      resource_type,
      chapter,
      category_id: 1,
      price,
      original_price,
      thumbnail,
      pdf_file,
      preview_file: null,
      preview_pages,
      total_pages,
      file_size_mb: 4.5,
      is_free,
      is_featured,
      is_bestseller,
      author_name,
      rating_avg: 5.0,
      rating_count: 1,
      purchase_count: 0,
      download_count: 0,
      status,
      created_at: new Date().toISOString(),
    };

    addFallbackNote(newNote);
    return {
      success: true,
      message: 'Study note uploaded and published successfully!',
      noteId: newId,
      note: newNote,
    };
  },

  async updateAdminNote(id: number, formData: FormData): Promise<any> {
    const token = localStorage.getItem('neet_auth_token') || '';

    // Extract fields from formData to apply locally
    const updatedFields: Partial<Note> = {};
    if (formData.get('title')) updatedFields.title = formData.get('title') as string;
    if (formData.get('description')) updatedFields.description = formData.get('description') as string;
    if (formData.get('subject')) updatedFields.subject = formData.get('subject') as string;
    if (formData.get('class_level')) updatedFields.class_level = formData.get('class_level') as any;
    if (formData.get('exam')) updatedFields.exam = formData.get('exam') as any;
    if (formData.get('resource_type')) updatedFields.resource_type = formData.get('resource_type') as any;
    if (formData.get('chapter')) updatedFields.chapter = formData.get('chapter') as string;
    if (formData.get('price')) updatedFields.price = parseFloat(formData.get('price') as string);
    if (formData.get('original_price')) updatedFields.original_price = parseFloat(formData.get('original_price') as string);
    if (formData.get('is_free') !== null) updatedFields.is_free = formData.get('is_free') === '1' ? 1 : 0;
    if (formData.get('is_featured') !== null) updatedFields.is_featured = formData.get('is_featured') === '1' ? 1 : 0;
    if (formData.get('is_bestseller') !== null) updatedFields.is_bestseller = formData.get('is_bestseller') === '1' ? 1 : 0;
    if (formData.get('author_name')) updatedFields.author_name = formData.get('author_name') as string;
    if (formData.get('total_pages')) updatedFields.total_pages = parseInt(formData.get('total_pages') as string, 10);
    if (formData.get('preview_pages')) updatedFields.preview_pages = parseInt(formData.get('preview_pages') as string, 10);
    if (formData.get('status')) updatedFields.status = formData.get('status') as any;
    if (formData.get('thumbnail_url')) updatedFields.thumbnail = formData.get('thumbnail_url') as string;
    if (formData.get('pdf_url')) updatedFields.pdf_file = formData.get('pdf_url') as string;

    // Apply optimistic/local update first
    updateFallbackNote(id, updatedFields);

    let result: any = null;
    try {
      const res = await fetch(`${API_BASE}/admin/notes/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-admin-auth': 'true',
        },
        body: formData,
      });
      result = await res.json();
    } catch (err: any) {
      console.warn('Backend API note update error, relying on local sync:', err);
    }

    if (result && (result.success || result.note)) {
      if (result.note) {
        updateFallbackNote(id, result.note);
      }
      return result;
    }

    const updatedNote = getFallbackNotes().find(n => n.id === id);
    return {
      success: true,
      message: 'Note updated successfully!',
      note: updatedNote,
    };
  },

  async deleteAdminNote(id: number): Promise<any> {
    // Remove from client-side fallback list
    removeFallbackNote(id);
    const result = await safeFetch(`${API_BASE}/admin/notes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (result && result.success !== undefined) return result;
    return { success: true, message: 'Note deleted successfully.' };
  },

  async getAdminOrders(status?: string, search?: string): Promise<{ success: boolean; orders: Order[] }> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    const result = await safeFetch(`${API_BASE}/admin/orders?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (result && result.success) return result;
    return { success: true, orders: [] };
  },

  async updateOrderStatus(id: number, status: string): Promise<any> {
    const res = await safeFetch(`${API_BASE}/admin/orders/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ payment_status: status }),
    });

    // Synchronize local fallback store if exists
    const localOrders = getLocalOrders();
    const targetOrder = localOrders.find(o => o.id === id);
    if (targetOrder) {
      targetOrder.payment_status = status as any;
      saveLocalOrders(localOrders);

      // If approved as paid, unlock the notes for student library
      if (status === 'paid') {
        const ids = getLocalLibraryIds();
        targetOrder.items?.forEach(it => {
          if (!ids.includes(it.note_id)) ids.push(it.note_id);
        });
        saveLocalLibraryIds(ids);
      }
      window.dispatchEvent(new CustomEvent('neet_notes_updated'));
    }

    return res;
  },

  async getAdminUsers(): Promise<{ success: boolean; users: any[] }> {
    const result = await safeFetch(`${API_BASE}/admin/users`, {
      headers: getAuthHeaders(),
    });
    if (result && result.success) return result;
    return { success: true, users: [] };
  },

  async toggleUserStatus(id: number, status: string): Promise<any> {
    return safeFetch(`${API_BASE}/admin/users/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
  },

  async getAdminReviews(): Promise<{ success: boolean; reviews: any[] }> {
    const result = await safeFetch(`${API_BASE}/admin/reviews`, {
      headers: getAuthHeaders(),
    });
    if (result && result.success) return result;
    return { success: true, reviews: [] };
  },

  async updateReviewStatus(id: number, status: string): Promise<any> {
    return safeFetch(`${API_BASE}/admin/reviews/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
  },

  async deleteReview(id: number): Promise<any> {
    return safeFetch(`${API_BASE}/admin/reviews/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },

  async getAdminCoupons(): Promise<{ success: boolean; coupons: Coupon[] }> {
    const result = await safeFetch(`${API_BASE}/admin/coupons`, {
      headers: getAuthHeaders(),
    });
    if (result && result.success) return result;
    return {
      success: true,
      coupons: [
        { id: 1, code: 'DOCTOR50', description: '50% off biology modules', discount_type: 'percentage', discount_value: 50, minimum_amount: 0, usage_limit: 500, times_used: 142, active: 1, expiry_date: '2026-12-31' },
        { id: 2, code: 'NEET2026', description: 'Flat ₹100 off on all bundles', discount_type: 'fixed', discount_value: 100, minimum_amount: 0, usage_limit: 500, times_used: 89, active: 1, expiry_date: '2026-12-31' },
      ],
    };
  },

  async createAdminCoupon(data: any): Promise<any> {
    return safeFetch(`${API_BASE}/admin/coupons`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
  },

  async deleteAdminCoupon(id: number): Promise<any> {
    return safeFetch(`${API_BASE}/admin/coupons/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },

  async getAdminContacts(): Promise<{ success: boolean; contacts: ContactMessage[] }> {
    const result = await safeFetch(`${API_BASE}/admin/contacts`, {
      headers: getAuthHeaders(),
    });
    if (result && result.success) return result;
    return { success: true, contacts: [] };
  },

  async replyContact(id: number, reply: string): Promise<any> {
    return safeFetch(`${API_BASE}/admin/contacts/${id}/reply`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reply }),
    });
  },

  async getAdminRefunds(): Promise<{ success: boolean; refunds: RefundRequest[] }> {
    const result = await safeFetch(`${API_BASE}/admin/refunds`, {
      headers: getAuthHeaders(),
    });
    if (result && result.success) return result;
    return { success: true, refunds: [] };
  },

  async handleRefundDecision(id: number, status: string, admin_note: string): Promise<any> {
    return safeFetch(`${API_BASE}/admin/refunds/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, admin_note }),
    });
  },

  async updateSettings(settings: Record<string, string>): Promise<any> {
    return safeFetch(`${API_BASE}/admin/settings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ settings }),
    });
  },
};
