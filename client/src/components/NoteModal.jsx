import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  Trash2,
  Bold,
  Italic,
  Heading2,
  List,
  CheckSquare,
  Code,
  Quote,
  Sparkles,
  Pin,
  Star,
  Tag,
  Loader2,
  Check,
  Copy,
} from 'lucide-react';
import { processWithAI } from '../api/notesApi.js';

const PRESET_CATEGORIES = ['CodeNova', 'Work', 'Study', 'Personal', 'Ideas'];

const PRESET_COLORS = [
  { id: 'default', label: 'Default', bg: 'var(--bg-surface)' },
  { id: 'blue', label: 'Blue', bg: '#2563eb' },
  { id: 'purple', label: 'Purple', bg: '#7c3aed' },
  { id: 'emerald', label: 'Emerald', bg: '#059669' },
  { id: 'amber', label: 'Amber', bg: '#d97706' },
  { id: 'rose', label: 'Rose', bg: '#e11d48' },
];

export function NoteModal({
  isOpen,
  mode = 'create', // 'create' | 'edit'
  initialNote = null,
  onClose,
  onSave,
  onDeleteRequest,
  showToast,
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Personal');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [pinned, setPinned] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [color, setColor] = useState('default');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // AI Assistant States
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState('');
  const [aiNotice, setAiNotice] = useState('');

  const titleInputRef = useRef(null);
  const contentInputRef = useRef(null);

  // Initialize data on modal open
  useEffect(() => {
    if (isOpen) {
      if (initialNote) {
        setTitle(initialNote.title || '');
        setContent(initialNote.content || '');
        setCategory(initialNote.category || 'Personal');
        setTags(Array.isArray(initialNote.tags) ? initialNote.tags : []);
        setPinned(Boolean(initialNote.pinned));
        setFavorite(Boolean(initialNote.favorite));
        setColor(initialNote.color || 'default');
      } else {
        setTitle('');
        setContent('');
        setCategory('Personal');
        setTags([]);
        setPinned(false);
        setFavorite(false);
        setColor('default');
      }
      setTagInput('');
      setValidationErrors({});
      setIsSubmitting(false);
      setShowAiPanel(false);
      setAiOutput('');
      setAiNotice('');

      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialNote]);

  // Keyboard shortcut listener (Esc, Ctrl+Enter)
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
  }, [isOpen, title, content, category, tags, pinned, favorite, color, isSubmitting]);

  if (!isOpen) return null;

  // Insert markdown helper into textarea
  const insertFormatting = (prefix, suffix = '') => {
    const textarea = contentInputRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = content.substring(start, end);
    const replacement = `${prefix}${selection || 'text'}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selection.length || 4));
    }, 0);
  };

  // Tag management
  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const cleaned = tagInput.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (cleaned && !tags.includes(cleaned)) {
        setTags([...tags, cleaned]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // AI Assistant triggers
  const runAiTask = async (task) => {
    if (!content.trim() && !title.trim()) {
      if (showToast) showToast.error('Please write some content first to use the AI Assistant.');
      return;
    }

    setAiLoading(true);
    setAiOutput('');
    setAiNotice('');
    setShowAiPanel(true);

    try {
      const res = await processWithAI({
        task,
        title: title.trim(),
        content: content.trim(),
      });

      if (res && res.success) {
        if (task === 'tags' && Array.isArray(res.data)) {
          const merged = Array.from(new Set([...tags, ...res.data]));
          setTags(merged);
          setAiOutput(`✨ Suggested tags added: ${res.data.join(', ')}`);
        } else {
          setAiOutput(typeof res.data === 'string' ? res.data : JSON.stringify(res.data));
        }
        if (res.notice) setAiNotice(res.notice);
      } else {
        setAiOutput('Could not process with AI. Please try again.');
      }
    } catch (err) {
      setAiOutput(err.message || 'AI request failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAiOutput = (action) => {
    if (!aiOutput) return;
    if (action === 'replace') {
      setContent(aiOutput);
    } else if (action === 'append') {
      setContent(content ? `${content}\n\n${aiOutput}` : aiOutput);
    }
    setAiOutput('');
    setShowAiPanel(false);
  };

  // Validation
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

    if (!validate()) return;

    setIsSubmitting(true);
    const result = await onSave({
      title: title.trim(),
      content: content.trim(),
      category,
      tags,
      pinned,
      favorite,
      color,
    });

    setIsSubmitting(false);
    if (result && result.success) {
      onClose();
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  const isEditing = mode === 'edit';

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        className="modal-dialog modal-large"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title-heading"
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <h2 id="modal-title-heading">{isEditing ? 'Edit Note' : 'Create New Note'}</h2>
            <div className="modal-header-toggles">
              <button
                type="button"
                onClick={() => setPinned(!pinned)}
                className={`modal-toggle-chip ${pinned ? 'active' : ''}`}
                title={pinned ? 'Unpin' : 'Pin note to top'}
                aria-pressed={pinned}
              >
                <Pin size={13} fill={pinned ? 'currentColor' : 'none'} />
                <span>{pinned ? 'Pinned' : 'Pin'}</span>
              </button>
              <button
                type="button"
                onClick={() => setFavorite(!favorite)}
                className={`modal-toggle-chip ${favorite ? 'active-star' : ''}`}
                title={favorite ? 'Favorited' : 'Add to Favorites'}
                aria-pressed={favorite}
              >
                <Star size={13} fill={favorite ? 'currentColor' : 'none'} />
                <span>{favorite ? 'Starred' : 'Star'}</span>
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close modal dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="modal-form-wrap">
          <div className="modal-body">
            {/* Row 1: Title input */}
            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="note-title-input" className="form-label">
                  Title *
                </label>
                <span className="form-counter">{title.length}/255</span>
              </div>
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
                placeholder="Give your note a clear, memorable title..."
                className={`form-input ${validationErrors.title ? 'has-error' : ''}`}
                required
              />
              {validationErrors.title && (
                <span className="form-error-msg">{validationErrors.title}</span>
              )}
            </div>

            {/* Row 2: Category, Color, and Tags Controls */}
            <div className="note-controls-grid">
              {/* Category Dropdown */}
              <div className="control-item">
                <label className="control-label">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="control-select"
                >
                  {PRESET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color Selector */}
              <div className="control-item">
                <label className="control-label">Card Accent</label>
                <div className="color-swatches" role="radiogroup" aria-label="Note card accent color">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColor(c.id)}
                      className={`color-swatch-btn ${color === c.id ? 'active' : ''}`}
                      title={c.label}
                      aria-label={`Color: ${c.label}`}
                      aria-checked={color === c.id}
                      role="radio"
                    >
                      <span
                        className="color-swatch-dot"
                        style={{
                          backgroundColor: c.id === 'default' ? 'var(--border-default)' : c.bg,
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags Input */}
              <div className="control-item tags-control">
                <label className="control-label">
                  <Tag size={12} />
                  <span>Tags (Enter to add)</span>
                </label>
                <div className="tags-input-box">
                  {tags.map((tag) => (
                    <span key={tag} className="tag-pill">
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="tag-remove-btn"
                        aria-label={`Remove tag ${tag}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder={tags.length === 0 ? "e.g. internship, ideas..." : "+ tag"}
                    className="tag-bare-input"
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Markdown Formatting Toolbar & AI Assistant trigger */}
            <div className="editor-toolbar">
              <div className="formatting-buttons">
                <button
                  type="button"
                  onClick={() => insertFormatting('**', '**')}
                  className="toolbar-btn"
                  title="Bold (Ctrl+B)"
                  aria-label="Format Bold"
                >
                  <Bold size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('*', '*')}
                  className="toolbar-btn"
                  title="Italic"
                  aria-label="Format Italic"
                >
                  <Italic size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('### ')}
                  className="toolbar-btn"
                  title="Heading 3"
                  aria-label="Format Heading"
                >
                  <Heading2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('- ')}
                  className="toolbar-btn"
                  title="Bullet List"
                  aria-label="Format Bullet list"
                >
                  <List size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('[ ] ')}
                  className="toolbar-btn"
                  title="Task Checklist Item"
                  aria-label="Format Checklist Item"
                >
                  <CheckSquare size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('```\n', '\n```')}
                  className="toolbar-btn"
                  title="Code Block"
                  aria-label="Format Code Block"
                >
                  <Code size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('> ')}
                  className="toolbar-btn"
                  title="Blockquote"
                  aria-label="Format Quote"
                >
                  <Quote size={14} />
                </button>
              </div>

              {/* AI Superpowers trigger */}
              <div className="ai-toolbar-group">
                <button
                  type="button"
                  onClick={() => setShowAiPanel(!showAiPanel)}
                  className={`ai-trigger-btn ${showAiPanel ? 'active' : ''}`}
                >
                  <Sparkles size={14} />
                  <span>AI Assistant</span>
                </button>
              </div>
            </div>

            {/* Expandable AI Assistant Drawer */}
            {showAiPanel && (
              <div className="ai-assistant-drawer">
                <div className="ai-drawer-header">
                  <div className="ai-drawer-title">
                    <Sparkles size={14} className="sparkle-icon" />
                    <strong>NoteFlow AI Superpowers</strong>
                  </div>
                  <div className="ai-quick-pills">
                    <button
                      type="button"
                      onClick={() => runAiTask('summarize')}
                      disabled={aiLoading}
                      className="ai-pill-btn"
                    >
                      ⚡ Summarize
                    </button>
                    <button
                      type="button"
                      onClick={() => runAiTask('checklist')}
                      disabled={aiLoading}
                      className="ai-pill-btn"
                    >
                      📋 Extract Checklist
                    </button>
                    <button
                      type="button"
                      onClick={() => runAiTask('tags')}
                      disabled={aiLoading}
                      className="ai-pill-btn"
                    >
                      🏷️ Suggest Tags
                    </button>
                    <button
                      type="button"
                      onClick={() => runAiTask('simplify')}
                      disabled={aiLoading}
                      className="ai-pill-btn"
                    >
                      🪄 Simplify
                    </button>
                    <button
                      type="button"
                      onClick={() => runAiTask('expand')}
                      disabled={aiLoading}
                      className="ai-pill-btn"
                    >
                      ✍️ Expand
                    </button>
                  </div>
                </div>

                {aiLoading && (
                  <div className="ai-loading-state">
                    <Loader2 size={18} className="spinner" />
                    <span>Gemini AI is analyzing and generating response...</span>
                  </div>
                )}

                {aiOutput && !aiLoading && (
                  <div className="ai-output-box">
                    <div className="ai-output-text">{aiOutput}</div>
                    <div className="ai-output-actions">
                      <button
                        type="button"
                        onClick={() => handleApplyAiOutput('append')}
                        className="btn-ai-apply"
                      >
                        <Check size={14} />
                        <span>Insert at Bottom</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyAiOutput('replace')}
                        className="btn-ai-apply secondary"
                      >
                        <span>Replace Content</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(aiOutput);
                          if (showToast) showToast.success('Copied AI response to clipboard');
                        }}
                        className="btn-ai-apply icon-only"
                        title="Copy to clipboard"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                )}

                {aiNotice && <div className="ai-notice-hint">{aiNotice}</div>}
              </div>
            )}

            {/* Row 4: Content Textarea */}
            <div className="form-group content-form-group">
              <textarea
                id="note-content-input"
                ref={contentInputRef}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (validationErrors.content) {
                    setValidationErrors((prev) => ({ ...prev, content: null }));
                  }
                }}
                placeholder="Write your note here using Markdown or checklists [ ]..."
                className={`form-textarea ${validationErrors.content ? 'has-error' : ''}`}
                rows={11}
                required
              />
              {validationErrors.content && (
                <span className="form-error-msg">{validationErrors.content}</span>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <div className="modal-footer-stats">
              <span>{wordCount} words</span>
              <span className="dot">·</span>
              <span>{content.length} characters</span>
              <span className="dot">·</span>
              <span className="kbd-hint">Ctrl+Enter to save</span>
            </div>

            <div className="modal-footer-actions">
              {isEditing && onDeleteRequest && (
                <button
                  type="button"
                  onClick={() => onDeleteRequest(initialNote)}
                  className="btn-secondary danger"
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
