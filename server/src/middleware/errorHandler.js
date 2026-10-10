/**
 * Centralized Error Handling & 404 Middleware
 */

/**
 * 404 Handler for undefined API routes
 */
export function notFoundHandler(req, res, _next) {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.originalUrl} - Route not found`
  });
}

/**
 * Centralized error handler
 */
export function errorHandler(err, req, res, _next) {
  console.error(`[Error] ${req.method} ${req.url}:`, err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}
