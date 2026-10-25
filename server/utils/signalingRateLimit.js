/**
 * 🚦 SIGNALING RATE LIMIT — per-user, in-memory.
 *
 * ── WHY THIS EXISTS ──────────────────────────────────────────────────────────
 * Nothing has ever touched a socket event. Every limiter in
 * `middleware/rateLimiters.js` is `express-rate-limit`, which needs a `req` —
 * sockets have none — so all six of those are invisible here.
 *
 * Stage 3 is the first feature where strangers send us arbitrary strings. SDP
 * blobs and ICE candidates are attacker-controlled and arrive at machine speed,
 * so without a ceiling one authenticated account can flood the process: every
 * relayed candidate is a socket emit to another user plus a JSON parse.
 *
 * ── WHY KEYED BY USER, NOT IP ────────────────────────────────────────────────
 * An entire college sits behind one NAT address. An IP limit on signaling would
 * throttle a whole campus during a busy evening. `verifyOtpLimiter` in
 * `middleware/rateLimiters.js` already documents this reasoning for signups;
 * the same argument applies harder here, because a call is continuous traffic
 * rather than a one-off.
 *
 * ── WHY A TOKEN BUCKET ───────────────────────────────────────────────────────
 * ICE candidates legitimately arrive in bursts — a dozen within the first
 * second after `setRemoteDescription`. A fixed window either breaks real calls
 * or is loose enough to be useless. A bucket with a burst allowance passes the
 * burst and still bounds the sustained rate, which is the actual abuse shape:
 * a loop, not a spike.
 */

/**
 * Create a rate limiter.
 *
 * @param {object} opts
 * @param {number} opts.ratePerSecond   sustained events/second allowed
 * @param {number} opts.burst           bucket depth, i.e. burst allowance
 * @param {number} opts.maxKeys         hard cap on tracked users (memory bound)
 * @param {number} [opts.idleTtlMs]     evict a user after this long unused
 * @param {() => number} [opts.now]     clock, injectable for tests
 */
export const createSignalingRateLimiter = ({
  ratePerSecond,
  burst,
  maxKeys = 5_000,
  idleTtlMs = 10 * 60 * 1000,
  now = Date.now,
}) => {
  const buckets = new Map();

  /**
   * Try to spend `cost` tokens for `key`.
   * @returns {{ ok: boolean, retryAfterMs: number }}
   */
  const take = (key, cost = 1) => {
    if (!key) return { ok: false, retryAfterMs: 0 };

    const t = now();
    let bucket = buckets.get(key);

    if (!bucket) {
      // Map is insertion-ordered, so the first key is the least recently used.
      // Dropping it on overflow is an O(1) LRU rather than a full scan.
      if (buckets.size >= maxKeys) {
        const oldest = buckets.keys().next().value;
        buckets.delete(oldest);
      }
      bucket = { tokens: burst, updatedAt: t };
      buckets.set(key, bucket);
    }

    // Refill for elapsed time, then reject if the bucket is empty.
    const elapsedMs = Math.max(0, t - bucket.updatedAt);
    bucket.tokens = Math.min(burst, bucket.tokens + (elapsedMs / 1000) * ratePerSecond);
    bucket.updatedAt = t;

    if (bucket.tokens < cost) {
      const deficit = cost - bucket.tokens;
      return { ok: false, retryAfterMs: Math.ceil((deficit / ratePerSecond) * 1000) };
    }

    bucket.tokens -= cost;
    return { ok: true, retryAfterMs: 0 };
  };

  /** Forget a user's bucket — call on disconnect so idle users don't accumulate. */
  const forget = (key) => {
    buckets.delete(key);
  };

  /** Sweep users idle beyond `idleTtlMs`. Call from a timer, not per event. */
  const sweep = () => {
    const cutoff = now() - idleTtlMs;
    for (const [key, bucket] of buckets) {
      if (bucket.updatedAt < cutoff) buckets.delete(key);
    }
  };

  return { take, forget, sweep, size: () => buckets.size };
};

export default createSignalingRateLimiter;
