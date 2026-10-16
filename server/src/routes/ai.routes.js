/**
 * AI REST Routes
 */

import { Router } from 'express';
import { processNoteWithAI } from '../controllers/ai.controller.js';

const router = Router();

router.post('/process', processNoteWithAI);

export default router;
