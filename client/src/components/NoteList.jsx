import React from 'react';
import { Pin, Trash2, AlertTriangle, Layers } from 'lucide-react';
import { NoteCard } from './NoteCard.jsx';

export function NoteList({
  notes,
  viewMode,
  searchQuery,
  isTrashMode = false,
  onSelectNote,
  onEditNote,
  onTogglePin,
  onToggleFavorite,
  onMoveToTrash,
  onRestoreNote,
  onPermanentDeleteNote,
  onDuplicateNote,
  onEmptyTrash,
}) {
  // If in trash mode, show banner and all trash notes
  if (isTrashMode) {
    return (
      <div className="notes-section-wrap">
        <div className="trash-banner">
          <div className="trash-banner-left">
            <AlertTriangle size={18} className="trash-banner-icon" />
            <div>
              <strong>Trash Bin ({notes.length})</strong>
              <p>Items in the trash can be restored back to your workspace or deleted permanently.</p>
            </div>
          </div>
          {notes.length > 0 && (
            <button
              type="button"
              onClick={onEmptyTrash}
              className="btn-danger-outline"
            >
              <Trash2 size={14} />
              <span>Empty Trash</span>
            </button>
          )}
        </div>

        <div className={`notes-container ${viewMode}-view`}>
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              searchQuery={searchQuery}
              isTrashMode={true}
              onSelect={onSelectNote}
              onRestore={onRestoreNote}
              onPermanentDelete={onPermanentDeleteNote}
            />
          ))}
        </div>
      </div>
    );
  }

  // Check if we should split into Pinned vs Others
  const hasPinned = notes.some((n) => n.pinned);
  const pinnedNotes = notes.filter((n) => n.pinned);
  const otherNotes = notes.filter((n) => !n.pinned);

  // If there are pinned notes AND unpinned notes, split into two clean sections
  if (hasPinned && otherNotes.length > 0) {
    return (
      <div className="notes-section-wrap">
        {/* Pinned Section */}
        <section className="notes-group" aria-label="Pinned notes">
          <div className="notes-group-header">
            <Pin size={14} className="notes-group-icon" />
            <span>Pinned Notes ({pinnedNotes.length})</span>
          </div>
          <div className={`notes-container ${viewMode}-view`}>
            {pinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                searchQuery={searchQuery}
                onSelect={onSelectNote}
                onEdit={onEditNote}
                onTogglePin={onTogglePin}
                onToggleFavorite={onToggleFavorite}
                onMoveToTrash={onMoveToTrash}
                onDuplicate={onDuplicateNote}
              />
            ))}
          </div>
        </section>

        {/* Other Notes Section */}
        <section className="notes-group" aria-label="Other notes" style={{ marginTop: 'var(--space-8)' }}>
          <div className="notes-group-header">
            <Layers size={14} className="notes-group-icon" />
            <span>Other Notes ({otherNotes.length})</span>
          </div>
          <div className={`notes-container ${viewMode}-view`}>
            {otherNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                searchQuery={searchQuery}
                onSelect={onSelectNote}
                onEdit={onEditNote}
                onTogglePin={onTogglePin}
                onToggleFavorite={onToggleFavorite}
                onMoveToTrash={onMoveToTrash}
                onDuplicate={onDuplicateNote}
              />
            ))}
          </div>
        </section>
      </div>
    );
  }

  // Single unified list (all pinned or all unpinned)
  return (
    <div className={`notes-container ${viewMode}-view`}>
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          searchQuery={searchQuery}
          onSelect={onSelectNote}
          onEdit={onEditNote}
          onTogglePin={onTogglePin}
          onToggleFavorite={onToggleFavorite}
          onMoveToTrash={onMoveToTrash}
          onDuplicate={onDuplicateNote}
        />
      ))}
    </div>
  );
}

export default NoteList;
