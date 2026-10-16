/**
 * Express Application Configuration
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import notesRoutes from './routes/notes.routes.js';
import aiRoutes from './routes/ai.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// CORS Configuration (configurable via CORS_ORIGIN environment variable)
const allowedOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: allowedOrigin === '*' ? '*' : allowedOrigin.split(','),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Notes API Routes
app.use('/api/notes', notesRoutes);
app.use('/api/ai', aiRoutes);

// 404 Route Handler for undefined API routes
app.use('/api/*', notFoundHandler);

// Centralized Error Handling
app.use(errorHandler);

export default app;
