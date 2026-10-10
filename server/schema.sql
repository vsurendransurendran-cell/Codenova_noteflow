-- ==============================================================================
-- Notes Application Database Schema
-- SQLite schema for storing notes with automatic timestamps
-- ==============================================================================

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for sorting by most recent updates
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
