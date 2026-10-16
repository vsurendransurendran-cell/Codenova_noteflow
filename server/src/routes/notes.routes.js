/**
 * Notes REST API Routes
 */

import { Router } from 'express';
import {
  getNotes,
  getNotesStats,
  getNoteById,
  createNote,
  updateNote,
  togglePin,
  toggleFavorite,
  toggleTrash,
  deleteNote,
  emptyTrash,
  bulkImportNotes,
  exportAllNotes,
} from '../controllers/notes.controller.js';
import { validateNoteBody, validateNoteId } from '../middleware/validateNote.js';

const router = Router();

// Stats overview
router.get('/meta/stats', getNotesStats);

// Export all notes
router.get('/export/all', exportAllNotes);

// Bulk import notes
router.post('/bulk-import', bulkImportNotes);

// Empty trash
router.delete('/trash/empty', emptyTrash);

// List notes (supports ?q=, ?category=, ?filter=, ?sortBy=)
router.get('/', getNotes);

// Get single note by id
router.get('/:id', validateNoteId, getNoteById);

// Create a new note
router.post('/', validateNoteBody, createNote);

// Update an existing note by id
router.put('/:id', validateNoteId, validateNoteBody, updateNote);

// Toggle pin status
router.patch('/:id/pin', validateNoteId, togglePin);

// Toggle favorite status
router.patch('/:id/favorite', validateNoteId, toggleFavorite);

// Move note to trash or restore from trash
router.patch('/:id/trash', validateNoteId, toggleTrash);

// Delete an existing note by id permanently
router.delete('/:id', validateNoteId, deleteNote);

export default router;
