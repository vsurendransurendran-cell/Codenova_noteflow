/**
 * Notes Controller
 * Handles CRUD operations, search, filters, pinning, favorites, trash, stats, and bulk import/export.
 */

import { getDatabase } from '../db/connection.js';

function parseNoteRow(row) {
  if (!row) return null;
  let parsedTags = [];
  try {
    if (typeof row.tags === 'string' && row.tags.trim()) {
      parsedTags = JSON.parse(row.tags);
    } else if (Array.isArray(row.tags)) {
      parsedTags = row.tags;
    }
  } catch {
    parsedTags = typeof row.tags === 'string' ? row.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  }

  return {
    ...row,
    pinned: Boolean(row.pinned),
    favorite: Boolean(row.favorite),
    is_trashed: Boolean(row.is_trashed),
    tags: Array.isArray(parsedTags) ? parsedTags : [],
    category: row.category || 'Personal',
    color: row.color || 'default',
  };
}

/**
 * GET /api/notes
 * List notes with optional search, category, view filter, and sorting
 */
export async function getNotes(req, res, next) {
  try {
    const db = await getDatabase();
    const queryTerm = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const filter = typeof req.query.filter === 'string' ? req.query.filter.trim().toLowerCase() : 'all';
    const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy.trim() : 'updated_desc';

    const conditions = [];
    const params = [];

    // Trash condition
    if (filter === 'trash' || req.query.trash === 'true') {
      conditions.push('is_trashed = 1');
    } else {
      conditions.push('is_trashed = 0');

      if (filter === 'pinned') {
        conditions.push('pinned = 1');
      } else if (filter === 'favorites' || filter === 'favorite') {
        conditions.push('favorite = 1');
      }
    }

    // Category condition
    if (category && category !== 'All') {
      conditions.push('category = ?');
      params.push(category);
    }

    // Search query across title, content, or tags
    if (queryTerm) {
      const pattern = `%${queryTerm}%`;
      conditions.push('(title LIKE ? OR content LIKE ? OR tags LIKE ?)');
      params.push(pattern, pattern, pattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Ordering
    let orderSql = 'pinned DESC, updated_at DESC';
    switch (sortBy) {
      case 'updated_asc':
        orderSql = 'pinned DESC, updated_at ASC';
        break;
      case 'created_desc':
        orderSql = 'pinned DESC, created_at DESC';
        break;
      case 'created_asc':
        orderSql = 'pinned DESC, created_at ASC';
        break;
      case 'title_asc':
        orderSql = 'pinned DESC, title ASC';
        break;
      case 'title_desc':
        orderSql = 'pinned DESC, title DESC';
        break;
      default:
        orderSql = 'pinned DESC, updated_at DESC';
    }

    const sql = `
      SELECT id, title, content, category, tags, pinned, favorite, color, is_trashed, created_at, updated_at
      FROM notes
      ${whereClause}
      ORDER BY ${orderSql};
    `;

    const stmt = db.prepare(sql);
    const rows = stmt.all(...params);
    const data = rows.map(parseNoteRow);

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/notes/meta/stats
 * Overview counts for sidebar and dashboard
 */
export async function getNotesStats(_req, res, next) {
  try {
    const db = await getDatabase();
    
    const allRow = db.prepare('SELECT COUNT(*) as count FROM notes WHERE is_trashed = 0;').get();
    const pinnedRow = db.prepare('SELECT COUNT(*) as count FROM notes WHERE is_trashed = 0 AND pinned = 1;').get();
    const favoritesRow = db.prepare('SELECT COUNT(*) as count FROM notes WHERE is_trashed = 0 AND favorite = 1;').get();
    const trashRow = db.prepare('SELECT COUNT(*) as count FROM notes WHERE is_trashed = 1;').get();

    // Category counts
    const categoryRows = db.prepare(`
      SELECT category, COUNT(*) as count
      FROM notes
      WHERE is_trashed = 0
      GROUP BY category;
    `).all();

    const categoryCounts = {};
    for (const r of categoryRows) {
      if (r.category) categoryCounts[r.category] = r.count;
    }

    res.status(200).json({
      success: true,
      stats: {
        total: allRow?.count || 0,
        pinned: pinnedRow?.count || 0,
        favorites: favoritesRow?.count || 0,
        trash: trashRow?.count || 0,
        categories: categoryCounts,
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/notes/:id
 * Retrieve a single note by ID
 */
export async function getNoteById(req, res, next) {
  try {
    const db = await getDatabase();
    const noteId = req.parsedId;

    const stmt = db.prepare(`
      SELECT id, title, content, category, tags, pinned, favorite, color, is_trashed, created_at, updated_at
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
      data: parseNoteRow(note)
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/notes
 * Create a new note
 */
export async function createNote(req, res, next) {
  try {
    const db = await getDatabase();
    const {
      title,
      content,
      category = 'Personal',
      tags = [],
      pinned = false,
      favorite = false,
      color = 'default',
    } = req.body;

    const serializedTags = Array.isArray(tags) ? JSON.stringify(tags) : (typeof tags === 'string' ? tags : '[]');

    const insertStmt = db.prepare(`
      INSERT INTO notes (title, content, category, tags, pinned, favorite, color, is_trashed, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'));
    `);

    const result = insertStmt.run(
      title,
      content,
      category,
      serializedTags,
      pinned ? 1 : 0,
      favorite ? 1 : 0,
      color
    );
    const newId = result.lastInsertRowid;

    const fetchStmt = db.prepare(`
      SELECT id, title, content, category, tags, pinned, favorite, color, is_trashed, created_at, updated_at
      FROM notes
      WHERE id = ?;
    `);
    const createdNote = fetchStmt.get(newId);

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: parseNoteRow(createdNote)
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/notes/:id
 * Update existing note
 */
export async function updateNote(req, res, next) {
  try {
    const db = await getDatabase();
    const noteId = req.parsedId;
    const {
      title,
      content,
      category,
      tags,
      pinned,
      favorite,
      color,
      is_trashed,
    } = req.body;

    const existingStmt = db.prepare('SELECT * FROM notes WHERE id = ?;');
    const existing = existingStmt.get(noteId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: `Note with ID ${noteId} was not found.`
      });
    }

    const nextTitle = title !== undefined ? title : existing.title;
    const nextContent = content !== undefined ? content : existing.content;
    const nextCategory = category !== undefined ? category : existing.category;
    let nextTags = existing.tags;
    if (tags !== undefined) {
      nextTags = Array.isArray(tags) ? JSON.stringify(tags) : (typeof tags === 'string' ? tags : '[]');
    }
    const nextPinned = pinned !== undefined ? (pinned ? 1 : 0) : existing.pinned;
    const nextFavorite = favorite !== undefined ? (favorite ? 1 : 0) : existing.favorite;
    const nextColor = color !== undefined ? color : existing.color;
    const nextTrashed = is_trashed !== undefined ? (is_trashed ? 1 : 0) : existing.is_trashed;

    const updateStmt = db.prepare(`
      UPDATE notes
      SET title = ?, content = ?, category = ?, tags = ?, pinned = ?, favorite = ?, color = ?, is_trashed = ?, updated_at = datetime('now')
      WHERE id = ?;
    `);

    updateStmt.run(nextTitle, nextContent, nextCategory, nextTags, nextPinned, nextFavorite, nextColor, nextTrashed, noteId);

    const fetchStmt = db.prepare(`
      SELECT id, title, content, category, tags, pinned, favorite, color, is_trashed, created_at, updated_at
      FROM notes
      WHERE id = ?;
    `);
    const updatedNote = fetchStmt.get(noteId);

    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: parseNoteRow(updatedNote)
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/notes/:id/pin
 * Toggle pin status
 */
export async function togglePin(req, res, next) {
  try {
    const db = await getDatabase();
    const noteId = req.parsedId;

    const checkStmt = db.prepare('SELECT id, pinned FROM notes WHERE id = ?;');
    const existing = checkStmt.get(noteId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    const newPinned = existing.pinned ? 0 : 1;
    db.prepare('UPDATE notes SET pinned = ?, updated_at = datetime("now") WHERE id = ?;').run(newPinned, noteId);

    const updated = db.prepare('SELECT * FROM notes WHERE id = ?;').get(noteId);
    res.status(200).json({ success: true, data: parseNoteRow(updated) });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/notes/:id/favorite
 * Toggle favorite status
 */
export async function toggleFavorite(req, res, next) {
  try {
    const db = await getDatabase();
    const noteId = req.parsedId;

    const checkStmt = db.prepare('SELECT id, favorite FROM notes WHERE id = ?;');
    const existing = checkStmt.get(noteId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    const newFav = existing.favorite ? 0 : 1;
    db.prepare('UPDATE notes SET favorite = ?, updated_at = datetime("now") WHERE id = ?;').run(newFav, noteId);

    const updated = db.prepare('SELECT * FROM notes WHERE id = ?;').get(noteId);
    res.status(200).json({ success: true, data: parseNoteRow(updated) });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/notes/:id/trash
 * Move note to trash or restore from trash
 */
export async function toggleTrash(req, res, next) {
  try {
    const db = await getDatabase();
    const noteId = req.parsedId;
    const shouldTrash = req.body.is_trashed !== undefined ? (req.body.is_trashed ? 1 : 0) : undefined;

    const checkStmt = db.prepare('SELECT id, title, is_trashed FROM notes WHERE id = ?;');
    const existing = checkStmt.get(noteId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    const newStatus = shouldTrash !== undefined ? shouldTrash : (existing.is_trashed ? 0 : 1);
    db.prepare('UPDATE notes SET is_trashed = ?, updated_at = datetime("now") WHERE id = ?;').run(newStatus, noteId);

    const updated = db.prepare('SELECT * FROM notes WHERE id = ?;').get(noteId);
    res.status(200).json({
      success: true,
      message: newStatus === 1 ? `Note moved to trash` : `Note restored from trash`,
      data: parseNoteRow(updated)
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/notes/:id
 * Permanently delete note by ID
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
      message: `Note "${existing.title}" permanently deleted`,
      data: { id: noteId, title: existing.title }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/notes/trash/empty
 * Permanently delete all trashed notes
 */
export async function emptyTrash(_req, res, next) {
  try {
    const db = await getDatabase();
    const countRow = db.prepare('SELECT COUNT(*) as count FROM notes WHERE is_trashed = 1;').get();
    db.prepare('DELETE FROM notes WHERE is_trashed = 1;').run();

    res.status(200).json({
      success: true,
      message: `Emptied ${countRow?.count || 0} notes from trash`,
      deletedCount: countRow?.count || 0
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/notes/bulk-import
 * Import notes array from JSON backup
 */
export async function bulkImportNotes(req, res, next) {
  try {
    const db = await getDatabase();
    const { notes } = req.body;

    if (!Array.isArray(notes) || notes.length === 0) {
      return res.status(400).json({ success: false, error: 'No notes provided to import.' });
    }

    let importedCount = 0;
    const stmt = db.prepare(`
      INSERT INTO notes (title, content, category, tags, pinned, favorite, color, is_trashed, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'));
    `);

    for (const item of notes) {
      if (!item.title || !item.content) continue;
      const title = String(item.title).slice(0, 255);
      const content = String(item.content);
      const category = item.category || 'Personal';
      const tags = Array.isArray(item.tags) ? JSON.stringify(item.tags) : '[]';
      const pinned = item.pinned ? 1 : 0;
      const favorite = item.favorite ? 1 : 0;
      const color = item.color || 'default';

      stmt.run(title, content, category, tags, pinned, favorite, color);
      importedCount++;
    }

    res.status(200).json({
      success: true,
      message: `Successfully imported ${importedCount} notes`,
      importedCount
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/notes/export/all
 * Export all non-trashed notes as JSON
 */
export async function exportAllNotes(_req, res, next) {
  try {
    const db = await getDatabase();
    const rows = db.prepare(`
      SELECT id, title, content, category, tags, pinned, favorite, color, created_at, updated_at
      FROM notes
      WHERE is_trashed = 0
      ORDER BY updated_at DESC;
    `).all();

    const data = rows.map(parseNoteRow);
    res.setHeader('Content-Disposition', 'attachment; filename="noteflow-export.json"');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      version: '1.0',
      exported_at: new Date().toISOString(),
      notes: data,
    });
  } catch (error) {
    next(error);
  }
}

export default {
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
};
