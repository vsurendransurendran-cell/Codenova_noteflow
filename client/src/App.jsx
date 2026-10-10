import React, { useState, useMemo } from 'react';
import { useToast } from './hooks/useToast.js';
import { useNotes } from './hooks/useNotes.js';
import { setSimulatedServerDown, getSimulatedServerDown } from './api/notesApi.js';
import { Header } from './components/Header.jsx';
import { SearchBar } from './components/SearchBar.jsx';
import { NoteList } from './components/NoteList.jsx';
import { NoteModal } from './components/NoteModal.jsx';
import { DeleteConfirmModal } from './components/DeleteConfirmModal.jsx';
import { EmptyState } from './components/EmptyState.jsx';
import { LoadingSkeleton } from './components/LoadingSkeleton.jsx';
import { ToastContainer } from './components/ToastContainer.jsx';
import { AlertCircle, RefreshCw } from 'lucide-react';
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
    loading,
    error,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    refetch,
    createNote,
    updateNote,
    deleteNote,
  } = useNotes({ showToast: toastHelpers });

  // Modal States
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'create', // 'create' | 'edit'
    note: null,
  });

  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    note: null,
  });

  // Simulated server down state for testing
  const [isSimulatedDown, setIsSimulatedDown] = useState(getSimulatedServerDown());

  const handleToggleSimulatedDown = () => {
    const nextState = !isSimulatedDown;
    setIsSimulatedDown(nextState);
    setSimulatedServerDown(nextState);

    if (nextState) {
      showNetworkError(
        'Backend connection severed (Simulation). API requests will now fail to verify toast handling.',
        'Simulated Outage Active'
      );
    } else {
      showSuccess('Backend connection restored.', 'Connection Restored');
      refetch();
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalState({
      isOpen: true,
      mode: 'create',
      note: null,
    });
  };

  // Open Edit Modal
  const handleOpenEdit = (note) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      note,
    });
  };

  // Open Delete Confirmation Modal
  const handleOpenDelete = (note) => {
    setDeleteModalState({
      isOpen: true,
      note,
    });
  };

  // Close Editor Modal
  const handleCloseModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  // Close Delete Confirmation Modal
  const handleCloseDeleteModal = () => {
    setDeleteModalState({ isOpen: false, note: null });
  };

  // Save (Create or Update)
  const handleSaveNote = async (noteData) => {
    if (modalState.mode === 'create') {
      return await createNote(noteData);
    } else if (modalState.mode === 'edit' && modalState.note) {
      return await updateNote(modalState.note.id, noteData);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async (id, title) => {
    await deleteNote(id, title);
    // If the currently edited note was deleted, close modal
    if (modalState.note?.id === id) {
      handleCloseModal();
    }
  };

  return (
    <div className="app-container">
      <Header
        totalNotes={notes.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenCreate={handleOpenCreate}
        isSimulatedDown={isSimulatedDown}
        onToggleSimulatedDown={handleToggleSimulatedDown}
      />

      <main>
        {/* Search Toolbar */}
        <section className="toolbar-section" style={{ marginBottom: 'var(--space-6)' }}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
            totalNotes={notes.length}
          />
        </section>

        {/* Persistent Server Error State Banner */}
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
              style={{ backgroundColor: '#ffffff', borderColor: '#fca5a5' }}
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Content Views: Loading Skeleton vs Notes List vs Empty State */}
        {loading && notes.length === 0 ? (
          <LoadingSkeleton count={6} viewMode={viewMode} />
        ) : notes.length > 0 ? (
          <NoteList
            notes={notes}
            viewMode={viewMode}
            searchQuery={searchQuery}
            onSelectNote={handleOpenEdit}
            onEditNote={handleOpenEdit}
            onDeleteNote={handleOpenDelete}
          />
        ) : (
          <EmptyState
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
            onOpenCreate={handleOpenCreate}
          />
        )}
      </main>

      {/* Compose / Edit Note Modal */}
      <NoteModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        initialNote={modalState.note}
        onClose={handleCloseModal}
        onSave={handleSaveNote}
        onDeleteRequest={(note) => {
          handleCloseModal();
          handleOpenDelete(note);
        }}
      />

      {/* Accessible Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        note={deleteModalState.note}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
      />

      {/* Accessible ARIA Live Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default App;
