import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

/**
 * Accessible confirmation modal for deleting a note
 */
export function DeleteConfirmModal({
  isOpen,
  note,
  onClose,
  onConfirm,
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsDeleting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !note) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    await onConfirm(note.id, note.title);
    setIsDeleting(false);
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        className="modal-dialog confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-desc"
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-danger)' }}>
            <AlertTriangle size={20} aria-hidden="true" />
            <h2 id="delete-dialog-title" style={{ fontSize: '1rem' }}>Delete Note</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Cancel deletion"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: 'var(--space-5) var(--space-6)' }}>
          <p id="delete-dialog-desc" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Are you sure you want to permanently delete <strong>"{note.title}"</strong>? This action cannot be undone.
          </p>
        </div>

        <div className="modal-footer">
          <div className="modal-footer-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="btn-danger"
              disabled={isDeleting}
              autoFocus
            >
              <Trash2 size={15} />
              <span>{isDeleting ? 'Deleting...' : 'Delete Note'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;
