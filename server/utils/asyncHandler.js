/**
 * Wraps an async Express route handler so rejected promises
 * are forwarded to the next() error handler instead of crashing.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
