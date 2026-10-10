import React from 'react';
import { NoteCard } from './NoteCard.jsx';

/**
 * Container rendering the responsive grid or list of notes
 */
export function NoteList({
  notes,
  viewMode,
  searchQuery,
  onSelectNote,
  onEditNote,
  onDeleteNote,
}) {
  return (
    <div
      className={`notes-container ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}
      role="feed"
      aria-label="Notes collection"
      aria-busy="false"
    >
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          searchQuery={searchQuery}
          onSelect={onSelectNote}
          onEdit={onEditNote}
          onDelete={onDeleteNote}
        />
      ))}
    </div>
  );
}

export default NoteList;
