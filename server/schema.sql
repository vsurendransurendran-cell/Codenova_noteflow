-- ==============================================================================
-- NoteFlow Database Schema
-- SQLite schema for storing notes with categories, tags, pins, favorites, and trash
-- ==============================================================================

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'Personal',
  tags TEXT DEFAULT '[]',
  pinned INTEGER DEFAULT 0,
  favorite INTEGER DEFAULT 0,
  color TEXT DEFAULT 'default',
  is_trashed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indices for rapid querying and sorting
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(pinned DESC);
CREATE INDEX IF NOT EXISTS idx_notes_category ON notes(category);
CREATE INDEX IF NOT EXISTS idx_notes_is_trashed ON notes(is_trashed);
CREATE INDEX IF NOT EXISTS idx_notes_favorite ON notes(favorite);
