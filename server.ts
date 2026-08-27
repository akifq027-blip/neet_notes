import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { initDatabase, getDatabaseStatus } from './backend/config/db';
import apiRouter from './backend/routes/api';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Database (MySQL pool with embedded fallback)
  await initDatabase();

  // Basic Security & Middlewares
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(cors());
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Static route for public thumbnails and previews
  app.use('/backend/uploads/thumbnails', express.static(path.join(process.cwd(), 'backend', 'uploads', 'thumbnails')));
  app.use('/backend/uploads/previews', express.static(path.join(process.cwd(), 'backend', 'uploads', 'previews')));

  // Health and System Diagnostics
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: getDatabaseStatus(),
    });
  });

  // Mount API Router
  app.use('/api', apiRouter);

  // Vite middleware for development / Static files for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NEET Notes Marketplace] Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[Server Startup Error]', err);
});
