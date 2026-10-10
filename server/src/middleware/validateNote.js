/**
 * Request Validation Middleware for Notes
 */

/**
 * Validates request body for creating or updating a note
 */
export function validateNoteBody(req, res, next) {
  const { title, content } = req.body;

  const errors = [];

  if (title === undefined || title === null || typeof title !== 'string' || title.trim() === '') {
    errors.push('Note title is required and cannot be empty.');
  } else if (title.trim().length > 255) {
    errors.push('Note title must not exceed 255 characters.');
  }

  if (content === undefined || content === null || typeof content !== 'string' || content.trim() === '') {
    errors.push('Note content is required and cannot be empty.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: errors.join(' ')
    });
  }

  // Normalize trimmed values onto req.body
  req.body.title = title.trim();
  req.body.content = content.trim();

  next();
}

/**
 * Validates note ID parameter in routes like /api/notes/:id
 */
export function validateNoteId(req, res, next) {
  const { id } = req.params;
  const parsedId = parseInt(id, 10);

  if (isNaN(parsedId) || parsedId <= 0 || String(parsedId) !== String(id).trim()) {
    return res.status(400).json({
      success: false,
      error: 'Invalid note ID. ID must be a positive integer.'
    });
  }

  req.parsedId = parsedId;
  next();
}
