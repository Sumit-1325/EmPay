// src/utils/asyncHandler.js
/**
 * Higher-order function that wraps async route handlers
 * Automatically catches errors and passes them to Express error handler
 * Eliminates the need for try-catch blocks in every route handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;