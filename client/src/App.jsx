import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from './hooks/useToast.js';
import { useNotes } from './hooks/useNotes.js';
import { Sidebar } from './components/Sidebar.jsx';
import { Header } from './components/Header.jsx';
import { NoteList } from './components/NoteList.jsx';
import { NoteModal } from './components/NoteModal.jsx';
import { DeleteConfirmModal } from './components/DeleteConfirmModal.jsx';
import { ImportExportModal } from './components/ImportExportModal.jsx';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal.jsx';
import { EmptyState } from './components/EmptyState.jsx';
import { LoadingSkeleton } from './components/LoadingSkeleton.jsx';
import { ToastContainer } from './components/ToastContainer.jsx';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import './styles/main.css';

export function App() {
  const { toasts, removeToast, showSuccess, showError, showNetworkError } = useToast();

  const toastHelpers = useMemo(() => ({
    success: showSuccess,
    error: showError,
    network: showNetworkError,
  }), [showSuccess, showError, showNetworkError]);

  const {
    notes,
    stats,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    activeCategory,
    setActiveCategory,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    refetch,
    createNote,
    updateNote,
    togglePin,
    toggleFavorite,
    moveToTrash,
    restoreNote,
    permanentDeleteNote,
    emptyTrash,
    duplicateNote,
    bulkImport,
    exportAll,
  } = useNotes({ showToast: toastHelpers });

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('noteflow_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.setAttribute('data-theme', 'dark');
      try { localStorage.setItem('noteflow_theme', 'dark'); } catch {}
    } else {
      root.removeAttribute('data-theme');
      try { localStorage.setItem('noteflow_theme', 'light'); } catch {}
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  // Sidebar mobile toggle
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'create', // 'create' | 'edit'
    note: null,
  });

  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    note: null,
    isBulkTrash: false,
  });

  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Global Keyboard Shortcuts (Ctrl/Cmd + N, Ctrl/Cmd + K, ?)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Don't trigger if user is actively typing in an input/textarea and it's not a cmd shortcut
      const activeEl = document.activeElement;
      const isInputFocused = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('.header-search-input');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleOpenCreate();
      } else if (e.key === '?' && !isInputFocused) {
        e.preventDefault();
        setIsShortcutsOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Modal Handlers
  const handleOpenCreate = () => {
    setModalState({
      isOpen: true,
      mode: 'create',
      note: null,
    });
  };

  const handleOpenEdit = (note) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      note,
    });
  };

  const handleCloseModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleSaveNote = async (noteData) => {
    if (modalState.mode === 'create') {
      return await createNote(noteData);
    } else if (modalState.mode === 'edit' && modalState.note) {
      return await updateNote(modalState.note.id, noteData);
    }
  };

  const handleOpenDelete = (note) => {
    setDeleteModalState({
      isOpen: true,
      note,
      isBulkTrash: false,
    });
  };

  const handleOpenEmptyTrash = () => {
    setDeleteModalState({
      isOpen: true,
      note: null,
      isBulkTrash: true,
    });
  };

  const handleConfirmDelete = async () => {
    if (deleteModalState.isBulkTrash) {
      await emptyTrash();
    } else if (deleteModalState.note) {
      await permanentDeleteNote(deleteModalState.note.id, deleteModalState.note.title);
      if (modalState.note?.id === deleteModalState.note.id) {
        handleCloseModal();
      }
    }
  };

  // Status view title
  const viewTitle = useMemo(() => {
    if (activeFilter === 'trash') return 'Trash Bin';
    if (activeFilter === 'pinned') return 'Pinned Notes';
    if (activeFilter === 'favorites') return 'Starred Favorites';
    if (activeCategory !== 'All') return `${activeCategory} Notes`;
    return 'All Notes';
  }, [activeFilter, activeCategory]);

  return (
    <div className="noteflow-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        stats={stats}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        onOpenCreate={handleOpenCreate}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Main App Content Area */}
      <div className="noteflow-main">
        {/* Top Header Bar */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearSearch={() => setSearchQuery('')}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortBy={sortBy}
          onSortChange={setSortBy}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          onOpenCreate={handleOpenCreate}
          onOpenImportExport={() => setIsImportExportOpen(true)}
          totalNotes={stats.total}
        />

        {/* Dashboard Content Container */}
        <main className="dashboard-content">
          {/* Welcome & Filter Status Banner */}
          <div className="dashboard-banner">
            <div>
              <h1 className="dashboard-title">{viewTitle}</h1>
              <p className="dashboard-subtitle">
                {activeFilter === 'trash'
                  ? `${stats.trash} trashed note${stats.trash === 1 ? '' : 's'}`
                  : `${notes.length} note${notes.length === 1 ? '' : 's'} in view · ${stats.total} total stored`}
              </p>
            </div>

            {/* Active filter chips */}
            {(activeCategory !== 'All' || activeFilter !== 'all' || searchQuery) && (
              <div className="active-filters-row">
                {activeCategory !== 'All' && (
                  <span className="filter-chip">
                    Category: {activeCategory}
                    <button
                      type="button"
                      onClick={() => setActiveCategory('All')}
                      aria-label="Remove category filter"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                {activeFilter !== 'all' && (
                  <span className="filter-chip">
                    Filter: {activeFilter}
                    <button
                      type="button"
                      onClick={() => setActiveFilter('all')}
                      aria-label="Remove filter"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="filter-chip">
                    Search: "{searchQuery}"
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search query"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Server Error State */}
          {error && (
            <div className="error-state-box" role="alert">
              <div className="error-state-message">
                <AlertCircle size={20} aria-hidden="true" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => refetch()}
                className="btn-secondary"
              >
                <RefreshCw size={14} />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Notes List / Skeleton / Empty state */}
          {loading && notes.length === 0 ? (
            <LoadingSkeleton count={6} viewMode={viewMode} />
          ) : notes.length > 0 ? (
            <NoteList
              notes={notes}
              viewMode={viewMode}
              searchQuery={searchQuery}
              isTrashMode={activeFilter === 'trash'}
              onSelectNote={handleOpenEdit}
              onEditNote={handleOpenEdit}
              onTogglePin={togglePin}
              onToggleFavorite={toggleFavorite}
              onMoveToTrash={moveToTrash}
              onRestoreNote={restoreNote}
              onPermanentDeleteNote={handleOpenDelete}
              onDuplicateNote={duplicateNote}
              onEmptyTrash={handleOpenEmptyTrash}
            />
          ) : (
            <EmptyState
              searchQuery={searchQuery}
              activeFilter={activeFilter}
              activeCategory={activeCategory}
              onClearSearch={() => setSearchQuery('')}
              onOpenCreate={handleOpenCreate}
            />
          )}
        </main>
      </div>

      {/* Note Editor Modal */}
      <NoteModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        initialNote={modalState.note}
        onClose={handleCloseModal}
        onSave={handleSaveNote}
        onDeleteRequest={(note) => {
          handleCloseModal();
          moveToTrash(note);
        }}
        showToast={toastHelpers}
      />

      {/* Delete / Empty Trash Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        note={deleteModalState.note}
        isBulkTrash={deleteModalState.isBulkTrash}
        onClose={() => setDeleteModalState({ isOpen: false, note: null, isBulkTrash: false })}
        onConfirm={handleConfirmDelete}
      />

      {/* Import / Export Modal */}
      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        totalNotes={stats.total}
        onExportAll={exportAll}
        onBulkImport={bulkImport}
        showToast={toastHelpers}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* ARIA Live Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default App;
