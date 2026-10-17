/**
 * 🎰 ROULETTE — TEST SETTINGS.
 *
 * ── WHY THIS FILE EXISTS ─────────────────────────────────────────────────────
 * Roulette is the first feature that can put a live camera in front of a
 * stranger. Every other feature fails closed: a bad deck query returns no
 * cards, a bad chat write returns no message. A bad Roulette setting does not
 * fail — it pairs a real person with a real stranger on camera.
 *
 * So the brakes are declared, named and parked BEFORE the engine exists, and
 * the defaults are the closed position. Turning Roulette on is a deliberate
 * edit, never an accident of deployment.
 *
 * ── WHAT THIS IS NOT ──────────────────────────────────────────────────────────
 * These are TEST settings. None is a commercial allowance and none is a
 * capacity claim. `MAX_CONCURRENT_CALLS: 5` is not "the product will support 5"
 * — it is "nobody may accidentally open 500 calls while we are still learning
 * what one costs". A separate decision, informed by measurement, replaces these
 * before any real launch.
 *
 * ── NOTHING READS THIS YET ────────────────────────────────────────────────────
 * Stage 0 records the settings and surfaces the feature's status at boot. No
 * queue, no call, no matching behaviour exists. This file is a declaration with
 * a resolver, not a control panel.
 *
 * Design source: ambitions/roulette.md §13
 */

/** Read an integer from the environment, falling back safely. */
const num = (key, fallback) => {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  // A typo like ROULETTE_MAX_QUEUE=five must not silently become NaN and
  // poison every comparison downstream. Fall back instead.
  return Number.isFinite(parsed) ? parsed : fallback;
};

/** Read a boolean from the environment. Only the exact string 'true' enables. */
const bool = (key, fallback) => {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return fallback;
  return raw === 'true';
};

/**
 * Parse the test-account allow-list.
 *
 * Empty is the safe position and means NOBODY may join the queue. This is the
 * opposite of the usual "empty means no restriction" convention, and that is
 * deliberate: the failure mode we are protecting against is a real account
 * reaching a live camera queue before anyone has looked at the queue code.
 */
const accounts = () => {
  const raw = process.env.ROULETTE_TEST_ACCOUNTS;
  if (!raw) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
};

const TEST_ACCOUNTS = accounts();

export const ROULETTE_SETTINGS = {
  /* ── THE MASTER SWITCH ────────────────────────────────────────────────────
   * Default false. Roulette must be explicitly enabled, in exactly one place,
   * with the word 'true'. Anything else — unset, '1', 'yes', 'TRUE' — is off.
   * There is no code path that turns Roulette on by default, ever. */
  ENABLED: bool('ROULETTE_ENABLED', false),

  /* ── WHO MAY JOIN A QUEUE ──────────────────────────────────────────────────
   * The allow-list is read fresh on every call rather than cached at module
   * load, the same way campusGate.js reads ALLOWED_COLLEGES per request: a test
   * that mutates process.env must not be defeated by a stale snapshot.
   *
   * Empty list = nobody. See the note on `accounts()` above. */
  TEST_ACCOUNTS,
  IS_TEST_MODE: TEST_ACCOUNTS.length > 0,

  /* ── CAPACITY ──────────────────────────────────────────────────────────────
   * Five, not fifty. The number is arbitrary on purpose: it is small enough
   * that two laptops testing together can saturate it deliberately, which is
   * how the admission-control path gets exercised before it is needed for real.
   *
   * NOTE: reaching this cap must refuse NEW sessions with a clear message. It
   * must never queue people who cannot be served — a queue that cannot drain is
   * indistinguishable from a hang. */
  MAX_CONCURRENT_CALLS: num('ROULETTE_MAX_CONCURRENT', 5),

  /* Bounds memory. Beyond this, joining users get "busy" rather than joining a
   * list that will not be served in any reasonable time. */
  MAX_QUEUE_SIZE: num('ROULETTE_MAX_QUEUE', 25),

  /* How long a user may wait before we stop pretending it is worth it. At this
   * point offer Leave — never silently expand the search radius (spec §10.4). */
  MAX_WAIT_SECONDS: num('ROULETTE_MAX_WAIT_SEC', 300),

  /* ── TIMEOUTS ──────────────────────────────────────────────────────────────
   * Twenty seconds is generous for STUN on a campus network and short enough
   * that a user on a captive portal fails with words rather than a spinner. */
  CONNECT_TIMEOUT_MS: num('ROULETTE_CONNECT_TIMEOUT_MS', 20_000),

  /* How long a pairing offer stays valid. Must comfortably exceed the connect
   * timeout, or a slow peer pairs and immediately loses the offer. */
  PAIR_TIMEOUT_MS: num('ROULETTE_PAIR_TIMEOUT_MS', 45_000),

  /* ── LONG-CALL POLICY ──────────────────────────────────────────────────────
   * Two hours. This is a RUNAWAY GUARD, not a product cap, and it is set two
   * orders of magnitude above any plausible commercial limit on purpose: it
   * exists to stop a stuck session billing TURN forever, and must never be
   * mistaken for the duration a paying user is entitled to.
   *
   * The real long-call question is answered by measurement, not by this number
   * — a 30-minute soak test in Stage 6 checks for stalls, memory growth and
   * credential expiry mid-call. The commercial duration limit is deliberately
   * UNDECIDED (spec §17). */
  TEST_CALL_CEILING_MS: num('ROULETTE_TEST_CALL_CEILING_MS', 7_200_000),

  /* ── TURN CREDENTIALS ──────────────────────────────────────────────────────
   * One hour. Cloudflare's maximum is 48h; on expiry it stops billing
   * immediately and then disconnects, so a credential must comfortably outlive
   * a single call but never linger. Refresh mid-call via
   * RTCPeerConnection.setConfiguration() when a session outlives this.
   *
   * ISSUANCE_PER_HOUR is credential-farm defence. The Cloudflare API token
   * mints unlimited short-lived credentials; without a per-user cap one
   * authenticated client can generate them in a loop. */
  TURN_CREDENTIAL_TTL_SECONDS: num('ROULETTE_TURN_TTL_SEC', 3600),
  ISSUANCE_PER_HOUR: num('ROULETTE_ICE_PER_HOUR', 10),
};

/**
 * May this user join the Roulette queue at all?
 *
 * Three gates, all of which must pass:
 *   1. The feature is on          — otherwise Roulette does not exist.
 *   2. A test allow-list is set   — an EMPTY list admits nobody.
 *   3. This user is on it         — compared as strings, because the values
 *                                   arrive from a comma-separated env var
 *                                   while callers hold an ObjectId.
 *
 * The empty-list rule is the important one. It means that turning
 * ROULETTE_ENABLED on without also configuring ROULETTE_TEST_ACCOUNTS produces
 * a feature that is on, documented, and unable to pair anybody — a loud no-op
 * rather than a live camera pointed at a stranger.
 */
export const canJoinRouletteQueue = (userId) => {
  const s = ROULETTE_SETTINGS;
  if (!s.ENABLED) return false;
  if (!s.IS_TEST_MODE) return false;
  if (!userId) return false;
  return s.TEST_ACCOUNTS.includes(String(userId));
};

/**
 * One-line summary for the boot log, so the feature's status is verifiable
 * without reading code. Mirrors the existing config warnings in index.js, which
 * is why it reads the way it does.
 */
export const describeRouletteStatus = () => {
  const s = ROULETTE_SETTINGS;
  if (!s.ENABLED) return 'disabled (ROULETTE_ENABLED is not "true")';

  if (!s.IS_TEST_MODE) {
    return 'ENABLED but unreachable — ROULETTE_TEST_ACCOUNTS is empty, so nobody may queue';
  }

  const names = ['Deck', 'Chats', 'Roulette', 'Profile'];
  return `ENABLED — ${names[2]} is reachable in test mode, `
    + `${s.TEST_ACCOUNTS.length} allow-listed account(s), `
    + `max ${s.MAX_CONCURRENT_CALLS} concurrent call(s), queue cap ${s.MAX_QUEUE_SIZE}`;
};

export default ROULETTE_SETTINGS;
