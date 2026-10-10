import React from 'react';
import { Plus, LayoutGrid, List, BookOpen, Wifi, WifiOff } from 'lucide-react';

/**
 * Main Application Header
 */
export function Header({
  totalNotes,
  viewMode,
  onViewModeChange,
  onOpenCreate,
  isSimulatedDown,
  onToggleSimulatedDown,
}) {
  return (
    <header className="app-header">
      {/* Top Banner for Server Down Testing */}
      <div className="dev-banner">
        <div className="dev-banner-left">
          {isSimulatedDown ? (
            <WifiOff size={15} style={{ color: 'var(--color-danger)' }} aria-hidden="true" />
          ) : (
            <Wifi size={15} style={{ color: 'var(--color-success)' }} aria-hidden="true" />
          )}
          <span>
            Backend status:{' '}
            <strong>{isSimulatedDown ? 'SIMULATED OFFLINE (Server Down)' : 'ONLINE'}</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={onToggleSimulatedDown}
          className={`dev-toggle-btn ${isSimulatedDown ? 'active' : ''}`}
          aria-pressed={isSimulatedDown}
          title="Toggle simulated backend outage to verify network failure toasts"
        >
          {isSimulatedDown ? 'Restore Backend Connection' : 'Simulate Server Down'}
        </button>
      </div>

      <div className="header-top">
        <div className="brand-wrapper">
          <div className="brand-icon-box" aria-hidden="true">
            <BookOpen size={22} />
          </div>
          <div className="brand-info">
            <h1>Notes Dashboard</h1>
            <div className="brand-meta">
              <span>{totalNotes} {totalNotes === 1 ? 'note' : 'notes'} stored</span>
              <span aria-hidden="true">·</span>
              <span>SQLite Persistent</span>
            </div>
          </div>
        </div>

        <div className="header-actions">
          {/* View Mode Toggle */}
          <div className="segmented-toggle" role="group" aria-label="Layout view mode">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              aria-pressed={viewMode === 'grid'}
              aria-label="Grid layout"
            >
              <LayoutGrid size={15} aria-hidden="true" />
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              aria-pressed={viewMode === 'list'}
              aria-label="List layout"
            >
              <List size={15} aria-hidden="true" />
              <span>List</span>
            </button>
          </div>

          {/* New Note Button */}
          <button
            type="button"
            onClick={onOpenCreate}
            className="btn-primary"
            aria-label="Create new note"
          >
            <Plus size={17} aria-hidden="true" />
            <span>New Note</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
