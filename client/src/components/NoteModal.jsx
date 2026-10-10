import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Trash2, Clock } from 'lucide-react';

/**
 * Accessible Modal for Creating, Viewing, and Editing Notes
 */
export function NoteModal({
  isOpen,
  mode = 'create', // 'create' | 'edit' | 'view'
  initialNote = null,
  onClose,
  onSave,
  onDeleteRequest,
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const titleInputRef = useRef(null);
  const modalBoxRef = useRef(null);

  // Populate data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialNote) {
        setTitle(initialNote.title || '');
        setContent(initialNote.content || '');
      } else {
        setTitle('');
        setContent('');
      }
      setValidationErrors({});
      setIsSubmitting(false);

      // Focus title input on opening
      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialNote]);

  // Handle keyboard shortcuts (Esc to close, Ctrl+Enter to save)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, title, content, isSubmitting]);

  if (!isOpen) return null;

  const validate = () => {
    const errors = {};
    if (!title.trim()) {
      errors.title = 'Title is required.';
    } else if (title.trim().length > 255) {
      errors.title = 'Title cannot exceed 255 characters.';
    }

    if (!content.trim()) {
      errors.content = 'Content is required.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (isSubmitting) return;

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    const result = await onSave({
      title: title.trim(),
      content: content.trim(),
    });

    setIsSubmitting(false);
    if (result && result.success) {
      onClose();
    }
  };

  const isEditing = mode === 'edit';
  const modalTitle = isEditing ? 'Edit Note' : 'Create New Note';

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        ref={modalBoxRef}
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title-heading"
      >
        <div className="modal-header">
          <h2 id="modal-title-heading">{modalTitle}</h2>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close modal dialog"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="modal-body">
            {/* Title field */}
            <div className="form-group">
              <label htmlFor="note-title-input" className="form-label">
                <span>Title *</span>
                <span className="form-counter">{title.length}/255</span>
              </label>
              <input
                id="note-title-input"
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (validationErrors.title) {
                    setValidationErrors((prev) => ({ ...prev, title: null }));
                  }
                }}
                maxLength={255}
                placeholder="Give your note a concise title..."
                className={`form-input ${validationErrors.title ? 'has-error' : ''}`}
                aria-invalid={!!validationErrors.title}
                aria-describedby={validationErrors.title ? 'title-error-msg' : undefined}
                required
              />
              {validationErrors.title && (
                <span id="title-error-msg" className="form-error-msg">
                  {validationErrors.title}
                </span>
              )}
            </div>

            {/* Content field */}
            <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label htmlFor="note-content-input" className="form-label">
                <span>Content *</span>
                <span className="form-counter">
                  {content.length} {content.length === 1 ? 'char' : 'chars'}
                </span>
              </label>
              <textarea
                id="note-content-input"
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (validationErrors.content) {
                    setValidationErrors((prev) => ({ ...prev, content: null }));
                  }
                }}
                placeholder="Write your note here..."
                className={`form-textarea ${validationErrors.content ? 'has-error' : ''}`}
                aria-invalid={!!validationErrors.content}
                aria-describedby={validationErrors.content ? 'content-error-msg' : undefined}
                rows={8}
                required
              />
              {validationErrors.content && (
                <span id="content-error-msg" className="form-error-msg">
                  {validationErrors.content}
                </span>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <span className="modal-footer-hint">
              Press <kbd className="kbd-badge">Ctrl+Enter</kbd> to save
            </span>

            <div className="modal-footer-actions">
              {isEditing && onDeleteRequest && (
                <button
                  type="button"
                  onClick={() => onDeleteRequest(initialNote)}
                  className="btn-secondary"
                  style={{ color: 'var(--color-danger)' }}
                  aria-label="Delete this note"
                >
                  <Trash2 size={15} />
                  <span>Delete</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
              >
                <Save size={15} />
                <span>{isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Note'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NoteModal;
