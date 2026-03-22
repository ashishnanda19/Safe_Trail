import { env } from '../config/env.js';

/**
 * Global error handler middleware.
 * Must be the LAST middleware registered in app.js.
 * Catches all errors passed via next(err).
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.path}:`, err.message);

  // Default
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Map known error types to appropriate HTTP codes
  if (err.name === 'ValidationError' || err.name === 'ZodError') {
    statusCode = 422;
    message = 'Validation failed';
  } else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Authentication failed';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Access denied';
  } else if (err.code === '23505') {
    // PostgreSQL unique constraint violation
    statusCode = 409;
    message = 'Resource already exists';
  } else if (err.code === '23503') {
    // PostgreSQL foreign key violation
    statusCode = 400;
    message = 'Referenced resource not found';
  }

  const response = {
    success: false,
    message,
  };

  // Include stack trace in development only
  if (env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.detail = err.detail; // PostgreSQL error detail
  }

  res.status(statusCode).json(response);
};

/**
 * 404 handler — catches unmatched routes
 */
export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};
