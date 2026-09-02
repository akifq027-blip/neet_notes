import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export interface RenderedPdfInfo {
  success: boolean;
  totalPages: number;
  filenameBase: string;
  pages: {
    pageNumber: number;
    imageUrl: string;
  }[];
}

/**
 * Gets real page count of a PDF file using Ghostscript or fallback
 */
export async function getPdfPageCount(pdfFilePath: string): Promise<number> {
  try {
    if (!fs.existsSync(pdfFilePath)) return 0;
    const cmd = `gs -dNOSAFER -q -dNODISPLAY -c "(${pdfFilePath.replace(/\\/g, '/')}) (r) file runpdfbegin pdfpagecount = quit"`;
    const { stdout } = await execPromise(cmd);
    const count = parseInt(stdout.trim(), 10);
    return isNaN(count) || count <= 0 ? 0 : count;
  } catch (err) {
    console.warn('[PDF Page Count Error]', err);
    return 0;
  }
}

/**
 * Renders all pages of a PDF to high-resolution PNGs and caches them
 */
export async function getOrRenderPdfPages(pdfFilename: string): Promise<RenderedPdfInfo | null> {
  try {
    if (!pdfFilename) return null;

    const pdfPath = path.join(process.cwd(), 'backend', 'uploads', 'pdfs', pdfFilename);
    if (!fs.existsSync(pdfPath)) {
      return null;
    }

    const filenameBase = path.basename(pdfFilename, path.extname(pdfFilename));
    const renderDir = path.join(process.cwd(), 'backend', 'uploads', 'rendered_pages', filenameBase);

    if (!fs.existsSync(renderDir)) {
      fs.mkdirSync(renderDir, { recursive: true });
    }

    // Cache verification: check for 300 DPI verification marker
    const dpiMarkerPath = path.join(renderDir, '.resolution_300dpi');
    const existingFiles = fs.readdirSync(renderDir).filter(f => f.startsWith('page_') && f.endsWith('.png'));

    // If marker is missing or files don't exist, purge any legacy low-res cache and re-render at 300 DPI
    const isCacheLegacy = !fs.existsSync(dpiMarkerPath) || existingFiles.length === 0;

    let totalPages = existingFiles.length;

    if (isCacheLegacy) {
      console.log(`[PDF Rasterizer] Purging legacy low-res cache & rasterizing at 300 DPI: ${filenameBase}`);

      // Clean up legacy files
      for (const file of existingFiles) {
        try {
          fs.unlinkSync(path.join(renderDir, file));
        } catch (_) {}
      }

      // Determine page count
      const detectedCount = await getPdfPageCount(pdfPath);
      
      // Render pages using Ghostscript at 300 DPI with 4-bit subpixel anti-aliasing (2480x3508 min res)
      const outputPattern = path.join(renderDir, 'page_%02d.png').replace(/\\/g, '/');
      const renderCmd = `gs -dNOPAUSE -dBATCH -sDEVICE=png16m -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -dDOINTERPOLATE -r300 -sOutputFile="${outputPattern}" "${pdfPath.replace(/\\/g, '/')}"`;
      
      await execPromise(renderCmd);

      // Write 300 DPI verification stamp
      fs.writeFileSync(
        dpiMarkerPath,
        JSON.stringify({
          dpi: 300,
          antialiasing: '4-bit subpixel text+graphics',
          targetResolution: '2480x3508 A4',
          renderedAt: new Date().toISOString(),
        }, null, 2)
      );

      const generatedFiles = fs.readdirSync(renderDir).filter(f => f.startsWith('page_') && f.endsWith('.png'));
      totalPages = generatedFiles.length || detectedCount || 1;
    }

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      const pageStr = i.toString().padStart(2, '0');
      const filename = `page_${pageStr}.png`;
      pages.push({
        pageNumber: i,
        imageUrl: `/backend/uploads/rendered_pages/${filenameBase}/${filename}`,
      });
    }

    return {
      success: true,
      totalPages,
      filenameBase,
      pages,
    };
  } catch (err) {
    console.error('[PDF Render Error]', err);
    return null;
  }
}
