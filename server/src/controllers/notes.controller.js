/**
 * Notes Controller
 * Handles CRUD operations with parameterized SQLite queries and proper HTTP statuses.
 */

import { getDatabase } from '../db/connection.js';

/**
 * GET /api/notes
 * List all notes, optionally filtered by title or content (case-insensitive)
 */
export async function getNotes(req, res, next) {
  try {
    const db = await getDatabase();
    const queryTerm = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    let notes;
    if (queryTerm) {
      // Parameterized search across title OR content
      const searchPattern = `%${queryTerm}%`;
      const stmt = db.prepare(`
        SELECT id, title, content, created_at, updated_at
        FROM notes
        WHERE title LIKE ? OR content LIKE ?
        ORDER BY updated_at DESC;
      `);
      notes = stmt.all(searchPattern, searchPattern);
    } else {
      const stmt = db.prepare(`
        SELECT id, title, content, created_at, updated_at
        FROM notes
        ORDER BY updated_at DESC;
      `);
      notes = stmt.all();
    }

    res.status(200).json({
      success: true,
      count: notes.length,
      data: notes
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/notes/:id
 * Retrieve a single note by its ID
 */
export async function getNoteById(req, res, next) {
  try {
    const db = await getDatabase();
    const noteId = req.parsedId;

    const stmt = db.prepare(`
      SELECT id, title, content, created_at, updated_at
      FROM notes
      WHERE id = ?;
    `);
    const note = stmt.get(noteId);

    if (!note) {
      return res.status(404).json({
        success: false,
        error: `Note with ID ${noteId} was not found.`
      });
    }

    res.status(200).json({
      success: true,
      data: note
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/notes
 * Create a new note with title and content
 */
export async function createNote(req, res, next) {
  try {
    const db = await getDatabase();
    const { title, content } = req.body;

    const insertStmt = db.prepare(`
      INSERT INTO notes (title, content, created_at, updated_at)
      VALUES (?, ?, datetime('now'), datetime('now'));
    `);

    const result = insertStmt.run(title, content);
    const newId = result.lastInsertRowid;

    // Fetch the newly created record to return full DB row
    const fetchStmt = db.prepare(`
      SELECT id, title, content, created_at, updated_at
      FROM notes
      WHERE id = ?;
    `);
    const createdNote = fetchStmt.get(newId);

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: createdNote
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/notes/:id
 * Update an existing note by ID
 */
export async function updateNote(req, res, next) {
  try {
    const db = await getDatabase();
    const noteId = req.parsedId;
    const { title, content } = req.body;

    // Verify existence first
    const checkStmt = db.prepare('SELECT id FROM notes WHERE id = ?;');
    const existing = checkStmt.get(noteId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: `Note with ID ${noteId} was not found.`
      });
    }

    const updateStmt = db.prepare(`
      UPDATE notes
      SET title = ?, content = ?, updated_at = datetime('now')
      WHERE id = ?;
    `);

    updateStmt.run(title, content, noteId);

    // Fetch the updated note
    const fetchStmt = db.prepare(`
      SELECT id, title, content, created_at, updated_at
      FROM notes
      WHERE id = ?;
    `);
    const updatedNote = fetchStmt.get(noteId);

    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: updatedNote
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/notes/:id
 * Delete a note by ID
 */
export async function deleteNote(req, res, next) {
  try {
    const db = await getDatabase();
    const noteId = req.parsedId;

    const checkStmt = db.prepare('SELECT id, title FROM notes WHERE id = ?;');
    const existing = checkStmt.get(noteId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: `Note with ID ${noteId} was not found.`
      });
    }

    const deleteStmt = db.prepare('DELETE FROM notes WHERE id = ?;');
    deleteStmt.run(noteId);

    res.status(200).json({
      success: true,
      message: `Note "${existing.title}" deleted successfully`,
      data: { id: noteId }
    });
  } catch (error) {
    next(error);
  }
}
