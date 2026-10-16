import React from 'react';
import {
  Menu,
  Plus,
  LayoutGrid,
  List,
  Sun,
  Moon,
  ArrowUpDown,
  Download,
  Search,
  X,
} from 'lucide-react';

export function Header({
  onToggleSidebar,
  searchQuery,
  onSearchChange,
  onClearSearch,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  isDarkMode,
  onToggleDarkMode,
  onOpenCreate,
  onOpenImportExport,
  totalNotes,
}) {
  return (
    <header className="main-header">
      <div className="main-header-row">
        {/* Left: Hamburger menu for mobile/drawer */}
        <div className="header-left">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="header-icon-btn mobile-menu-btn"
            aria-label="Toggle navigation menu"
          >
            <Menu size={20} />
          </button>

          {/* Search bar integrated right into header */}
          <div className="header-search-wrap">
            <Search size={16} className="header-search-icon" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search notes by title, content, or #tag... (Ctrl+K)"
              className="header-search-input"
              aria-label="Search notes"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={onClearSearch}
                className="header-search-clear"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
            <kbd className="header-search-kbd">⌘K</kbd>
          </div>
        </div>

        {/* Right: Controls & Actions */}
        <div className="header-right">
          {/* Sort Dropdown */}
          <div className="sort-select-wrap">
            <ArrowUpDown size={14} className="sort-icon" aria-hidden="true" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="sort-select"
              aria-label="Sort notes"
            >
              <option value="updated_desc">Recently Updated</option>
              <option value="updated_asc">Oldest Updated</option>
              <option value="created_desc">Newest Created</option>
              <option value="created_asc">Oldest Created</option>
              <option value="title_asc">Title (A - Z)</option>
              <option value="title_desc">Title (Z - A)</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="segmented-toggle" role="group" aria-label="Layout view mode">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              aria-pressed={viewMode === 'grid'}
              title="Grid View"
              aria-label="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              aria-pressed={viewMode === 'list'}
              title="List View"
              aria-label="List View"
            >
              <List size={15} />
            </button>
          </div>

          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="header-icon-btn"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle dark mode theme"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Import / Export */}
          <button
            type="button"
            onClick={onOpenImportExport}
            className="header-icon-btn"
            title="Import or Export Notes (JSON/Markdown)"
            aria-label="Import or Export Notes"
          >
            <Download size={18} />
          </button>

          {/* Create New Note Button */}
          <button
            type="button"
            onClick={onOpenCreate}
            className="btn-primary header-new-btn"
            aria-label="Create new note"
          >
            <Plus size={16} />
            <span className="btn-text">New Note</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
