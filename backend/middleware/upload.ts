import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Ensure upload directories exist
const uploadBase = path.join(process.cwd(), 'backend', 'uploads');
const pdfsDir = path.join(uploadBase, 'pdfs');
const previewsDir = path.join(uploadBase, 'previews');
const thumbnailsDir = path.join(uploadBase, 'thumbnails');

[uploadBase, pdfsDir, previewsDir, thumbnailsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure Multer disk storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    if (file.fieldname === 'pdf_file') {
      cb(null, pdfsDir);
    } else if (file.fieldname === 'preview_file') {
      cb(null, previewsDir);
    } else if (file.fieldname === 'thumbnail') {
      cb(null, thumbnailsDir);
    } else {
      cb(null, uploadBase);
    }
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${cleanName}-${uniqueSuffix}${ext}`);
  },
});

// File filter for security
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedPdfTypes = ['application/pdf'];
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

  if (file.fieldname === 'pdf_file') {
    if (allowedPdfTypes.includes(file.mimetype) || file.originalname.endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid note file. Only PDF files are allowed.'));
    }
  } else if (file.fieldname === 'preview_file') {
    if (allowedPdfTypes.includes(file.mimetype) || allowedImageTypes.includes(file.mimetype) || file.originalname.endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid preview file. Only PDF or image files are allowed.'));
    }
  } else if (file.fieldname === 'thumbnail') {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid thumbnail. Only JPEG, PNG, or WebP images are allowed.'));
    }
  } else {
    cb(null, true);
  }
};

export const noteUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB maximum
  },
});

export const uploadNoteFiles = noteUpload.fields([
  { name: 'pdf_file', maxCount: 1 },
  { name: 'preview_file', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);
