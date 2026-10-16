import React from 'react';
import { FileText, SearchX, Plus, RefreshCw, Star, Pin, Trash2, Folder } from 'lucide-react';

/**
 * Contextual Empty State component
 */
export function EmptyState({
  searchQuery,
  activeFilter = 'all',
  activeCategory = 'All',
  onClearSearch,
  onOpenCreate,
}) {
  if (searchQuery) {
    return (
      <div className="empty-state-card" role="status">
        <div className="empty-state-icon" aria-hidden="true">
          <SearchX size={32} />
        </div>
        <div className="empty-state-content">
          <h3>No matching notes found</h3>
          <p>
            No notes matched <strong>"{searchQuery}"</strong>. Check for typos or search for a tag like #internship.
          </p>
        </div>
        <button
          type="button"
          onClick={onClearSearch}
          className="btn-secondary"
          aria-label="Clear current search query"
        >
          <RefreshCw size={15} />
          <span>Clear Search Filter</span>
        </button>
      </div>
    );
  }

  if (activeFilter === 'trash') {
    return (
      <div className="empty-state-card" role="status">
        <div className="empty-state-icon" aria-hidden="true">
          <Trash2 size={32} />
        </div>
        <div className="empty-state-content">
          <h3>Trash is empty</h3>
          <p>Notes you delete will be placed here temporarily before permanent removal.</p>
        </div>
      </div>
    );
  }

  if (activeFilter === 'favorites') {
    return (
      <div className="empty-state-card" role="status">
        <div className="empty-state-icon" aria-hidden="true">
          <Star size={32} />
        </div>
        <div className="empty-state-content">
          <h3>No favorite notes yet</h3>
          <p>Click the star icon on any note card to mark it as a favorite for instant access.</p>
        </div>
      </div>
    );
  }

  if (activeFilter === 'pinned') {
    return (
      <div className="empty-state-card" role="status">
        <div className="empty-state-icon" aria-hidden="true">
          <Pin size={32} />
        </div>
        <div className="empty-state-content">
          <h3>No pinned notes</h3>
          <p>Pin your most important notes or active project roadmaps to keep them locked to the top.</p>
        </div>
      </div>
    );
  }

  if (activeCategory !== 'All') {
    return (
      <div className="empty-state-card" role="status">
        <div className="empty-state-icon" aria-hidden="true">
          <Folder size={32} />
        </div>
        <div className="empty-state-content">
          <h3>No notes in {activeCategory}</h3>
          <p>Create a new note organized under the <strong>{activeCategory}</strong> category.</p>
        </div>
        <button
          type="button"
          onClick={onOpenCreate}
          className="btn-primary"
        >
          <Plus size={16} />
          <span>Add Note to {activeCategory}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="empty-state-card" role="status">
      <div className="empty-state-icon" aria-hidden="true">
        <FileText size={32} />
      </div>
      <div className="empty-state-content">
        <h3>Welcome to NoteFlow</h3>
        <p>
          Your smart workspace for notes, task checklists, and project documentation. Backed by persistent SQLite.
        </p>
      </div>
      <button
        type="button"
        onClick={onOpenCreate}
        className="btn-primary"
        aria-label="Create your first note"
      >
        <Plus size={16} />
        <span>Create Your First Note</span>
      </button>
    </div>
  );
}

export default EmptyState;
