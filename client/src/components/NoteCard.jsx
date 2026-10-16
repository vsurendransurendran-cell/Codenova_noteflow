import React from 'react';
import {
  Pin,
  Star,
  Pencil,
  Trash2,
  Copy,
  RotateCcw,
  CheckSquare,
} from 'lucide-react';

const CATEGORY_COLORS = {
  CodeNova: '#2563eb',
  Work: '#7c3aed',
  Study: '#059669',
  Personal: '#d97706',
  Ideas: '#e11d48',
};

function formatNoteDate(dateStr) {
  if (!dateStr) return '';
  try {
    const cleanStr = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + 'Z';
    const date = new Date(cleanStr);
    if (isNaN(date.getTime())) return dateStr;

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

function HighlightText({ text, query }) {
  if (!query || !text) return <>{text}</>;
  const trimmed = query.trim();
  if (!trimmed) return <>{text}</>;

  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = String(text).split(regex);

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

function calculateChecklist(content) {
  if (!content) return null;
  const matches = content.match(/\[([ xX])\]/g);
  if (!matches || matches.length === 0) return null;
  const total = matches.length;
  const completed = matches.filter(m => m.toLowerCase().includes('x')).length;
  const percentage = Math.round((completed / total) * 100);
  return { total, completed, percentage };
}

export function NoteCard({
  note,
  searchQuery,
  isTrashMode = false,
  onSelect,
  onEdit,
  onTogglePin,
  onToggleFavorite,
  onMoveToTrash,
  onRestore,
  onPermanentDelete,
  onDuplicate,
}) {
  const checklist = calculateChecklist(note.content);
  const wordCount = note.content ? note.content.trim().split(/\s+/).filter(Boolean).length : 0;
  const catColor = CATEGORY_COLORS[note.category] || 'var(--color-primary)';

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(note);
    }
  };

  return (
    <article
      tabIndex={0}
      role="button"
      onClick={() => onSelect(note)}
      onKeyDown={handleKeyDown}
      className={`note-card color-${note.color || 'default'} ${note.pinned ? 'is-pinned' : ''}`}
      aria-label={`Note: ${note.title}. Click to view or edit.`}
    >
      {/* Top Meta Bar */}
      <div className="card-top-bar">
        <div className="card-badges">
          {note.category && (
            <span className="card-category-pill" style={{ '--cat-color': catColor }}>
              <span className="card-category-dot" style={{ backgroundColor: catColor }} />
              {note.category}
            </span>
          )}
          {note.pinned && (
            <span className="card-pinned-badge" title="Pinned to top">
              <Pin size={11} />
              <span>Pinned</span>
            </span>
          )}
        </div>

        {/* Quick Pin & Favorite Buttons */}
        {!isTrashMode && (
          <div className="card-quick-actions" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => onToggleFavorite(note.id, note.title)}
              className={`card-icon-btn ${note.favorite ? 'starred' : ''}`}
              title={note.favorite ? 'Remove from favorites' : 'Add to favorites'}
              aria-label="Toggle favorite"
            >
              <Star size={14} fill={note.favorite ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              onClick={() => onTogglePin(note.id, note.title)}
              className={`card-icon-btn ${note.pinned ? 'pinned' : ''}`}
              title={note.pinned ? 'Unpin note' : 'Pin note to top'}
              aria-label="Toggle pin"
            >
              <Pin size={14} fill={note.pinned ? 'currentColor' : 'none'} />
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="note-card-main">
        <h2 className="note-card-title">
          <HighlightText text={note.title} query={searchQuery} />
        </h2>
        <p className="note-card-snippet">
          <HighlightText text={note.content} query={searchQuery} />
        </p>

        {/* Checklist Progress Indicator if note contains checkboxes */}
        {checklist && (
          <div className="card-checklist-meter" title={`${checklist.completed} of ${checklist.total} tasks completed`}>
            <div className="checklist-meter-info">
              <span className="checklist-meter-text">
                <CheckSquare size={12} />
                <span>{checklist.completed}/{checklist.total} completed</span>
              </span>
              <span className="checklist-meter-pct">{checklist.percentage}%</span>
            </div>
            <div className="checklist-track">
              <div
                className="checklist-progress"
                style={{ width: `${checklist.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Tags */}
        {Array.isArray(note.tags) && note.tags.length > 0 && (
          <div className="card-tags-list">
            {note.tags.map((tag, i) => (
              <span key={i} className="card-tag">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Footer with Timestamp & Action Buttons */}
      <div className="note-card-footer" onClick={(e) => e.stopPropagation()}>
        <div className="note-metadata" title={`Created: ${note.created_at}\nUpdated: ${note.updated_at}`}>
          <span>{formatNoteDate(note.updated_at || note.created_at)}</span>
          <span className="note-meta-sep">·</span>
          <span>{wordCount} words</span>
        </div>

        <div className="note-card-actions">
          {isTrashMode ? (
            <>
              <button
                type="button"
                onClick={() => onRestore(note)}
                className="card-action-btn restore"
                title="Restore note from Trash"
                aria-label="Restore note"
              >
                <RotateCcw size={14} />
                <span className="action-label">Restore</span>
              </button>
              <button
                type="button"
                onClick={() => onPermanentDelete(note)}
                className="card-action-btn delete"
                title="Permanently delete note"
                aria-label="Permanently delete note"
              >
                <Trash2 size={14} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onDuplicate(note)}
                className="card-action-btn"
                title="Duplicate note"
                aria-label="Duplicate note"
              >
                <Copy size={14} />
              </button>
              <button
                type="button"
                onClick={() => onEdit(note)}
                className="card-action-btn"
                title="Edit note"
                aria-label="Edit note"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => onMoveToTrash(note)}
                className="card-action-btn delete"
                title="Move note to Trash"
                aria-label="Move note to trash"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export default NoteCard;
