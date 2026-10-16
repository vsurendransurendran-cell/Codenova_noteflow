import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchNotes,
  fetchNotesStats,
  createNote as apiCreateNote,
  updateNote as apiUpdateNote,
  togglePin as apiTogglePin,
  toggleFavorite as apiToggleFavorite,
  toggleTrash as apiToggleTrash,
  deleteNote as apiDeleteNote,
  emptyTrash as apiEmptyTrash,
  bulkImportNotes as apiBulkImportNotes,
  exportAllNotes as apiExportAllNotes,
} from '../api/notesApi.js';
import { useDebounce } from './useDebounce.js';

/**
 * Custom hook managing NoteFlow state, real-time search, filters, pins, favorites,
 * trash with undo, categories, stats, and bulk import/export.
 */
export function useNotes({ showToast }) {
  const [notes, setNotes] = useState([]);
  const [stats, setStats] = useState({ total: 0, pinned: 0, favorites: 0, trash: 0, categories: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'pinned' | 'favorites' | 'trash'
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState(() => {
    try {
      return localStorage.getItem('noteflow_sort_by') || 'updated_desc';
    } catch {
      return 'updated_desc';
    }
  });

  // View layout (grid vs list)
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('notes_view_mode') || 'grid';
    } catch {
      return 'grid';
    }
  });

  const debouncedQuery = useDebounce(searchQuery, 200);
  const isInitialFetch = useRef(true);

  // Sync sort preference
  const handleSetSortBy = useCallback((newSort) => {
    setSortBy(newSort);
    try {
      localStorage.setItem('noteflow_sort_by', newSort);
    } catch {
      // Ignore
    }
  }, []);

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
   * Refetch notes and overview statistics
   */
  const loadNotes = useCallback(async (isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
    }
    setError(null);

    try {
      const [notesData, statsData] = await Promise.all([
        fetchNotes({
          q: debouncedQuery,
          category: activeCategory,
          filter: activeFilter,
          sortBy,
        }),
        fetchNotesStats(),
      ]);

      setNotes(notesData);
      if (statsData) {
        setStats(statsData);
      }
      return notesData;
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
  }, [debouncedQuery, activeCategory, activeFilter, sortBy, showToast]);

  // Load notes whenever query, category, filter, or sort changes
  useEffect(() => {
    loadNotes(false);
    isInitialFetch.current = false;
  }, [loadNotes]);

  /**
   * Create Note
   */
  const createNote = useCallback(async (noteData) => {
    try {
      const newNote = await apiCreateNote(noteData);
      await loadNotes(true);
      
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
  }, [loadNotes, showToast]);

  /**
   * Update Note
   */
  const updateNote = useCallback(async (id, noteData) => {
    try {
      const updated = await apiUpdateNote(id, noteData);
      await loadNotes(true);

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
  }, [loadNotes, showToast]);

  /**
   * Toggle Pin
   */
  const togglePin = useCallback(async (id, currentTitle = '') => {
    try {
      const result = await apiTogglePin(id);
      await loadNotes(true);

      if (showToast) {
        const isPinned = result?.pinned;
        showToast.success(
          isPinned ? `Pinned "${currentTitle || 'note'}" to top` : `Unpinned "${currentTitle || 'note'}"`
        );
      }
      return { success: true };
    } catch (err) {
      if (showToast) showToast.error(err.message, 'Could not toggle pin');
      return { success: false, error: err };
    }
  }, [loadNotes, showToast]);

  /**
   * Toggle Favorite
   */
  const toggleFavorite = useCallback(async (id, currentTitle = '') => {
    try {
      const result = await apiToggleFavorite(id);
      await loadNotes(true);

      if (showToast) {
        const isFav = result?.favorite;
        showToast.success(
          isFav ? `Added "${currentTitle || 'note'}" to Favorites` : `Removed from Favorites`
        );
      }
      return { success: true };
    } catch (err) {
      if (showToast) showToast.error(err.message, 'Could not toggle favorite');
      return { success: false, error: err };
    }
  }, [loadNotes, showToast]);

  /**
   * Move note to Trash with instant 1-click UNDO!
   */
  const moveToTrash = useCallback(async (note) => {
    if (!note) return;
    try {
      await apiToggleTrash(note.id, 1);
      await loadNotes(true);

      if (showToast) {
        showToast.success(
          `Moved "${note.title}" to Trash`,
          'Note Trashed',
          {
            label: 'Undo',
            onClick: async () => {
              try {
                await apiToggleTrash(note.id, 0);
                await loadNotes(true);
                showToast.success(`Restored "${note.title}".`);
              } catch {
                showToast.error('Could not restore note.');
              }
            }
          }
        );
      }
      return { success: true };
    } catch (err) {
      if (showToast) showToast.error(err.message, 'Failed to trash note');
      return { success: false, error: err };
    }
  }, [loadNotes, showToast]);

  /**
   * Restore note from Trash
   */
  const restoreNote = useCallback(async (note) => {
    if (!note) return;
    try {
      await apiToggleTrash(note.id, 0);
      await loadNotes(true);
      if (showToast) {
        showToast.success(`Restored "${note.title}" from Trash.`);
      }
      return { success: true };
    } catch (err) {
      if (showToast) showToast.error(err.message, 'Failed to restore note');
      return { success: false, error: err };
    }
  }, [loadNotes, showToast]);

  /**
   * Permanently delete a note
   */
  const permanentDeleteNote = useCallback(async (id, title = '') => {
    try {
      await apiDeleteNote(id);
      await loadNotes(true);

      if (showToast) {
        showToast.success(title ? `Permanently deleted "${title}".` : 'Note permanently deleted.');
      }
      return { success: true };
    } catch (err) {
      if (showToast) showToast.error(err.message, 'Failed to delete note permanently');
      return { success: false, error: err };
    }
  }, [loadNotes, showToast]);

  /**
   * Empty entire Trash
   */
  const emptyTrash = useCallback(async () => {
    try {
      const res = await apiEmptyTrash();
      await loadNotes(true);
      if (showToast) {
        showToast.success(res.message || 'Trash emptied.');
      }
      return { success: true };
    } catch (err) {
      if (showToast) showToast.error(err.message, 'Failed to empty trash');
      return { success: false, error: err };
    }
  }, [loadNotes, showToast]);

  /**
   * Duplicate Note
   */
  const duplicateNote = useCallback(async (note) => {
    if (!note) return;
    return await createNote({
      title: `${note.title} (Copy)`,
      content: note.content,
      category: note.category,
      tags: note.tags,
      pinned: false,
      favorite: note.favorite,
      color: note.color,
    });
  }, [createNote]);

  /**
   * Bulk Import
   */
  const bulkImport = useCallback(async (notesArray) => {
    try {
      const res = await apiBulkImportNotes(notesArray);
      await loadNotes(true);
      if (showToast) {
        showToast.success(`Imported ${res.importedCount} notes.`);
      }
      return { success: true, count: res.importedCount };
    } catch (err) {
      if (showToast) showToast.error(err.message, 'Failed to import notes');
      return { success: false, error: err };
    }
  }, [loadNotes, showToast]);

  /**
   * Export All
   */
  const exportAll = useCallback(async () => {
    try {
      const data = await apiExportAllNotes();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `noteflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      if (showToast) showToast.success('Export downloaded successfully.');
    } catch (err) {
      if (showToast) showToast.error(err.message, 'Export failed');
    }
  }, [showToast]);

  return {
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
    setSortBy: handleSetSortBy,
    viewMode,
    setViewMode: handleSetViewMode,
    refetch: () => loadNotes(false),
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
  };
}

export default useNotes;
