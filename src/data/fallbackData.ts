import { Note, Category } from '../types';

export const FALLBACK_CATEGORIES: Category[] = [
  { id: 1, name: 'NCERT Line-by-Line Notes', slug: 'ncert-notes', description: 'Comprehensive NCERT line-by-line extracts with marked high-yield exam lines.', icon: 'book-open', display_order: 1 },
  { id: 2, name: 'Revision Notes & Mindmaps', slug: 'revision-notes', description: 'Quick chapter summary maps and one-page cheat sheets for rapid revision.', icon: 'zap', display_order: 2 },
  { id: 3, name: 'Previous Year Questions (PYQs)', slug: 'pyqs', description: 'Topic-wise solved Board and NEET past questions with step-by-step solutions.', icon: 'file-check', display_order: 3 },
  { id: 4, name: 'Formula Sheets & Cheat Codes', slug: 'formula-sheets', description: 'Complete Science, Maths, Physics and Chemistry formula digests with unit tables.', icon: 'hash', display_order: 4 },
  { id: 5, name: 'Diagrams & Flowcharts', slug: 'diagrams-flowcharts', description: 'High-res labeled anatomical, physiological, and ray diagrams.', icon: 'activity', display_order: 5 },
  { id: 6, name: 'Question Banks & Mock Papers', slug: 'question-banks', description: 'High-yield assertion-reason, case-study and practice sets with answer keys.', icon: 'help-circle', display_order: 6 },
  { id: 7, name: 'Board Special Preparation', slug: 'board-special', description: 'Board score booster kits, sample papers and marking scheme guides.', icon: 'award', display_order: 7 },
];

export let FALLBACK_NOTES: Note[] = [
  {
    id: 21,
    title: 'Class 11 Biology: Cell - The Unit of Life',
    slug: 'class-11-biology-cell-the-unit-of-life',
    description: 'Comprehensive NCERT class 11 biology handwritten study notes covering Cell: The Unit of Life, cell theory, prokaryotic & eukaryotic cell structure, organelle functions, endomembrane system, and high-yield NEET revision diagrams.',
    subject: 'Biology',
    class_level: 'Class 11',
    exam: 'NEET',
    resource_type: 'Notes',
    chapter: 'Cell: The Unit of Life',
    category_id: 1,
    price: 1.00,
    original_price: 99.00,
    thumbnail: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80',
    pdf_file: 'Biology_Notes__Cell___The_Unit_of_Life-1788364226209-967035391.pdf',
    preview_file: null,
    preview_pages: 4,
    total_pages: 12,
    file_size_mb: 1.14,
    is_free: 0,
    is_featured: 1,
    is_bestseller: 1,
    author_name: 'NEET Expert Faculty',
    rating_avg: 5.0,
    rating_count: 14,
    purchase_count: 24,
    download_count: 36,
    status: 'published',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

const STORAGE_KEY = 'neet_notes_catalog';

function initStoredNotes(): Note[] {
  if (typeof window === 'undefined') return FALLBACK_NOTES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        FALLBACK_NOTES = parsed;
        return parsed;
      }
    }
    // Seed initial catalog into localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(FALLBACK_NOTES));
  } catch (e) {
    console.error('Failed to access localStorage for notes catalog:', e);
  }
  return FALLBACK_NOTES;
}

export function getFallbackNotes(): Note[] {
  if (typeof window === 'undefined') return FALLBACK_NOTES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        FALLBACK_NOTES = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.error(e);
  }
  return FALLBACK_NOTES;
}

export function removeFallbackNote(id: number): void {
  FALLBACK_NOTES = FALLBACK_NOTES.filter(n => n.id !== id);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(FALLBACK_NOTES));
      window.dispatchEvent(new CustomEvent('neet_notes_updated', { detail: { action: 'delete', id } }));
    } catch (e) {
      console.error(e);
    }
  }
}

export function addFallbackNote(note: Note): void {
  const existingIdx = FALLBACK_NOTES.findIndex(n => n.id === note.id);
  if (existingIdx >= 0) {
    FALLBACK_NOTES[existingIdx] = { ...FALLBACK_NOTES[existingIdx], ...note };
  } else {
    FALLBACK_NOTES.unshift(note);
  }
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(FALLBACK_NOTES));
      window.dispatchEvent(new CustomEvent('neet_notes_updated', { detail: { action: 'add', note } }));
    } catch (e) {
      console.error(e);
    }
  }
}

export function updateFallbackNote(id: number, updated: Partial<Note>): Note | null {
  const idx = FALLBACK_NOTES.findIndex(n => n.id === id);
  if (idx >= 0) {
    FALLBACK_NOTES[idx] = { ...FALLBACK_NOTES[idx], ...updated };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(FALLBACK_NOTES));
        window.dispatchEvent(new CustomEvent('neet_notes_updated', { detail: { action: 'update', id, updated } }));
      } catch (e) {
        console.error(e);
      }
    }
    return FALLBACK_NOTES[idx];
  }
  return null;
}

// Initial auto-sync
FALLBACK_NOTES = initStoredNotes();
