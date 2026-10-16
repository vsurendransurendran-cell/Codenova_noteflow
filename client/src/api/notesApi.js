/**
 * NoteFlow API Client
 * Complete typed client for Notes CRUD, Filters, Trash, Pins, Favorites,
 * Bulk Import/Export, and AI Assistant.
 */

const API_BASE = '/api/notes';
const AI_BASE = '/api/ai';

/**
 * Standard fetch wrapper that translates HTTP errors and network crashes
 * into structured error objects.
 */
async function request(url, options = {}) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      const errorMessage = data && data.error 
        ? data.error 
        : `Request failed with status ${response.status} (${response.statusText})`;
      
      const error = new Error(errorMessage);
      error.status = response.status;
      error.isServerError = response.status >= 500;
      error.isClientError = response.status >= 400 && response.status < 500;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.isServerError || err.isClientError) {
      throw err;
    }

    const networkError = new Error(
      err.message || 'Cannot reach the backend server. Please verify the server is running.'
    );
    networkError.isNetworkError = true;
    networkError.status = 0;
    throw networkError;
  }
}

/**
 * List notes with optional filtering and sorting
 * @param {Object} options
 * @param {string} [options.q] Search query
 * @param {string} [options.category] Category filter ('All', 'Work', 'Study', 'Personal', etc.)
 * @param {string} [options.filter] 'all' | 'pinned' | 'favorites' | 'trash'
 * @param {string} [options.sortBy] 'updated_desc' | 'updated_asc' | 'created_desc' | 'created_asc' | 'title_asc' | 'title_desc'
 */
export async function fetchNotes(options = {}) {
  const params = new URLSearchParams();
  if (options.q) params.set('q', options.q.trim());
  if (options.category && options.category !== 'All') params.set('category', options.category);
  if (options.filter && options.filter !== 'all') params.set('filter', options.filter);
  if (options.sortBy) params.set('sortBy', options.sortBy);

  const qs = params.toString() ? `?${params.toString()}` : '';
  const result = await request(`${API_BASE}${qs}`, { method: 'GET' });
  return result && result.data ? result.data : (Array.isArray(result) ? result : []);
}

/**
 * Fetch database counts & overview stats
 */
export async function fetchNotesStats() {
  const result = await request(`${API_BASE}/meta/stats`, { method: 'GET' });
  return result && result.stats ? result.stats : { total: 0, pinned: 0, favorites: 0, trash: 0, categories: {} };
}

/**
 * Fetch a single note by ID
 */
export async function fetchNoteById(id) {
  const result = await request(`${API_BASE}/${id}`, { method: 'GET' });
  return result && result.data ? result.data : result;
}

/**
 * Create a new note
 */
export async function createNote(noteData) {
  const result = await request(API_BASE, {
    method: 'POST',
    body: JSON.stringify(noteData),
  });
  return result && result.data ? result.data : result;
}

/**
 * Update an existing note
 */
export async function updateNote(id, noteData) {
  const result = await request(`${API_BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(noteData),
  });
  return result && result.data ? result.data : result;
}

/**
 * Toggle pin status
 */
export async function togglePin(id) {
  const result = await request(`${API_BASE}/${id}/pin`, {
    method: 'PATCH',
  });
  return result && result.data ? result.data : result;
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(id) {
  const result = await request(`${API_BASE}/${id}/favorite`, {
    method: 'PATCH',
  });
  return result && result.data ? result.data : result;
}

/**
 * Move note to trash or restore from trash
 */
export async function toggleTrash(id, isTrashed = undefined) {
  const result = await request(`${API_BASE}/${id}/trash`, {
    method: 'PATCH',
    body: JSON.stringify(isTrashed !== undefined ? { is_trashed: isTrashed } : {}),
  });
  return result && result.data ? result.data : result;
}

/**
 * Permanently delete note
 */
export async function deleteNote(id) {
  const result = await request(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });
  return result;
}

/**
 * Empty all items from trash
 */
export async function emptyTrash() {
  const result = await request(`${API_BASE}/trash/empty`, {
    method: 'DELETE',
  });
  return result;
}

/**
 * Bulk import an array of notes
 */
export async function bulkImportNotes(notes) {
  const result = await request(`${API_BASE}/bulk-import`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
  return result;
}

/**
 * Export all notes JSON payload
 */
export async function exportAllNotes() {
  const result = await request(`${API_BASE}/export/all`, { method: 'GET' });
  return result;
}

/**
 * AI Assistant processing
 * @param {Object} payload
 * @param {'summarize'|'checklist'|'tags'|'simplify'|'expand'} payload.task
 * @param {string} payload.title
 * @param {string} payload.content
 */
export async function processWithAI(payload) {
  const result = await request(`${AI_BASE}/process`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return result;
}

/**
 * Health check endpoint
 */
export async function checkHealth() {
  return request('/api/health', { method: 'GET' });
}

export default {
  fetchNotes,
  fetchNotesStats,
  fetchNoteById,
  createNote,
  updateNote,
  togglePin,
  toggleFavorite,
  toggleTrash,
  deleteNote,
  emptyTrash,
  bulkImportNotes,
  exportAllNotes,
  processWithAI,
  checkHealth,
};
