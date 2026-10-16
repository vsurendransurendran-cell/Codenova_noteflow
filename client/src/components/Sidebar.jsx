import React, { useState } from 'react';
import {
  FileText,
  Pin,
  Star,
  Trash2,
  Folder,
  Plus,
  BookOpen,
  X,
  Sparkles,
  Command,
} from 'lucide-react';

const DEFAULT_CATEGORIES = [
  { name: 'CodeNova', color: '#2563eb' },
  { name: 'Work', color: '#7c3aed' },
  { name: 'Study', color: '#059669' },
  { name: 'Personal', color: '#d97706' },
  { name: 'Ideas', color: '#e11d48' },
];

export function Sidebar({
  isOpen,
  onClose,
  stats,
  activeFilter,
  setActiveFilter,
  activeCategory,
  setActiveCategory,
  onOpenCreate,
  onOpenShortcuts,
}) {
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [customCategories, setCustomCategories] = useState(() => {
    try {
      const stored = localStorage.getItem('noteflow_custom_categories');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

  const handleAddCategory = (e) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (!allCategories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...customCategories, { name: trimmed, color: '#6366f1' }];
      setCustomCategories(updated);
      try {
        localStorage.setItem('noteflow_custom_categories', JSON.stringify(updated));
      } catch {
        // Ignore
      }
    }
    setActiveCategory(trimmed);
    setNewCatName('');
    setIsAddingCategory(false);
  };

  const handleNavClick = (filterType) => {
    setActiveFilter(filterType);
    if (onClose) onClose();
  };

  const handleCategoryClick = (categoryName) => {
    setActiveCategory(categoryName);
    if (activeFilter === 'trash') {
      setActiveFilter('all');
    }
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`sidebar-backdrop ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand & Close button */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">
              <BookOpen size={20} />
            </div>
            <div>
              <div className="sidebar-brand-title">
                NoteFlow
                <span className="sidebar-brand-badge">CodeNova</span>
              </div>
              <div className="sidebar-brand-subtitle">Smart Note Management</div>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-close-mobile-btn"
            onClick={onClose}
            aria-label="Close sidebar navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Primary Action Button */}
        <div className="sidebar-cta-wrap">
          <button
            type="button"
            onClick={() => {
              onOpenCreate();
              if (onClose) onClose();
            }}
            className="sidebar-new-note-btn"
          >
            <Plus size={18} />
            <span>New Note</span>
            <kbd className="sidebar-kbd">Ctrl+N</kbd>
          </button>
        </div>

        {/* Views Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Views</div>
          <button
            type="button"
            onClick={() => handleNavClick('all')}
            className={`sidebar-nav-item ${activeFilter === 'all' && activeCategory === 'All' ? 'active' : ''}`}
          >
            <FileText size={17} />
            <span>All Notes</span>
            <span className="sidebar-nav-badge">{stats.total}</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('pinned')}
            className={`sidebar-nav-item ${activeFilter === 'pinned' ? 'active' : ''}`}
          >
            <Pin size={17} />
            <span>Pinned</span>
            <span className="sidebar-nav-badge">{stats.pinned}</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('favorites')}
            className={`sidebar-nav-item ${activeFilter === 'favorites' ? 'active' : ''}`}
          >
            <Star size={17} />
            <span>Favorites</span>
            <span className="sidebar-nav-badge">{stats.favorites}</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('trash')}
            className={`sidebar-nav-item trash-item ${activeFilter === 'trash' ? 'active' : ''}`}
          >
            <Trash2 size={17} />
            <span>Trash Bin</span>
            {stats.trash > 0 && <span className="sidebar-nav-badge danger">{stats.trash}</span>}
          </button>

          {/* Categories Section */}
          <div className="sidebar-section-header">
            <span className="sidebar-section-title">Categories</span>
            <button
              type="button"
              onClick={() => setIsAddingCategory(!isAddingCategory)}
              className="sidebar-add-cat-btn"
              title="Add Category"
              aria-label="Add new category"
            >
              <Plus size={14} />
            </button>
          </div>

          {isAddingCategory && (
            <form onSubmit={handleAddCategory} className="sidebar-cat-form">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Category name..."
                className="sidebar-cat-input"
                autoFocus
              />
              <button type="submit" className="sidebar-cat-submit-btn">
                Add
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={() => handleCategoryClick('All')}
            className={`sidebar-nav-item ${activeCategory === 'All' && activeFilter !== 'trash' ? 'active' : ''}`}
          >
            <Folder size={16} />
            <span>All Categories</span>
          </button>

          {allCategories.map((cat) => {
            const count = stats.categories[cat.name] || 0;
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => handleCategoryClick(cat.name)}
                className={`sidebar-nav-item ${activeCategory === cat.name && activeFilter !== 'trash' ? 'active' : ''}`}
              >
                <span
                  className="sidebar-cat-dot"
                  style={{ backgroundColor: cat.color }}
                  aria-hidden="true"
                />
                <span className="sidebar-cat-name">{cat.name}</span>
                {count > 0 && <span className="sidebar-nav-badge">{count}</span>}
              </button>
            );
          })}
        </nav>

        {/* Productivity Dashboard Widget in Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-stats-card">
            <div className="sidebar-stats-title">
              <Sparkles size={14} className="sidebar-stats-icon" />
              <span>Productivity Pulse</span>
            </div>
            <div className="sidebar-stats-grid">
              <div className="stat-box">
                <span className="stat-num">{stats.total}</span>
                <span className="stat-label">Active</span>
              </div>
              <div className="stat-box">
                <span className="stat-num">{stats.pinned}</span>
                <span className="stat-label">Pinned</span>
              </div>
              <div className="stat-box">
                <span className="stat-num">{stats.favorites}</span>
                <span className="stat-label">Starred</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenShortcuts}
            className="sidebar-shortcuts-btn"
          >
            <Command size={14} />
            <span>Keyboard Shortcuts</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
