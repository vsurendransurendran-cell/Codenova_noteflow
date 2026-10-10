/**
 * Notes API Client
 * 
 * Handles network requests, HTTP status mapping, server errors,
 * and connection failures with descriptive error states.
 */

const API_BASE = '/api/notes';

// Optional simulated offline state to easily test server-down toast behavior
let simulateServerDown = false;

export function setSimulatedServerDown(isDown) {
  simulateServerDown = isDown;
}

export function getSimulatedServerDown() {
  return simulateServerDown;
}

/**
 * Standard fetch wrapper that translates HTTP errors and network crashes
 * into structured error objects.
 */
async function request(url, options = {}) {
  if (simulateServerDown) {
    const error = new Error('Network error: Unable to connect to Notes server (Simulated Server Down).');
    error.isNetworkError = true;
    error.status = 0;
    throw error;
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Parse JSON body if present
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

    // Network failures (e.g. server process stopped, DNS failure, ECONNREFUSED)
    const networkError = new Error(
      err.message || 'Cannot reach the backend server. Please verify the server is running.'
    );
    networkError.isNetworkError = true;
    networkError.status = 0;
    throw networkError;
  }
}

/**
 * List notes, optionally filtered by search term
 * @param {string} [searchTerm='']
 */
export async function fetchNotes(searchTerm = '') {
  const query = searchTerm ? `?q=${encodeURIComponent(searchTerm.trim())}` : '';
  const result = await request(`${API_BASE}${query}`, { method: 'GET' });
  return result && result.data ? result.data : (Array.isArray(result) ? result : []);
}

/**
 * Fetch a single note by ID
 * @param {number|string} id
 */
export async function fetchNoteById(id) {
  const result = await request(`${API_BASE}/${id}`, { method: 'GET' });
  return result && result.data ? result.data : result;
}

/**
 * Create a new note
 * @param {{ title: string, content: string }} noteData
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
 * @param {number|string} id
 * @param {{ title: string, content: string }} noteData
 */
export async function updateNote(id, noteData) {
  const result = await request(`${API_BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(noteData),
  });
  return result && result.data ? result.data : result;
}

/**
 * Delete a note
 * @param {number|string} id
 */
export async function deleteNote(id) {
  const result = await request(`${API_BASE}/${id}`, {
    method: 'DELETE',
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
  fetchNoteById,
  createNote,
  updateNote,
  deleteNote,
  checkHealth,
  setSimulatedServerDown,
  getSimulatedServerDown,
};
