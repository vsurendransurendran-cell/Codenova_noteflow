import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchNotes, createNote as apiCreateNote, updateNote as apiUpdateNote, deleteNote as apiDeleteNote } from '../api/notesApi.js';
import { useDebounce } from './useDebounce.js';

/**
 * Custom hook managing Notes state, debounced server search, and database reconciliation
 */
export function useNotes({ showToast }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    // Preserve view preference in localStorage if available
    try {
      return localStorage.getItem('notes_view_mode') || 'grid';
    } catch {
      return 'grid';
    }
  });

  const debouncedQuery = useDebounce(searchQuery, 250);
  const initialFetchDone = useRef(false);

  // Sync viewMode to localStorage
  const handleSetViewMode = useCallback((mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('notes_view_mode', mode);
    } catch {
      // Ignore
    }
  }, []);

  /**
   * Refetch notes from backend
   */
  const loadNotes = useCallback(async (query = debouncedQuery, isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await fetchNotes(query);
      setNotes(data);
      return data;
    } catch (err) {
      console.error('[useNotes] Error loading notes:', err);
      setError(err.message || 'Failed to load notes');
      
      if (showToast) {
        if (err.isNetworkError) {
          showToast.network(err.message, 'Server Unreachable');
        } else {
          showToast.error(err.message, 'Failed to Load Notes');
        }
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, showToast]);

  // Load notes whenever debounced search query changes
  useEffect(() => {
    loadNotes(debouncedQuery);
    initialFetchDone.current = true;
  }, [debouncedQuery, loadNotes]);

  /**
   * Create Note and reconcile with database
   */
  const createNote = useCallback(async (noteData) => {
    try {
      const newNote = await apiCreateNote(noteData);
      // Reconcile database state immediately
      await loadNotes(debouncedQuery, true);
      
      if (showToast) {
        showToast.success(`Note "${newNote.title}" created successfully.`);
      }
      return { success: true, note: newNote };
    } catch (err) {
      console.error('[useNotes] Create note error:', err);
      if (showToast) {
        if (err.isNetworkError) {
          showToast.network(err.message, 'Network Failure');
        } else {
          showToast.error(err.message, 'Failed to Create Note');
        }
      }
      return { success: false, error: err };
    }
  }, [debouncedQuery, loadNotes, showToast]);

  /**
   * Update Note and reconcile with database
   */
  const updateNote = useCallback(async (id, noteData) => {
    try {
      const updated = await apiUpdateNote(id, noteData);
      // Reconcile database state immediately
      await loadNotes(debouncedQuery, true);

      if (showToast) {
        showToast.success(`Note "${updated.title}" updated.`);
      }
      return { success: true, note: updated };
    } catch (err) {
      console.error('[useNotes] Update note error:', err);
      if (showToast) {
        if (err.isNetworkError) {
          showToast.network(err.message, 'Network Failure');
        } else {
          showToast.error(err.message, 'Failed to Update Note');
        }
      }
      return { success: false, error: err };
    }
  }, [debouncedQuery, loadNotes, showToast]);

  /**
   * Delete Note and reconcile with database
   */
  const deleteNote = useCallback(async (id, noteTitle = '') => {
    try {
      await apiDeleteNote(id);
      // Reconcile database state immediately
      await loadNotes(debouncedQuery, true);

      if (showToast) {
        showToast.success(
          noteTitle ? `Deleted "${noteTitle}".` : 'Note deleted successfully.'
        );
      }
      return { success: true };
    } catch (err) {
      console.error('[useNotes] Delete note error:', err);
      if (showToast) {
        if (err.isNetworkError) {
          showToast.network(err.message, 'Network Failure');
        } else {
          showToast.error(err.message, 'Failed to Delete Note');
        }
      }
      return { success: false, error: err };
    }
  }, [debouncedQuery, loadNotes, showToast]);

  return {
    notes,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode: handleSetViewMode,
    refetch: () => loadNotes(debouncedQuery),
    createNote,
    updateNote,
    deleteNote,
  };
}

export default useNotes;
