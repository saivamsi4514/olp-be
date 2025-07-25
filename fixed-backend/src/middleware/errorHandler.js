// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error Handler:', err);

  // Default error
  let error = { ...err };
  error.message = err.message;

  // Mongoose/Database validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: message
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    return res.status(400).json({
      success: false,
      error: message
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired'
    });
  }

  // SQLite errors
  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(400).json({
      success: false,
      error: 'Database constraint violation',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Rate limit errors
  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later'
    });
  }

  // Default server error
  return res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 404 handler
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler
};