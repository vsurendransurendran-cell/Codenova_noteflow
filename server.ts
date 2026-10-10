/**
 * Unified Full-Stack Server Entry Point
 * 
 * Runs Express backend with API routes under `/api/*` and mounts
 * Vite dev middleware in development (or serves built assets in production).
 * Fulfills AI Studio dev server requirements on Port 3000.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import notesRoutes from './server/src/routes/notes.routes.js';
import { errorHandler, notFoundHandler } from './server/src/middleware/errorHandler.js';
import { getDatabase } from './server/src/db/connection.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createServer() {
  const app = express();
  const PORT = Number(process.env.DEFAULT_APP_PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Initialize DB and ensure schema exists
  try {
    const db = await getDatabase();
    const schemaPath = path.resolve(__dirname, 'server/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      db.exec(schemaSql);
    }
  } catch (err) {
    console.error('Error during database startup check:', err);
  }

  // Basic CORS & body parsers
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok', time: new Date().toISOString() });
  });

  // REST API Routes
  app.use('/api/notes', notesRoutes);

  // 404 handler for API routes
  app.use('/api/*', notFoundHandler);

  // Vite integration
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static frontend build
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // Centralized Error Handler
  app.use(errorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Full-Stack App] Running at http://localhost:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Fatal server startup failure:', err);
  process.exit(1);
});
