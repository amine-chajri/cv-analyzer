/**
 * Centralized error handler.
 * All error responses use the shape: { success: false, message: string }
 *
 * Recognizes:
 *  - ApiError (thrown with a status code)
 *  - Mongoose ValidationError
 *  - Mongoose duplicate key (code 11000)
 *  - Mongoose CastError (bad ObjectId)
 *  - Multer upload errors
 *  - Mongoose connection errors
 */
const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong on the server';

  // Mongoose validation error
  if (err.name === 'ValidationError' && err.errors) {
    status = 400;
    const first = Object.values(err.errors)[0];
    message = first ? first.message : 'Invalid input data';
  }

  // Duplicate key (e.g. email already registered)
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `An account with that ${field} already exists`;
  }

  // Bad ObjectId
  if (err.name === 'CastError') {
    status = 404;
    message = 'Resource not found';
  }

  // Multer upload errors
  if (err.name === 'MulterError') {
    status = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File too large. Maximum upload size is 10 MB.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected upload field. Please attach the CV to the "cv" field.';
    } else {
      message = `Upload failed: ${err.message}`;
    }
  }

  // MongoDB / network errors
  if (err.name === 'MongooseServerSelectionError') {
    status = 503;
    message = 'Database is unreachable. Please try again later.';
  }

  if (status >= 500) {
    console.error('[errorHandler]', err);
  }

  res.status(status).json({ success: false, message });
};

/** Helper to throw errors with an HTTP status code */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = { errorHandler, ApiError };
