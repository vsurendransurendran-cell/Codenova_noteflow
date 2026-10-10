import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

/**
 * Format relative or localized date string
 */
function formatNoteDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr.replace(' ', 'T') + 'Z');
    if (isNaN(date.getTime())) return dateStr;

    // Check if valid
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return dateStr;
  }
}

/**
 * Highlights search matches in title or snippet text
 */
function HighlightText({ text, query }) {
  if (!query || !text) return <>{text}</>;
  const trimmed = query.trim();
  if (!trimmed) return <>{text}</>;

  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === trimmed.toLowerCase() ? (
          <mark key={i} className="search-highlight">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

/**
 * NoteCard component supporting Grid & List representations
 */
export function NoteCard({ note, searchQuery, onSelect, onEdit, onDelete }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(note);
    }
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    onEdit(note);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(note);
  };

  return (
    <article
      tabIndex={0}
      role="button"
      onClick={() => onSelect(note)}
      onKeyDown={handleKeyDown}
      className="note-card"
      aria-label={`Note: ${note.title}. Click to view or edit.`}
    >
      <div className="note-card-main">
        <h2 className="note-card-title">
          <HighlightText text={note.title} query={searchQuery} />
        </h2>
        <p className="note-card-snippet">
          <HighlightText text={note.content} query={searchQuery} />
        </p>
      </div>

      <div className="note-card-footer">
        <div className="note-metadata" title={`Updated at: ${note.updated_at}`}>
          <span>Updated {formatNoteDate(note.updated_at || note.created_at)}</span>
        </div>

        <div className="note-card-actions">
          <button
            type="button"
            onClick={handleEditClick}
            className="card-action-btn"
            aria-label={`Edit "${note.title}"`}
            title="Edit note"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={handleDeleteClick}
            className="card-action-btn delete"
            aria-label={`Delete "${note.title}"`}
            title="Delete note"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}

export default NoteCard;
