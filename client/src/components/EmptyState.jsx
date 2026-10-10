import React from 'react';
import { FileText, SearchX, Plus, RefreshCw } from 'lucide-react';

/**
 * Empty state component with contextual prompts
 */
export function EmptyState({ searchQuery, onClearSearch, onOpenCreate }) {
  if (searchQuery) {
    return (
      <div className="empty-state-card" role="status">
        <div className="empty-state-icon" aria-hidden="true">
          <SearchX size={28} />
        </div>
        <div className="empty-state-content">
          <h3>No matching notes found</h3>
          <p>
            No notes matched <strong>"{searchQuery}"</strong>. Try checking for typos or searching a different keyword.
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

  return (
    <div className="empty-state-card" role="status">
      <div className="empty-state-icon" aria-hidden="true">
        <FileText size={28} />
      </div>
      <div className="empty-state-content">
        <h3>Your notebook is empty</h3>
        <p>
          Capture your thoughts, code snippets, project ideas, and tasks. Notes are stored securely in SQLite.
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
