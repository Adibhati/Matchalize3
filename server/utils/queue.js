import * as Sentry from '@sentry/node';

// A zero-dependency, free background task runner.
// Detaches async tasks (push notifications, emails) from the Express response cycle.
export const addToQueue = (task) => {
  setImmediate(async () => {
    try {
      await task();
    } catch (error) {
      console.error('[Background Queue Error]', error);
      // Surface background failures in Sentry when initialized (safe no-op if DSN unset)
      Sentry.captureException(error);
    }
  });
};
