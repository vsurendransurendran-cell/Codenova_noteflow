import React from 'react';
import { X, Command } from 'lucide-react';

export function KeyboardShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { keys: ['Ctrl', 'N'], desc: 'Create a new note' },
    { keys: ['Ctrl', 'K'], desc: 'Focus smart search bar' },
    { keys: ['Ctrl', 'Enter'], desc: 'Save note in editor' },
    { keys: ['Esc'], desc: 'Close open modal or dialog' },
    { keys: ['Enter'], desc: 'Open selected note' },
  ];

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        className="modal-dialog modal-small"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
      >
        <div className="modal-header">
          <div className="modal-header-left">
            <Command size={18} className="sidebar-stats-icon" />
            <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="shortcuts-list">
            {shortcuts.map((s, idx) => (
              <div key={idx} className="shortcut-row">
                <span className="shortcut-desc">{s.desc}</span>
                <div className="shortcut-keys">
                  {s.keys.map((k, kIdx) => (
                    <React.Fragment key={kIdx}>
                      <kbd className="kbd-badge">{k}</kbd>
                      {kIdx < s.keys.length - 1 && <span className="key-plus">+</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} className="btn-secondary">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export default KeyboardShortcutsModal;
