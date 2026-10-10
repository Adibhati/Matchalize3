import * as Sentry from '@sentry/node';

// A zero-dependency, free background task runner.
// Detaches async tasks (push notifications, emails) from the Express response cycle.
// Concurrency-capped FIFO worker pool so a burst of tasks (e.g. push at launch)
// can't overwhelm external services or spike memory.
const MAX_CONCURRENT = 20;

// ⚠️ A task that never settles used to leak its slot FOREVER: `running` was only
// decremented in `.finally()`, which never runs if the promise never resolves.
// Twenty such tasks and `running` stayed at 20, so the `while` below never ran
// again — and every subsequent push notification, email and background job for
// the entire app silently stopped, forever, with no log line, no Sentry event and
// no metric. The worst possible failure mode: notifications just quietly quit.
//
// The timeout converts "hangs forever" into "fails loudly, then moves on", and
// the saturation log makes the condition diagnosable instead of invisible.
const TASK_TIMEOUT_MS = 15_000;

// Bound memory when producers outpace consumers. Without this, `queue.push` is
// unbounded and a traffic spike can grow the array without limit.
const MAX_QUEUE_LENGTH = 1000;

let droppedTasks = 0;
let timedOutTasks = 0;

const queue = [];
let running = 0;

const pump = () => {
  // Diagnose the wedge condition even when it happens, rather than discovering
  // it weeks later from "users say notifications stopped".
  if (queue.length > MAX_QUEUE_LENGTH / 2 && running >= MAX_CONCURRENT) {
    console.warn(
      `[Background Queue] saturated: ${queue.length} queued, ${running}/${MAX_CONCURRENT} slots in use`
    );
  }

  while (running < MAX_CONCURRENT && queue.length > 0) {
    const task = queue.shift();
    running += 1;

    // ⚠️ The slot must be released by OUR chain settling, not by the task's own
    // promise settling. `running` is decremented in `.finally()` below, and
    // `.finally()` only runs when the promise it is attached to settles. Merely
    // logging on a timer is therefore not enough — the chain stays pending and the
    // slot leaks anyway. So the task is RACED against the timer: when the timer
    // wins, our promise rejects, `.catch()` records it and `.finally()` frees the
    // slot, while the abandoned task keeps running harmlessly in the background
    // (these are fire-and-forget notifications, so there is nothing to cancel).
    // `rejectTimeout` is wired into the Promise.race below. It must be declared
    // before the timer so the timer callback can reach it.
    let rejectTimeout;
    const timer = setTimeout(() => {
      timedOutTasks += 1;
      console.error(
        `[Background Queue] task exceeded ${TASK_TIMEOUT_MS}ms; releasing its slot`
      );
      rejectTimeout?.(new Error(`task exceeded ${TASK_TIMEOUT_MS}ms`));
    }, TASK_TIMEOUT_MS);

    Promise.resolve()
      .then(() => {
        // Arm the race: whichever settles first wins.
        return Promise.race([
          Promise.resolve().then(task),
          new Promise((_, reject) => {
            rejectTimeout = reject;
          }),
        ]);
      })
      .catch((error) => {
        // The timer already logged the timeout, and an abandoned task is not an
        // application bug worth waking Sentry for — it is an infra symptom. Real
        // task failures still get reported.
        if (error?.message?.includes(`exceeded ${TASK_TIMEOUT_MS}ms`)) return;
        console.error('[Background Queue Error]', error);
        // Surface background failures in Sentry when initialized (safe no-op if DSN unset)
        Sentry.captureException(error);
      })
      .finally(() => {
        clearTimeout(timer);
        running -= 1;
        setImmediate(pump);
      });
  }
};

export const addToQueue = (task) => {
  if (queue.length >= MAX_QUEUE_LENGTH) {
    droppedTasks += 1;
    // Dropping is strictly better than growing without bound, and the counter
    // makes it visible.
    console.error(
      `[Background Queue] at capacity (${MAX_QUEUE_LENGTH}); dropped task. Total dropped: ${droppedTasks}`
    );
    return;
  }
  queue.push(task);
  setImmediate(pump);
};

/** Health counters — for debugging "notifications stopped" reports. */
export const getQueueStats = () => ({
  queued: queue.length,
  running,
  maxConcurrent: MAX_CONCURRENT,
  maxQueueLength: MAX_QUEUE_LENGTH,
  droppedTasks,
  timedOutTasks,
});