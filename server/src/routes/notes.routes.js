/**
 * Notes REST API Routes
 */

import { Router } from 'express';
import {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote
} from '../controllers/notes.controller.js';
import { validateNoteBody, validateNoteId } from '../middleware/validateNote.js';

const router = Router();

// List notes (supports ?q= query param)
router.get('/', getNotes);

// Get single note by id
router.get('/:id', validateNoteId, getNoteById);

// Create a new note
router.post('/', validateNoteBody, createNote);

// Update an existing note by id
router.put('/:id', validateNoteId, validateNoteBody, updateNote);

// Delete an existing note by id
router.delete('/:id', validateNoteId, deleteNote);

export default router;
