# Chunk 24 — Server Tests

> Matchalize · `server-tests` · files 24 of 27 chunks · 9 file(s) · 61 KB · ~17,976 tokens
> Generated 2026-10-17 20:34.
> Paste-safe: within the 100 KB / ~29,257 token target.
>
> Contains:
> - `./server/tests/lib/env.mjs`
> - `./server/tests/lib/mongo.mjs`
> - `./server/tests/qa/browser.mjs`
> - `./server/tests/qa/run-qa.mjs`
> - `./server/tests/qa/scenes.mjs`
> - `./server/tests/society/art.mjs`
> - `./server/tests/society/cast.mjs`
> - `./server/tests/society/personas.mjs`
> - `./server/tests/society/seedSociety.mjs`

---
### ./server/tests/lib/env.mjs

```
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = path.resolve(__dirname, '../../..');
export const SERVER_DIR = path.join(REPO_ROOT, 'server');
export const CLIENT_DIR = path.join(REPO_ROOT, 'client');
export const QA_DIR = path.join(SERVER_DIR, 'tests', 'qa');
export const TESTS_DIR = path.join(SERVER_DIR, 'tests');
export const TEST_DB_NAME = 'matchalize_test';
export const QA_PORT = 5051;
export const QA_ORIGIN = `http://localhost:${QA_PORT}`;

export function parseEnvFile(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of text.split('\n')) {
    let line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('export ')) line = line.slice('export '.length).trim();
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    out[key] = value.replace(/\\n/g, '\n');
  }
  return out;
}

export function loadServerEnv() {
  return parseEnvFile(path.join(SERVER_DIR, '.env'));
}

export function deriveTestUri(serverEnv) {
  const uri = serverEnv.MONGODB_URI;
  if (!uri) throw new Error('server/.env is missing MONGODB_URI');
  const lastSlash = uri.lastIndexOf('/');
  const qsIdx = uri.indexOf('?');
  const query = qsIdx >= 0 ? uri.slice(qsIdx) : '';
  const base = uri.slice(0, lastSlash + 1);
  return `${base}${TEST_DB_NAME}${query}`;
}

export function buildServerEnv(serverEnv) {
  const production = parseEnvFile(path.join(SERVER_DIR, '.env.test'));
  const jwts = serverEnv.JWT_SECRET || 'matchalize-qa-jwt-secret';
  return {
    ...serverEnv,
    ...production,
    NODE_ENV: 'test',
    PORT: String(QA_PORT),
    MONGODB_URI: deriveTestUri(serverEnv),
    JWT_SECRET: jwts,
    FRONTEND_URL: QA_ORIGIN,
  };
}
```

### ./server/tests/lib/mongo.mjs

```
import mongoose from 'mongoose';

// The one database name these tests are ever allowed to touch. Mirrors
// TEST_DB_NAME in ./env.mjs.
const ALLOWED_TEST_DBNAME = 'matchalize_test';

export async function connectMongo(uri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  return mongoose.connection;
}

export async function disconnectMongo() {
  await mongoose.disconnect().catch(() => {});
}

/**
 * 🛑 REFUSE TO RUN AGAINST A DATABASE THAT ISN'T THE TEST DATABASE.
 *
 * resetTestDb() drops every collection it finds. `deriveTestUri` (env.mjs)
 * rewrites the db segment of server/.env's MONGODB_URI to `matchalize_test`,
 * which means the tests are safe by ACCIDENT even if that URI points at a
 * production CLUSTER — but that single indirection is the only thing standing
 * between a misconfigured .env and dropped collections. If env.mjs is ever
 * changed, or someone exports MONGODB_URI directly, the guard is gone.
 *
 * So assert the resolved database name before touching anything. Cheap, and it
 * converts a catastrophic, irreversible mistake into an immediate, obvious one.
 */
function assertDisposableDatabase(db) {
  const name = db.databaseName;
  if (name !== ALLOWED_TEST_DBNAME) {
    throw new Error(
      `🛑 REFUSING TO RUN: connected to database "${name}", expected "${ALLOWED_TEST_DBNAME}".\n` +
      `   These tests DROP every collection they find. Check MONGODB_URI in server/.env.`
    );
  }
}

export async function resetTestDb() {
  const db = mongoose.connection.db;
  assertDisposableDatabase(db);
  const collections = await db.listCollections().toArray();
  for (const c of collections) {
    await db.dropCollection(c.name).catch(() => {});
  }
}

export async function findLatestOtpEmail(db, email) {
  return db.collection('otps').findOne({ email }, { sort: { createdAt: -1 } });
}

export async function updateUserLastActive(db, emailsByRole, deltaMs) {
  const users = db.collection('users');
  for (const email of emailsByRole) {
    await users.updateOne({ email }, { $set: { lastActive: new Date(Date.now() - deltaMs) } });
  }
}
```

### ./server/tests/qa/browser.mjs

```
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { connectMongo, findLatestOtpEmail } from '../lib/mongo.mjs';
import {
  QA_ORIGIN,
  QA_PORT,
  SERVER_DIR,
  TESTS_DIR,
  buildServerEnv,
  deriveTestUri,
  loadServerEnv,
} from '../lib/env.mjs';

export { QA_ORIGIN };

export const VIDEOS_DIR = path.join(TESTS_DIR, 'qa', 'videos');

let mongoConnected = false;
export async function ensureMongo() {
  if (!mongoConnected) {
    const serverEnv = loadServerEnv();
    await connectMongo(deriveTestUri(serverEnv));
    mongoConnected = true;
  }
}

export async function readLatestOtp(email) {
  await ensureMongo();
  const doc = await findLatestOtpEmail(mongoose.connection.db, String(email).toLowerCase().trim());
  if (!doc) throw new Error(`No OTP record for ${email} — did send-otp hit the test DB?`);
  return doc.otp;
}

export async function bootServer() {
  const serverEnv = loadServerEnv();
  const env = buildServerEnv(serverEnv);
  const uri = env.MONGODB_URI;
  const proc = spawn(process.execPath, ['index.js'], {
    cwd: SERVER_DIR,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logBuf = '';
  proc.stdout.on('data', (d) => (logBuf += d));
  proc.stderr.on('data', (d) => (logBuf += d));
  const deadline = Date.now() + 45000;
  for (;;) {
    try {
      const res = await fetch(`${QA_ORIGIN}/api/config`);
      if (res.ok) break;
    } catch {
      /* not up yet */
    }
    if (proc.exitCode !== null) {
      throw new Error(`Test server exited early:\n${logBuf.slice(-2000)}`);
    }
    if (Date.now() > deadline) {
      throw new Error(`Test server did not boot in time:\n${logBuf.slice(-2000)}`);
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return {
    proc,
    uri,
    stop: () => {
      try {
        proc.kill('SIGTERM');
      } catch {}
    },
  };
}

export const MOBILE = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1 MatchalizeQA/1.0',
};

export async function makeContext(browser, videoDir, name) {
  fs.mkdirSync(videoDir, { recursive: true });
  const context = await browser.newContext({
    ...MOBILE,
    recordVideo: { dir: videoDir, size: { width: 390, height: 844 } },
  });
  context.setDefaultTimeout(20000);
  if (name) context.__qaName = name;
  const page = await context.newPage();
  page.on('dialog', (d) => d.accept());
  page.on('pageerror', (err) => console.log(`  [pageerror] ${err.message}`));
  return { context, page };
}

export async function closeContext({ context, videoDir, name }) {
  try {
    await context.close();
  } catch {}
  if (!videoDir) return null;
  const files = fs.readdirSync(videoDir).filter((f) => f.endsWith('.webm'));
  if (files.length === 0) return null;
  const src = path.join(videoDir, files[0]);
  const dest = path.join(videoDir, `${name || 'clip'}.webm`);
  if (src !== dest) fs.renameSync(src, dest);
  return dest;
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// --- UI DRIVERS -----------------------------------------------------------

export async function advanceSplash(page, { maxSwipes = 7 } = {}) {
  await page.goto(`${QA_ORIGIN}/`, { waitUntil: 'domcontentloaded' });
  const cta = page.locator('text="Enter the Realm"');
  for (let i = 0; i < maxSwipes; i++) {
    if (await cta.isVisible().catch(() => false)) break;
    await touchSwipe(page, { y0: 620, y1: 140, steps: 16, pause: 40 });
    await sleep(350);
  }
  if (await cta.isVisible().catch(() => false)) {
    await cta.tap();
    await sleep(1700);
  }
}

export async function startAuth(page, email) {
  page.on('dialog', (d) => d.accept());
  await advanceSplash(page);
  await page.locator('input[type="email"]').waitFor({ timeout: 25000 });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('button[type="submit"]').click();
  await page.locator('input.stamp-box').first().waitFor({ timeout: 15000 });
}

export async function enterOtp(page, otp) {
  const boxes = page.locator('input.stamp-box');
  const count = await boxes.count();
  const digits = String(otp).split('');
  for (let i = 0; i < count && i < digits.length; i++) {
    await boxes.nth(i).fill(digits[i]);
    await sleep(90);
  }
  // last digit triggers auto-verify
  await boxes.nth(Math.min(count, digits.length) - 1).press('Tab', { delay: 90 }).catch(() => {});
}

export async function loginViaOtp(page, email) {
  await startAuth(page, email);
  const otp = await readLatestOtp(email);
  await enterOtp(page, otp);
}

export async function waitForAppShell(page, { onboarded = true } = {}) {
  // Home: wait for the deck's first image; Onboarding: wait for its title step
  try {
    await page
      .locator('input[type="email"]')
      .waitFor({ state: 'detached', timeout: 30000 })
      .catch(() => {});
  } catch {}
  if (onboarded) {
    await page.locator('img').first().waitFor({ timeout: 30000 }).catch(() => {});
  }
  await sleep(1500);
}

export async function touchSwipe(page, { x = 190, y0 = 620, y1 = 140, steps = 12, pause = 45 } = {}) {
  const session = await page.context().newCDPSession(page);
  const touch = (type, points) => session.send('Input.dispatchTouchEvent', { type, touchPoints: points });
  await touch('touchStart', [{ x, y: y0 }]);
  await sleep(30);
  for (let i = 1; i <= steps; i++) {
    const y = y0 + ((y1 - y0) * i) / steps;
    await touch('touchMove', [{ x, y }]);
    await sleep(pause);
  }
  await touch('touchEnd', []);
}

export async function longPress(page, selector, holdMs = 480) {
  const target = page.locator(selector).first();
  await target.scrollIntoViewIfNeeded().catch(() => {});
  const box = await target.boundingBox();
  if (!box) throw new Error(`longPress: no bounding box for ${selector}`);
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const session = await page.context().newCDPSession(page);
  const touch = (type, points) => session.send('Input.dispatchTouchEvent', { type, touchPoints: points });
  await touch('touchStart', [{ x: cx, y: cy }]);
  await sleep(holdMs);
  await touch('touchEnd', []);
}

export async function tap(page, locator, { timeout = 15000 } = {}) {
  await locator.waitFor({ timeout });
  await locator.tap();
}

// Given selector that should match a concrete card, compute on-screen name via the deck API when needed.
export async function deckApi(page, { limit = 20 } = {}) {
  return page.evaluate(async (lim) => {
    const res = await fetch(`/api/discover?limit=${lim}`, { credentials: 'include' });
    return res.json();
  }, limit);
}
```

### ./server/tests/qa/run-qa.mjs

```
import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { connectMongo, disconnectMongo } from '../lib/mongo.mjs';
import { deriveTestUri, loadServerEnv, QA_ORIGIN, SERVER_DIR, CLIENT_DIR } from '../lib/env.mjs';
import { bootServer, VIDEOS_DIR } from './browser.mjs';
import { seedSociety } from '../society/seedSociety.mjs';
import { definitions, runners, loadConfig } from './scenes.mjs';
import { assertReportDir, copyVideo, writeReport, writeTheater } from './report.mjs';

const parseFlags = () => {
  const args = process.argv.slice(2);
  const get = (name, def = null) => {
    const hit = args.find((a) => a.startsWith(`--${name}`));
    if (!hit) return def;
    const value = hit.split('=')[1];
    return value === undefined || value === '' ? true : value;
  };
  return {
    scenes: get('scenes', '')?.toString().split(',').map((s) => s.trim()).filter(Boolean),
    skipSeed: get('skip-seed', false) !== false,
    only: get('only', '')?.toString().split(',').map((s) => s.trim()).filter(Boolean),
  };
};

const runScene = async ({ browser, cfg, world, id }) => {
  const runner = runners[id];
  const def = definitions.find((d) => d.id === id);
  const errors = [];
  const log = (msg) => {
    errors.push(String(msg));
    console.log(`    ${msg}`);
  };
  const started = Date.now();
  let videos = [];
  try {
    const out = await Promise.race([
      Promise.resolve(runner({ browser, cfg, world, log })),
      new Promise((_, rej) => setTimeout(() => rej(new Error('scene hit 240s wall-clock cap')), 240000)),
    ]);
    videos = (Array.isArray(out) ? out : [out]).filter(Boolean);
  } catch (err) {
    errors.push(`ERROR: ${err.message}`);
  }
  const durationMs = Date.now() - started;
  const hasVideo = videos.length > 0;
  const status = errors.some((e) => e.startsWith('ERROR:')) ? 'fail' : hasVideo ? (errors.length ? 'warn' : 'ok') : 'warn';
  return { id, name: def.name, blurb: def.blurb, status, notes: errors, videos, durationMs };
};

async function main() {
  const flags = parseFlags();
  const serverEnv = loadServerEnv();
  const testUri = deriveTestUri(serverEnv);
  process.env.MONGODB_URI = testUri;

  const reportDir = fs.existsSync(path.join(CLIENT_DIR, 'dist'))
    ? path.join(CLIENT_DIR, 'dist', 'e2e')
    : path.join(SERVER_DIR, 'tests', 'qa', 'report');
  assertReportDir(reportDir);

  fs.rmSync(VIDEOS_DIR, { recursive: true, force: true });
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });

  let server = null;
  if (!flags.skipSeed) {
    console.log(`[qa] booting test server on ${QA_ORIGIN} (db: ${testUri})`);
    server = await bootServer();
    console.log('[qa] seeding society…');
    await seedSociety();
    console.log('[qa] society seeded.');
  } else {
    console.log('[qa] --skip-seed: assuming a seeded test server is already running.');
  }

  const cfg = await loadConfig();
  console.log(`[qa] config loaded: ${cfg.prompts?.length || 0} prompts.`);

  const browser = await chromium.launch({ headless: true });
  const selected = flags.scenes?.length ? flags.scenes : flags.only?.length ? flags.only : definitions.map((d) => d.id);
  const sceneDefs = definitions.filter((d) => selected.includes(d.id));
  const world = {};

  const results = [];
  for (const def of sceneDefs) {
    console.log(`\n[qa] ▶ ${def.id} — ${def.name}`);
    const res = await runScene({ browser, cfg, world, id: def.id });
    res.videoRefs = (res.videos || []).map((src) => copyVideo(src, reportDir)).filter(Boolean);
    console.log(`      ${res.status.toUpperCase()} in ${(res.durationMs / 1000).toFixed(1)}s` + (res.videoRefs.length ? ` → ${res.videoRefs.join(', ')}` : ''));
    results.push(res);
  }

  await browser.close();

  writeReport(results, reportDir);
  writeTheater(results, reportDir);

  if (server) server.stop();
  await disconnectMongo().catch(() => {});

  const fails = results.filter((r) => r.status === 'fail').length;
  const warns = results.filter((r) => r.status === 'warn').length;
  console.log(`\n[qa] done — ${results.length} scenes · ✓ ${results.length - fails - warns} ⚠ ${warns} ✗ ${fails}`);
  console.log(`[qa] Report:      ${path.join(reportDir, 'REPORT.md')}`);
  console.log(`[qa] Theater:     ${path.join(reportDir, 'index.html')}`);
}

main().catch((err) => {
  console.error('[qa] fatal:', err);
  process.exit(1);
});
```

### ./server/tests/qa/scenes.mjs

```
import path from 'path';
import { QA_ORIGIN, VIDEOS_DIR } from './browser.mjs';
import {
  advanceSplash,
  loginViaOtp,
  makeContext,
  closeContext,
  touchSwipe,
  longPress,
  tap,
  sleep,
  deckApi,
} from './browser.mjs';

const SCENES_DIR = VIDEOS_DIR;

function svgPhotoBuffer(label) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><rect width="600" height="800" fill="#3a1d0d"/><circle cx="300" cy="320" r="150" fill="#8f4a1f"/><text x="300" y="560" text-anchor="middle" font-family="Georgia" font-size="90" fill="#ffc89f">${label}</text></svg>`;
  return Buffer.from(svg);
}

// ===== SHARED DRIVERS =====================================================

async function topCardPrompt(page) {
  const data = await deckApi(page);
  const top = data.users?.[0];
  return top?.prompts?.[0]?.question || 'Exceptional Match';
}

async function popLike(page, tileSelector, { note, flower } = {}) {
  await longPress(page, tileSelector);
  await sleep(250);
  await tap(page, page.locator(flower ? '.flower-btn' : '.letter-btn'));
  if (note) {
    await tap(page, page.locator('textarea.premium-input'));
    await page.locator('textarea.premium-input').fill(note);
    await tap(page, page.locator('.premium-send-btn'));
    await sleep(1600);
  } else {
    await sleep(1400);
  }
}

async function tapInterestChip(page, interest) {
  const chip = page
    .locator('button.tactile-btn')
    .filter({ hasText: new RegExp(`^\\s*${interest.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`) })
    .first();
  await chip.tap();
}

async function driveOnboarding(page, cfg, profile, { fast = false } = {}) {
  const wait = (ms) => (fast ? sleep(Math.round(ms / 3)) : sleep(ms));
  const advance = async () => {
    await touchSwipe(page, { y0: 640, y1: 130, steps: 16, pause: 40 });
    await wait(950);
  };
  const genderMap = { female: 'FEMALE', male: 'MALE' };

  await page.locator('text=The Dossier.').first().waitFor({ timeout: 30000 });
  await wait(700);
  await advance(); // intro -> vitals

  // VITALS
  await page.locator('input[placeholder="e.g. Arjun"]').fill(profile.name || 'Campus Writer');
  const d = String(profile.dobD || '09').padStart(2, '0');
  const m = String(profile.dobM || '06').padStart(2, '0');
  const y = String(profile.dobY || '2005');
  await page.locator('input[placeholder="DD"]').fill(d);
  await page.locator('input[placeholder="MM"]').fill(m);
  await page.locator('input[placeholder="YYYY"]').fill(y);
  await wait(400);
  await advance(); // vitals -> coordinates

  // COORDINATES
  const g = genderMap[profile.gender] || 'FEMALE';
  await page.locator('button.tactile-btn').filter({ hasText: new RegExp(`^\\s*${g}\\s*$`) }).first().tap();
  for (const gi of profile.interestedIn || ['MALE']) {
    let idx = 0;
    if (!['EVERYONE'].includes(gi)) idx = 1; // identity group renders first, interested-in second
    const chip = page.locator('button.tactile-btn').filter({ hasText: new RegExp(`^\\s*${gi}\\s*$`) }).nth(idx);
    await chip.tap();
  }
  // Branch and Hostel were removed from the Coordinates chapter along with their
  // schema fields, so there is nothing to tap or fill here any more. Do not
  // reintroduce selectors for them — if this harness ever needs a college or
  // location signal again, it should come from the college picker in Auth.
  const era = profile.era || 'UG';
  await page.locator('button:has-text("Select UG / PG...")').tap();
  await page.locator('button.tactile-btn').filter({ hasText: new RegExp(`^\\s*${era}\\s*$`) }).first().tap().catch(() => {});
  await wait(300);
  await advance(); // coordinates -> portrait

  // PORTRAIT
  await page.locator('button:has-text("Primary Photo")').first().tap();
  await page.locator('input[type="file"]').setInputFiles({ name: 'portrait.svg', mimeType: 'image/svg+xml', buffer: svgPhotoBuffer('P0') });
  await wait(3200);
  await page
    .locator('textarea[placeholder="What drives you? What are your passions?"]')
    .fill(profile.bio || 'Here for the conversations, the afternoon light, and the mess chai that somehow tastes different at 6pm.');
  await wait(300);
  await advance(); // portrait -> whispers

  // WHISPERS — 3 slots (horizontal pager; each slot becomes a card once answered)
  const prompts = profile.prompts || (cfg.prompts || []).slice(0, 3);
  const answers = [
    'Honestly? The ritual matters more than the loud thing.',
    'Engineers plan, poets improvise. I do both.',
    'Ask me after 10pm — my night-owl brain is sharper.',
  ];
  for (let slot = 0; slot < 3; slot++) {
    const add = page.locator('button:has-text("+ Select a Whisper")').first();
    if (await add.isVisible().catch(() => false)) {
      await add.tap();
      await wait(500);
      const qText = prompts[slot]?.question || prompts[slot] || '';
      await page.getByText(qText, { exact: true }).first().tap().catch(async () => {
        await page.getByText(qText.slice(0, 18), { exact: false }).first().tap().catch(() => {});
      });
      await wait(500);
    }
    const area = page.locator('textarea[placeholder="Your answer..."]').nth(slot);
    await area.fill(answers[slot % answers.length]);
    await wait(250);
  }
  await advance(); // whispers -> parameters

  // PARAMETERS
  for (const intent of profile.intent || ['Dating']) {
    const chip = page.locator('button.tactile-btn').filter({ hasText: new RegExp(`^\\s*${intent}\\s*$`) }).first();
    await chip.tap();
  }
  for (const it of profile.curiosities || (cfg.interests || []).slice(0, 3)) {
    await tapInterestChip(page, it).catch(() => {});
  }
  await wait(300);
  await advance(); // parameters -> alignment


  // REVIEW — publish
  const publish = page.locator('button:has-text("Publish Profile & Enter")');
  await publish.waitFor({ timeout: 15000 }).catch(() => {});
  if (await publish.isVisible().catch(() => false)) {
    await publish.tap();
  }
  await sleep(3000);
}

// ===== SCENES =============================================================

const definitions = [
  {
    id: 's01',
    name: 'Onboarding — The Dossier',
    blurb: 'Brand-new student Khushi signs in with her campus email and transcribes her story — Vitals, Coordinates, Portrait, Whispers, Parameters, Alignment — then publishes her profile.',
  },
  {
    id: 's02',
    name: 'Discover — Curating the Deck',
    blurb: 'Anaya browses the discovery deck: long-presses a tile to pop the letter press, sends a handwritten letter, and swipes past the rest.',
  },
  {
    id: 's08',
    name: 'Safety — Report & Block',
    blurb: 'Drishti reports a profile from the card menu and permanently blocks a match from her chat — creating the report trail that reaches the admin next.',
  },
  {
    id: 's03',
    name: 'The Alignment — Instant Chat',
    blurb: 'Drishti likes Arjun and the campus lights up: instant match and the first opening letter.',
  },
  {
    id: 's04',
    name: 'Letters — The Binder',
    blurb: 'Anika opens her Letters tab: conversations, unread messages, and the search that finds messages instantly.',
  },
  {
    id: 's05',
    name: 'Live Chat',
    blurb: 'Split-screen realtime chat: anika and rohan message each other live and react to a message. Everything relays over websockets.',
  },
  {
    id: 's06',
    name: 'The Letterbox',
    blurb: 'Anika opens her Letterbox from the bell, accepts a letter from Mira, then connects on a Priority Telegram from Ved.',
  },
  {
    id: 's07',
    name: 'Profile — The Dossier',
    blurb: 'Anika polishes her dossier: edits her bio and drops a new curiosity into her recorded list.',
  },
  {
    id: 's11',
    name: 'Severing Ties',
    blurb: 'Sanya unmatches Nishant from the chat options — an irreversible decision, confirmed and done.',
  },
  {
    id: 's09',
    name: 'Admin — The Archivist',
    blurb: 'The campus admin reviews pending community reports, opens Kabir’s file, and suspends the account.',
  },
  {
    id: 's10',
    name: 'Locked Out',
    blurb: 'Kabir tries to sign back in — the archive returns a suspended verdict and bars the door.',
  },
  {
    id: 's12',
    name: 'Admin — The Ledger',
    blurb: 'Back on the admin dashboard: live campus stats, active bans, and the safety ledger reflecting everything the run did.',
  },
  {
    id: 's14',
    name: 'The Splash',
    blurb: 'The cinematic entry — tagline, and the automatic pass into the archives.',
  },
  {
    id: 's15',
    name: 'The Encore',
    blurb: 'Arohi joins fast — a quick onboarding — and her letterbox already holds a welcome letter.',
  },
];

export { definitions };

async function runS01({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's01');
  const { context, page } = await makeContext(browser, dir, 's01');
  await loginViaOtp(page, 'khushi.verma@iitb.ac.in');
  await page.locator(`text=The Dossier.`).first().waitFor({ timeout: 20000 });
  await driveOnboarding(page, cfg, { name: 'Khushi Verma', gender: 'female', interestedIn: ['MALE'], dobD: 12, dobM: 3, dobY: 2006 });
  await page.locator('img').first().waitFor({ timeout: 30000 }).catch(() => {});
  await sleep(2500);
  return closeContext({ context, videoDir: dir, name: 's01' });
}

async function runS02({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's02');
  const { context, page } = await makeContext(browser, dir, 's02');
  await loginViaOtp(page, 'anaya.mehta@iitb.ac.in');
  await page.locator('img').first().waitFor({ timeout: 30000 });
  await sleep(2500);
  try {
    await popLike(page, await topCardPrompt(page), { note: 'The library-steps light at six. I think we both noticed.', flower: false });
  } catch (e) {
    log(`  [warn] anaya letter failed: ${e.message}`);
  }
  await sleep(2200);
  try {
    await touchSwipe(page, { y0: 640, y1: 130, steps: 16, pause: 40 }); // pass
    await sleep(1600);
  } catch (e) {
    log(`  [warn] anaya pass failed: ${e.message}`);
  }
  try {
    await popLike(page, await topCardPrompt(page), { flower: true });
  } catch (e) {
    log(`  [warn] anaya flower failed: ${e.message}`);
  }
  await sleep(2200);
  return closeContext({ context, videoDir: dir, name: 's02' });
}

async function runS03({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's03');
  const { context, page } = await makeContext(browser, dir, 's03');
  await loginViaOtp(page, 'drishti.iyer@iitb.ac.in');
  await page.locator('img').first().waitFor({ timeout: 30000 });
  await sleep(2500);
  try {
    await popLike(page, await topCardPrompt(page), { flower: true });
  } catch (e) {
    log(`  [warn] drishti like failed: ${e.message}`);
  }
  await page.getByText('You are Aligned', { exact: true }).first().waitFor({ timeout: 20000 });
  await sleep(1800);
  await page.locator('button:has-text("Open Chat")').tap();
  await page.getByPlaceholder('Write a message...').waitFor({ timeout: 15000 });
  await sleep(3000);
  return closeContext({ context, videoDir: dir, name: 's03' });
}

async function runS04({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's04');
  const { context, page } = await makeContext(browser, dir, 's04');
  await loginViaOtp(page, 'anika.singh@iitb.ac.in');
  await page.locator('img').first().waitFor({ timeout: 30000 });
  await sleep(1500);
  await tap(page, page.getByRole('button', { name: 'Letters' }));
  await page.locator('text="Rohan Gokhale"').first().waitFor({ timeout: 15000 });
  await sleep(1200);
  const search = page.getByPlaceholder('Search letters...');
  await search.fill('rohan');
  await sleep(1200);
  await page.getByRole('button', { name: 'Clear search' }).tap().catch(() => {});
  await sleep(800);
  await page.locator('text="Rohan Gokhale"').first().tap();
  await page.getByPlaceholder('Write a message...').waitFor({ timeout: 15000 });
  await sleep(2500);
  await page.getByRole('button', { name: 'Go back to letters' }).tap();
  await sleep(1500);
  return closeContext({ context, videoDir: dir, name: 's04' });
}

async function runS05({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's05');
  const a = await makeContext(browser, path.join(dir, 'anika'), 'anika');
  const b = await makeContext(browser, path.join(dir, 'rohan'), 'rohan');
  try {
    await loginViaOtp(a.page, 'anika.singh@iitb.ac.in');
    await loginViaOtp(b.page, 'rohan.g@iitb.ac.in');
    await a.page.locator('img').first().waitFor({ timeout: 30000 });
    await b.page.locator('img').first().waitFor({ timeout: 30000 });
    await tap(a.page, a.page.getByRole('button', { name: 'Letters' }));
    await a.page.locator('text="Rohan Gokhale"').first().tap();
    await tap(b.page, b.page.getByRole('button', { name: 'Letters' }));
    await b.page.locator('text="Anika Singh"').first().tap();
    await a.page.getByPlaceholder('Write a message...').waitFor({ timeout: 15000 });
    await b.page.getByPlaceholder('Write a message...').waitFor({ timeout: 15000 });
    await sleep(1500);

const send = async (lpage, text) => {
      const box = lpage.getByPlaceholder('Write a message...');
      await box.fill(text);
      await lpage.locator('button[aria-label="Send message"]').tap();
      await sleep(1600);
    };
    const waitText = async (page, text, ms = 9000) => {
      await page.getByText(text, { exact: false }).first().waitFor({ timeout: ms });
    };

    await send(a.page, 'Hey! Still awake, or drowning in submissions?');
    await waitText(b.page, 'still awake');
    await sleep(900);
    await send(b.page, 'Finals week. The library is my second home now.');
    await waitText(a.page, 'second home now');
    await sleep(900);
    await send(a.page, 'Cold brew rescue mission at CCC tomorrow?');
    await waitText(b.page, 'Cold brew rescue mission');
    await sleep(900);
    await send(b.page, "It's a date. Bring the good playlist.");
    await waitText(a.page, "It's a date. Bring the good playlist.");

    try {
      await longPress(a.page, 'text="It\'s a date. Bring the good playlist."', 560);
      await tap(a.page, a.page.locator('button:has-text("React")'), { timeout: 8000 });
      await tap(a.page, a.page.getByRole('button', { name: 'React with ❤️' }), { timeout: 8000 });
      await sleep(1800);
    } catch (e) {
      log(`  [warn] s05 reaction failed: ${e.message}`);
    }
    await sleep(2000);
  } finally {
    const v1 = await closeContext({ context: a.context, videoDir: path.join(dir, 'anika'), name: 'anika' });
    const v2 = await closeContext({ context: b.context, videoDir: path.join(dir, 'rohan'), name: 'rohan' });
    return [v1, v2].filter(Boolean);
  }
}

async function runS06({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's06');
  const { context, page } = await makeContext(browser, dir, 's06');
  await loginViaOtp(page, 'anika.singh@iitb.ac.in');
  await page.locator('img').first().waitFor({ timeout: 30000 });
  await sleep(1200);
  await tap(page, page.getByRole('button', { name: 'View notifications' }));
  await page.getByText('sent a letter.', { exact: false }).first().waitFor({ timeout: 15000 }).catch(() => {});
  await page.locator('text="Mira Nair"').first().waitFor({ timeout: 15000 });
  await sleep(1400);
  await page.locator('button[aria-label="Accept"]').first().tap();
  await page.getByPlaceholder('Write a message...').waitFor({ timeout: 15000 });
  await sleep(2600);
  await page.getByRole('button', { name: 'Go back to letters' }).tap().catch(() => {});
  await sleep(900);
  await tap(page, page.getByRole('button', { name: 'View notifications' }));
  await page.locator('text="Ved Desai"').first().waitFor({ timeout: 15000 });
  await sleep(1400);
  await page.locator('button[aria-label="Accept"]').first().tap();
  await page.getByPlaceholder('Write a message...').waitFor({ timeout: 15000 });
  await sleep(3000);
  return closeContext({ context, videoDir: dir, name: 's06' });
}

async function runS07({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's07');
  const { context, page } = await makeContext(browser, dir, 's07');
  await loginViaOtp(page, 'anika.singh@iitb.ac.in');
  await page.locator('img').first().waitFor({ timeout: 30000 });
  await sleep(800);
  await tap(page, page.getByRole('button', { name: 'Profile' }));
  await page.getByText('About Me', { exact: true }).first().waitFor({ timeout: 15000 });
  await sleep(1200);
  try {
    const aboutEdit = page.getByText('About Me', { exact: true }).first().locator('xpath=..').locator('button:has-text("Edit")');
    await aboutEdit.tap();
    await sleep(900);
    const bio = page.locator('textarea[placeholder="Write your bio..."]');
    if (await bio.isVisible().catch(() => false)) {
      await bio.fill('Just finished my first hackathon. Here for the chase scenes, the chai, and the long talks by the lake.');
      await bio.press('Tab'); // commit onBlur
      await sleep(1200);
    }
  } catch (e) {
    log(`  [warn] s07 bio edit failed: ${e.message}`);
  }
  await page.keyboard.press('Escape').catch(() => {});
  await sleep(800);
  try {
    const curEdit = page.getByText('Recorded Curiosities', { exact: true }).first().locator('xpath=..').locator('button:has-text("Edit")');
    await curEdit.tap();
    await sleep(900);
    const tags = (cfg.interests || []).slice(-3);
    const chip = page.locator('button.tactile-btn').filter({ hasText: tags[0] }).first();
    await chip.tap().catch(() => {});
    await sleep(1000);
  } catch (e) {
    log(`  [warn] s07 curiosity edit failed: ${e.message}`);
  }
  await page.keyboard.press('Escape').catch(() => {});
  await sleep(2500);
  return closeContext({ context, videoDir: dir, name: 's07' });
}

async function runS08({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's08');
  const { context, page } = await makeContext(browser, dir, 's08');
  await loginViaOtp(page, 'drishti.iyer@iitb.ac.in');
  await page.locator('img').first().waitFor({ timeout: 30000 });
  await sleep(2000);
  try {
    await tap(page, page.locator('button:has(svg.lucide-more-vertical)'));
    await tap(page, page.locator('button:has-text("Report Profile")'));
    await page.locator('text="Report User"').first().waitFor({ timeout: 10000 });
    await sleep(800);
    const reason = page.getByRole('button', { name: 'Harassment or bullying', exact: true }).first();
    await reason.tap().catch(async () => {
      const other = page.getByRole('button', { name: 'Other', exact: true }).first();
      await other.tap().catch(() => {});
    });
    const details = page.locator('textarea[placeholder="Provide any additional context..."]');
    if (await details.isVisible().catch(() => false)) {
      await details.fill('Repeatedly pestering in DMs despite being told to stop.');
    }
    await tap(page, page.locator('button:has-text("Submit Report")'));
    await page.locator('text="Report submitted."').first().waitFor({ timeout: 10000 }).catch(() => {});
    await sleep(1800);
  } catch (e) {
    log(`  [warn] s08 report failed: ${e.message}`);
  }
  try {
    await tap(page, page.getByRole('button', { name: 'Letters' }));
    await page.locator('text="Raj Kulkarni"').first().waitFor({ timeout: 15000 });
    await page.locator('text="Raj Kulkarni"').first().tap();
    await page.getByPlaceholder('Write a message...').waitFor({ timeout: 15000 });
    await sleep(1200);
    await tap(page, page.getByRole('button', { name: 'Open chat options' }));
    await tap(page, page.locator('button:has-text("Block User")'));
    await sleep(3000);
  } catch (e) {
    log(`  [warn] s08 block failed: ${e.message}`);
  }
  return closeContext({ context, videoDir: dir, name: 's08' });
}

async function runS09({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's09');
  const { context, page } = await makeContext(browser, dir, 's09');
  await loginViaOtp(page, 'admin@test.ac.in');
  await page.locator('img').first().waitFor({ timeout: 30000 });
  await page.goto(`${QA_ORIGIN}/admin`, { waitUntil: 'domcontentloaded' });
  await page.getByText('Total Users', { exact: true }).first().waitFor({ timeout: 25000 }).catch(() => {});
  await sleep(2500);
  try {
    await page.locator('button:has-text("Reports")').tap();
    await page.locator('text="Kabir Anand"').first().waitFor({ timeout: 20000 });
    await sleep(1200);
    await page.locator('text="Kabir Anand"').first().tap();
    await sleep(700);
    const action = page.locator('button:has-text("Action")').first();
    if (await action.isVisible().catch(() => false)) {
      await action.tap();
      await sleep(1600);
    }
    await page.keyboard.press('Escape').catch(() => {});
    await sleep(700);
  } catch (e) {
    log(`  [warn] s09 reports action failed: ${e.message}`);
  }
  try {
    await page.locator('button:has-text("Users")').tap().catch(() => {});
    await sleep(700);
    const search = page.getByPlaceholder('Search by name or email...').first();
    await search.fill('kabir');
    await search.press('Enter');
    await page.locator('text="Kabir Anand"').first().waitFor({ timeout: 20000 });
    await page.locator('text="Kabir Anand"').first().tap();
    await sleep(700);
    await page.locator('button:has-text("Suspend")').tap();
    await sleep(2200);
    await page.keyboard.press('Escape').catch(() => {});
  } catch (e) {
    log(`  [warn] s09 suspend failed: ${e.message}`);
  }
  await sleep(1800);
  return closeContext({ context, videoDir: dir, name: 's09' });
}

async function runS10({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's10');
  const { context, page } = await makeContext(browser, dir, 's10');
  try {
    await loginViaOtp(page, 'kabir.anand@iitb.ac.in');
  } catch (e) {
    log(`  [warn] s10 login attempt logged failure: ${e.message}`);
  }
  await page.getByText(/suspend/i).first().waitFor({ timeout: 15000 }).catch(() => {});
  await sleep(3500);
  return closeContext({ context, videoDir: dir, name: 's10' });
}

async function runS11({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's11');
  const { context, page } = await makeContext(browser, dir, 's11');
  await loginViaOtp(page, 'sanya.sharma@iitb.ac.in');
  await page.locator('img').first().waitFor({ timeout: 30000 });
  await sleep(1000);
  await tap(page, page.getByRole('button', { name: 'Letters' }));
  await page.locator('text="Nishant Jain"').first().waitFor({ timeout: 15000 });
  await sleep(800);
  // open the chat and unmatch from the chat options
  await page.locator('text="Nishant Jain"').first().tap();
  await page.getByPlaceholder('Write a message...').waitFor({ timeout: 15000 });
  await sleep(1200);
  await tap(page, page.getByRole('button', { name: 'Open chat options' }));
  await tap(page, page.locator('button:has-text("Unmatch")'));
  await sleep(3500);
  return closeContext({ context, videoDir: dir, name: 's11' });
}

async function runS12({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's12');
  const { context, page } = await makeContext(browser, dir, 's12');
  await loginViaOtp(page, 'admin@test.ac.in');
  await page.locator('img').first().waitFor({ timeout: 30000 });
  await page.goto(`${QA_ORIGIN}/admin`, { waitUntil: 'domcontentloaded' });
  await page.getByText('Total Users', { exact: true }).first().waitFor({ timeout: 25000 }).catch(() => {});
  await sleep(4500);
  return closeContext({ context, videoDir: dir, name: 's12' });
}

async function runS14({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's14');
  const { context, page } = await makeContext(browser, dir, 's14');
  await advanceSplash(page, { maxSwipes: 8 });
  await page.locator('input[type="email"]').waitFor({ timeout: 20000 }).catch(() => {});
  await sleep(2000);
  return closeContext({ context, videoDir: dir, name: 's14' });
}

async function runS15({ browser, cfg, world, log }) {
  const dir = path.join(SCENES_DIR, 's15');
  const { context, page } = await makeContext(browser, dir, 's15');
  await loginViaOtp(page, 'arohi.kapoor@iitb.ac.in');
  await page.locator('text=The Dossier.').first().waitFor({ timeout: 20000 });
  await driveOnboarding(page, cfg, { name: 'Arohi Kapoor', gender: 'female', interestedIn: ['MALE'], dobD: 22, dobM: 11, dobY: 2006, fast: true });
  await page.locator('img').first().waitFor({ timeout: 30000 }).catch(() => {});
  await sleep(1500);
  try {
    await tap(page, page.getByRole('button', { name: 'View notifications' }));
    await page.locator('text="Ved Desai"').first().waitFor({ timeout: 15000 });
    await sleep(3000);
  } catch (e) {
    log(`  [warn] s15 welcome letter peek failed: ${e.message}`);
  }
  return closeContext({ context, videoDir: dir, name: 's15' });
}

export const runners = {
  s01: runS01,
  s02: runS02,
  s03: runS03,
  s04: runS04,
  s05: runS05,
  s06: runS06,
  s07: runS07,
  s08: runS08,
  s09: runS09,
  s10: runS10,
  s11: runS11,
  s12: runS12,
  s14: runS14,
  s15: runS15,
};

export async function loadConfig() {
  const res = await fetch(`${QA_ORIGIN}/api/config`);
  return res.json();
}
```

### ./server/tests/society/art.mjs

```
// Deterministic SVG persona art -> data URIs. No external requests, ever.

function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

const PALETTES = [
  ['#2b1a4e', '#582b8f', '#e8a6ff'],
  ['#0e2a47', '#1f5f8f', '#9fd6ff'],
  ['#3a1d0d', '#8f4a1f', '#ffc89f'],
  ['#1d3a0d', '#4f8f1f', '#c4ff9f'],
  ['#420d1d', '#8f1f47', '#ff9fc2'],
  ['#0d2e2e', '#1f6f6f', '#9fffff'],
  ['#2e2e0d', '#6f6f1f', '#ffff9f'],
  ['#3a0d24', '#8f1f5e', '#ff9fe0'],
];

function ip(f) {
  return Math.floor(f() * 100000) % 100;
}

export function personaImage(seed, variant = 'portrait') {
  const rnd = xmur3(String(seed));
  const pal = PALETTES[ip(rnd) % PALETTES.length];
  const [dark, mid, light] = pal;
  const dims =
    variant === 'land' ? { w: 1280, h: 720 } : variant === 'square' ? { w: 600, h: 600 } : { w: 600, h: 800 };
  const { w, h } = dims;
  const cx = ip(rnd) % w;
  const cy = ip(rnd) % h;
  const pattern = ip(rnd) % 4;
  const rings = (ip(rnd) % 6) + 3;
  const initials = String(seed)
    .split(/[^A-Za-z]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

  let deco = '';
  if (pattern === 0) {
    for (let i = 0; i < rings; i++) {
      deco += `<circle cx="${cx}" cy="${cy}" r="${90 + i * 54}" fill="none" stroke="${light}" stroke-opacity="${0.14 + ip(rnd) / 300}" stroke-width="${6 + (ip(rnd) % 10)}"/>`;
    }
  } else if (pattern === 1) {
    const step = 60;
    for (let x = -h; x < w + h; x += step) {
      deco += `<line x1="${x}" y1="0" x2="${x + h}" y2="${h}" stroke="${light}" stroke-opacity="0.12" stroke-width="${4 + (ip(rnd) % 12)}"/>`;
    }
  } else if (pattern === 2) {
    for (let i = 0; i < 40; i++) {
      deco += `<circle cx="${ip(rnd) % w}" cy="${ip(rnd) % h}" r="${2 + (ip(rnd) % 9)}" fill="${light}" fill-opacity="0.25"/>`;
    }
  } else {
    for (let i = 0; i < 12; i++) {
      const bx = ip(rnd) % w;
      const by = ip(rnd) % h;
      deco += `<rect x="${bx}" y="${by}" width="${120 + (ip(rnd) % 220)}" height="${160 + (ip(rnd) % 260)}" rx="90" transform="rotate(${ip(rnd) % 360} ${bx} ${by})" fill="${light}" fill-opacity="0.10"/>`;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${dark}"/>
      <stop offset="1" stop-color="${mid}"/>
    </linearGradient>
    <radialGradient id="v">
      <stop offset="68%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.55)"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${w * 0.85}" ry="${h * 0.85}" fill="${light}" fill-opacity="0.07"/>
  ${deco}
  <text x="${w / 2}" y="${h / 2}" text-anchor="middle" dominant-baseline="central"
    font-family="Georgia, serif" font-weight="700" font-size="${Math.round(h / 3)}"
    fill="${light}" fill-opacity="0.85" letter-spacing="4">${initials || '*'}</text>
  <rect width="${w}" height="${h}" fill="url(#v)"/>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
```

### ./server/tests/society/cast.mjs

```
// Named cast roles.
export const CAST = {
  admin: {
    email: 'admin@test.ac.in',
    name: 'Aman Rao',
    gender: 'male',
    interestedIn: ['female'],
    intent: ['Dating'],
    age: 23,
    branch: 'CS',
    year: '4th',
    hostel: 'Hostel 7',
    bio: 'Admin account for campus safety — I watch over this campus.',
    isAdmin: true,
  },
  anaya: {
    email: 'anaya.mehta@iitb.ac.in',
    name: 'Anaya Mehta',
    gender: 'female',
    interestedIn: ['male'],
    intent: ['Dating'],
    age: 20,
  },
  drishti: {
    email: 'drishti.iyer@iitb.ac.in',
    name: 'Drishti Iyer',
    gender: 'female',
    interestedIn: ['male'],
    intent: ['Dating'],
    age: 21,
  },
  arjun: {
    email: 'arjun.ks@iitb.ac.in',
    name: 'Arjun K',
    gender: 'male',
    interestedIn: ['female'],
    intent: ['Dating'],
    age: 22,
  },
  anika: {
    email: 'anika.singh@iitb.ac.in',
    name: 'Anika Singh',
    gender: 'female',
    interestedIn: ['male'],
    intent: ['Dating', 'Friends'],
    age: 20,
  },
  rohan: {
    email: 'rohan.g@iitb.ac.in',
    name: 'Rohan Gokhale',
    gender: 'male',
    interestedIn: ['female'],
    intent: ['Dating'],
    age: 21,
  },
  mira: {
    email: 'mira.nair@iitb.ac.in',
    name: 'Mira Nair',
    gender: 'female',
    interestedIn: ['male'],
    intent: ['Friends'],
    age: 20,
  },
  ved: {
    email: 'ved.desai@iitb.ac.in',
    name: 'Ved Desai',
    gender: 'male',
    interestedIn: ['female'],
    intent: ['Dating'],
    age: 22,
  },
  sanya: {
    email: 'sanya.sharma@iitb.ac.in',
    name: 'Sanya Sharma',
    gender: 'female',
    interestedIn: ['male'],
    intent: ['Dating'],
    age: 21,
  },
  nishant: {
    email: 'nishant.j@iitb.ac.in',
    name: 'Nishant Jain',
    gender: 'male',
    interestedIn: ['female'],
    intent: ['Dating'],
    age: 22,
  },
  raj: {
    email: 'raj.kulkarni@iitb.ac.in',
    name: 'Raj Kulkarni',
    gender: 'male',
    interestedIn: ['female'],
    intent: ['Dating', 'Friends'],
    age: 23,
  },
  kabir: {
    email: 'kabir.anand@iitb.ac.in',
    name: 'Kabir Anand',
    gender: 'male',
    interestedIn: ['female'],
    intent: ['Dating'],
    age: 21,
  },
  priya: {
    email: 'priya.das@iitb.ac.in',
    name: 'Priya Das',
    gender: 'female',
    interestedIn: ['male'],
    intent: ['Friends'],
    age: 21,
  },
  arohi: {
    email: 'arohi.kapoor@iitb.ac.in',
    name: 'Arohi Kapoor',
    gender: 'female',
    interestedIn: ['male'],
    intent: ['Dating'],
    age: 19,
    fresh: true,
  },
  khushi: {
    email: 'khushi.verma@iitb.ac.in',
    name: 'Khushi Verma',
    gender: 'female',
    interestedIn: ['male'],
    intent: ['Dating'],
    age: 19,
    fresh: true,
  },
};

export const CAST_ORDER = Object.keys(CAST);
```

### ./server/tests/society/personas.mjs

```
import { CAST, CAST_ORDER } from './cast.mjs';
import { personaImage } from './art.mjs';
import { computeAgeFromDob } from '../../utils/age.js';

// A dob that resolves to exactly `spec.age` today — age is derived from dob at
// read time (utils/age.js), so personas need both to agree.
const dobForAge = (age) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - age);
  d.setDate(d.getDate() - 5);
  return d;
};

// Self-check: personas drive the QA harness, and an off-by-one here would make
// every QA screenshot show a plausible-but-wrong age.
if (computeAgeFromDob(dobForAge(21)) !== 21) {
  throw new Error('dobForAge() does not round-trip through computeAgeFromDob()');
}

// Deterministic name pool for the filler society (balance ~ 24M / 16F)
const PERSONA_NAMES = [
  ['Aarav Patel', 'M'], ['Ishaan Reddy', 'M'], ['Vihaan Shah', 'M'], ['Kabir Nair', 'M'],
  ['Aditya Rao', 'M'], ['Dev Malik', 'M'], ['Reyansh Bose', 'M'], ['Arnav Gupta', 'M'],
  ['Krish Talwar', 'M'], ['Zoya Khan', 'F'], ['Aisha Sheikh', 'F'], ['Meera Joshi', 'F'],
  ['Tara Verma', 'F'], ['Riya Kulkarni', 'F'], ['Sara Ali', 'F'], ['Ira Menon', 'F'],
  ['Dhruv Saxena', 'M'], ['Ved Agarwal', 'M'], ['Manav K', 'M'], ['Yash Deshpande', 'M'],
  ['Nikhil Pillai', 'M'], ['Karan D', 'M'], ['Ritvik Bhat', 'M'], ['Sid Mehra', 'M'],
  ['Navya Iyer', 'F'], ['Anvi Bhatt', 'F'], ['Ruhi Das', 'F'], ['Maya Chawla', 'F'],
  ['Kiara Sehgal', 'F'], ['Diya Nair', 'F'], ['Aadhya B', 'F'], ['Vaani Rao', 'F'],
  ['Rohan Joshi', 'M'], ['Parth Thakur', 'M'], ['Gautam Sinha', 'M'], ['Neel Kulkarni', 'M'],
  ['Aditya Verma', 'M'], ['Kunal Bajaj', 'M'], ['Ritika Sen', 'F'], ['Ishan Garg', 'M'],
];

const BRANCH_POOL = ['CS', 'EE', 'ME', 'Civil', 'Chem', 'Aero', 'Design', 'MATH', 'Physics', 'Meta'];
const YEAR_POOL = ['1st', '2nd', '3rd', '4th', 'PG'];
const HOSTEL_POOL = ['Hostel 1', 'Hostel 2', 'Hostel 3', 'Hostel 4', 'Hostel 5', 'Hostel 6', 'Hostel 7', 'Hostel 10'];
const BIO_POOL = [
  'Optimistic, chronically 5 minutes late, and slightly obsessed with the mess’s kadhi.',
  'Found wandering Powai at 2am. Ask me about the lakeside bench with the best sunset.',
  'Future chaos coordinator of this campus. My doodles have more friends than I do.',
  'Will debate you on film endings for hours, but will never reveal who signs the hostel register for me.',
  'Caffeine-powered, deadline-driven, secretly a softie. My plant is named after my ex.',
  'I rate sunsets and canteen chai. Your move.',
  'Accountable to no one but the canteen guy who knows my order by heart.',
  'Chemistry lab survivor. Will build you a robot that brings chai.',
];
const ANSWER_POOL = [
  'Because I think the little rituals matter more than the loud things.',
  'Honestly? I just want someone to share a quiet evening with.',
  'I wrote down my answer three times. This is the fourth draft.',
  'Roleplay DMs to the freshers’ group chat said otherwise.',
  'Ask me again after 10pm — my night-owl brain is sharper.',
  'My hostel wingmates vetoed anything too sincere.',
  'True story: I once convinced a professor the homework got eaten by a goat.',
  'I peaked in this one random inter-year quiz and I’m still chasing that high.',
];

function hashNum(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pick(list, n) {
  return list[n % list.length];
}

let fillerIdx = 0;

const normGender = (g) => {
  const k = String(g || '').toLowerCase();
  if (k === 'male') return 'Male';
  if (k === 'female') return 'Female';
  if (k === 'non-binary' || k === 'nonbinary') return 'Non-binary';
  return g;
};

const normInterested = (list) =>
  (list || []).map((g) => {
    const k = String(g).toLowerCase();
    if (k === 'male') return 'Male';
    if (k === 'female') return 'Female';
    if (k === 'non-binary' || k === 'nonbinary') return 'Non-binary';
    if (k === 'everyone') return 'Everyone';
    return g;
  });

function buildFiller(cfg) {
  const [rawName, sex] = PERSONA_NAMES[fillerIdx++ % PERSONA_NAMES.length];
  const idx = fillerIdx;
  const name = `${rawName}`;
  const email = `${name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '')}${idx}@iitb.ac.in`;
  const seed = email;
  const age = 19 + (hashNum(email + 'a') % 4);
  return {
    email,
    name,
    gender: normGender(sex === 'M' ? 'male' : 'female'),
    interestedIn: normInterested(sex === 'M' ? ['female'] : ['male']),
    intent: ['Dating', 'Friends'],
    age,
    role: null,
    seed,
    _fillIdx: idx,
  };
}

export function buildPersonas(cfg) {
  fillerIdx = 0;
  const prompts = cfg.prompts || ['A shower thought I recently had...', 'My ideal weekend looks like...', 'Two truths and a lie...'];
  const interests = cfg.interests || [];
  const branches = cfg.branches || BRANCH_POOL;
  const years = cfg.years || YEAR_POOL;

  const buildUser = (spec, role) => {
    const seed = spec.email;
    const photos = [
      personaImage(seed + ':p0', 'portrait'),
      personaImage(seed + ':p1', 'square'),
      personaImage(seed + ':p2', 'square'),
      personaImage(seed + ':p3', 'land'),
    ];
    // Three prompt slots, filled from the prompt bank.
    const promptSlots = [0, 1, 2].map((_, i) => ({
      question: prompts[i % prompts.length] || `A shower thought I recently had...`,
      answer: pick(ANSWER_POOL, hashNum(seed + 'a' + i)),
      photoUrl: i === 0 ? photos[2] : '',
    }));
    const gender = normGender(spec.gender) || 'Female';
    return {
      email: spec.email,
      college: 'Indian Institute of Technology Bombay',
      collegeCode: 'iitb',
      isVerified: true,
      isOnboarded: !spec.fresh,
      name: spec.name,
      age: spec.age,
      dob: dobForAge(spec.age),
      gender,
      pronouns: gender === 'Male' ? 'he/him' : gender === 'Female' ? 'she/her' : 'they/them',
      branch: spec.branch || pick(branches, hashNum(seed)),
      year: spec.year || pick(years, hashNum(seed + 'y')),
      hostel: spec.hostel || pick(HOSTEL_POOL, hashNum(seed + 'h')),
      bio: spec.bio || pick(BIO_POOL, hashNum(seed + 'b')),
      photos,
      prompts: promptSlots,
      intent: spec.intent || ['Dating'],
      interestedIn: normInterested(spec.interestedIn),
      interests: [pick(interests, hashNum(seed + 'i1')), pick(interests, hashNum(seed + 'i2')), pick(interests, hashNum(seed + 'i3'))].filter((v, i, a) => a.indexOf(v) === i),
      onboardingStep: 8,
      role,
    };
  };

  const castUsers = {};
  for (const key of CAST_ORDER) {
    const spec = { ...CAST[key] };
    castUsers[key] = buildUser(spec, key);
    castUsers[key].isAdmin = !!spec.isAdmin;
    castUsers[key]._role = key;
    if (spec.fresh) {
      castUsers[key].isOnboarded = false;
      castUsers[key].onboardingStep = 1;
    }
  }

  const fillers = [];
  for (let i = 0; i < 40; i++) {
    const spec = buildFiller(cfg);
    const u = buildUser(spec, null);
    u._fillIdx = spec._fillIdx;
    fillers.push(u);
  }

  return { castUsers, fillers };
}

// Ordered list of every society user for backdating + lookups.
export function flattenPersonas({ castUsers, fillers }) {
  const out = [];
  for (const key of CAST_ORDER) out.push({ role: key, user: castUsers[key] });
  for (const f of fillers) out.push({ role: null, user: f });
  return out;
}
```

### ./server/tests/society/seedSociety.mjs

```
import mongoose from 'mongoose';
import User from '../../models/User.js';
import Interaction from '../../models/Interaction.js';
import Notification from '../../models/Notification.js';
import Alignment from '../../models/Alignment.js';
import Message from '../../models/Message.js';
import Report from '../../models/Report.js';
import { connectMongo, disconnectMongo, resetTestDb } from '../lib/mongo.mjs';
import { QA_ORIGIN } from '../lib/env.mjs';
import { buildPersonas, flattenPersonas } from './personas.mjs';
import { CAST_ORDER } from './cast.mjs';
import { computeScore } from '../../utils/ladder.js';

const H = 3600 * 1000;
const D = 24 * H;

function pairKey(a, b) {
  return [a._id.toString(), b._id.toString()].sort().join('__');
}

async function fetchConfig() {
  const res = await fetch(`${QA_ORIGIN}/api/config`);
  return res.json();
}

export async function seedSociety() {
  await connectMongo(process.env.MONGODB_URI);
  await resetTestDb();
  const cfg = await fetchConfig();
  const { castUsers, fillers } = buildPersonas(cfg);

  const docs = flattenPersonas({ castUsers, fillers }).map(({ role, user }) => ({ ...user }));

  /* Seed the ladder score with the same pure function the write routes use.
     persona rows go in via insertMany, which never touches the recompute in
     /users/setup or PUT /profile — so without this every society row sits at
     the schema default of 0, below LADDER.publish, and the QA deck reads as
     entirely locked rather than exercising the cards it was built to exercise. */
  docs.forEach((d) => { d.profileScore = computeScore(d); });

  const inserted = await User.insertMany(docs);
  const byRole = {};
  const byEmail = {};
  const emailToRole = {};
  for (const key of CAST_ORDER) emailToRole[castUsers[key].email] = key;
  for (const doc of inserted) {
    byEmail[doc.email] = doc;
    const role = emailToRole[doc.email];
    if (role) byRole[role] = doc;
  }
  const all = inserted;
  const maleFillers = all.filter((u) => String(u.gender).toLowerCase() === 'male' && !u._role);
  const femaleFillers = all.filter((u) => String(u.gender).toLowerCase() === 'female' && !u._role);
  const match = (base, off) => { const d = new Date(Date.now() - off); return d; };

  // --- 1. LETTERS / TELEGRAMS (Inbox content for the cast) ---
  const letter = async ({ from, to, type, note, hoursAgo = 0, cleared = false }) => {
    const it = await Interaction.create({
      actorId: from._id,
      targetId: to._id,
      actionType: type,
      letterContent: note,
      targetArtifact: null,
      cooldownExpiresAt: null,
      createdAt: match(null, hoursAgo * H),
      updatedAt: match(null, hoursAgo * H),
    });
    await Notification.create({
      recipientId: to._id,
      senderId: from._id,
      type: type === 'telegram' ? 'priority_telegram' : 'new_letter',
      interactionRef: it._id,
      isCleared: cleared,
      createdAt: match(null, hoursAgo * H),
      updatedAt: match(null, hoursAgo * H),
    });
    return it;
  };

  await letter({ from: byRole.arjun, to: byRole.drishti, type: 'letter', note: 'The way the light falls on the library steps at six — I think you’d see it the same way.', hoursAgo: 1, cleared: true });
  await letter({ from: byRole.mira, to: byRole.anika, type: 'letter', note: 'Your mess doodle of the chef got me through finals week. Dinner sometime?', hoursAgo: 2 });
  await letter({ from: byRole.ved, to: byRole.anika, type: 'telegram', note: 'Priority note — amphitheatre, sunset, tonight. You in?', hoursAgo: 2 });
  await letter({ from: byRole.ved, to: byRole.arohi, type: 'letter', note: 'Welcome to campus. If you want a map that’s actually honest, I know good shortcuts.', hoursAgo: 3 });

  // --- 2. SEEDED MATCHES + CONVERSATIONS (history for Matches/Chat scenes) ---
  const seedMatch = async ({ a, b, sinceDays, thread }) => {
    const pkey = pairKey(a, b);
    const m = await Alignment.create({
      users: [a._id, b._id],
      pairKey: pkey,
      isActive: true,
      unlockedByInteractionId: new mongoose.Types.ObjectId(),
      createdAt: match(null, sinceDays * D),
      updatedAt: match(null, sinceDays * D),
    });
    let t = sinceDays * D;
    for (const [idx, mtext] of thread.entries()) {
      const [senderKey, text, read] = mtext;
      const senderDoc = byRole[senderKey] || byEmail[senderKey];
      await Message.create({
        alignmentId: m._id,
        senderId: senderDoc._id,
        type: 'text',
        text,
        reactions: [],
        readAt: read === false ? null : match(null, t - 30 * 60 * 1000),
        deliveryStatus: 'sent',
        createdAt: match(null, t),
        updatedAt: match(null, t),
      });
      t -= (9 + idx) * H;
    }
    return m;
  };

  const matches = {};
  matches['anika-rohan'] = await seedMatch({
    a: byRole.anika, b: byRole.rohan, sinceDays: 6, thread: [
      ['rohan', 'Okay that physics lecture was genuinely cursed today.', false],
      ['anika', 'RIGHT? I took notes in a different language by minute 20.', false],
      ['rohan', 'Lol. Coffee rescue mission at CCC tomorrow?', false],
      ['anika', 'Deal. If you bring the cold brew, I’ll bring the good playlist.', false],
      ['rohan', 'The one with the Coachella sets from 2022?', true],
      ['anika', 'Shhh. It’s sentimental.', true],
    ],
  });
  matches['anika-f1'] = await seedMatch({
    a: byRole.anika, b: maleFillers[0], sinceDays: 4, thread: [
      [maleFillers[0]._role || maleFillers[0].email, 'Saw you at the quizzing club. You argued with the quizmaster? Respect.', false],
      ['anika', 'Haha, the question was objectively wrong. A matter of principle!', false],
      [maleFillers[0]._role || maleFillers[0].email, 'Our principles usually cost us points, but I respect it.', false],
    ],
  });
  matches['anika-f2'] = await seedMatch({
    a: byRole.anika, b: maleFillers[1], sinceDays: 3, thread: [
      [maleFillers[1]._role || maleFillers[1].email, 'Your photography page is criminally under-followed.', false],
      ['anika', 'Cheap phone, golden hour. I’ll take it.', false],
      [maleFillers[1]._role || maleFillers[1].email, 'Golden hour does all the work. Jk, your eye is good.', true],
    ],
  });
  matches['drishti-raj'] = await seedMatch({
    a: byRole.drishti, b: byRole.raj, sinceDays: 2, thread: [
      ['raj', 'Hey, we matched a while ago. You’re hard to pin down.', false],
      ['raj', 'Anyway, I’m hosting a small thing at my wing this Friday.', true],
      ['drishti', 'I’m a bit busy with submissions this week.', true],
      ['raj', 'Right. Busy. Sure.', false],
    ],
  });
  matches['sanya-nishant'] = await seedMatch({
    a: byRole.sanya, b: byRole.nishant, sinceDays: 5, thread: [
      ['nishant', 'You have an unfair advantage in our cricket debates: you actually play.', true],
      ['sanya', 'And yet you still argue with me about spin bowling.', true],
      ['nishant', 'Some hills are worth dying on.', true],
    ],
  });

  // --- 3. KABIR: 3 pending community reports (auto-shadowban at 3, not suspended) ---
  const kabirReporters = femaleFillers.slice(0, 3);
  for (let i = 0; i < kabirReporters.length; i++) {
    await Report.create({
      reporter: kabirReporters[i]._id,
      reported: byRole.kabir._id,
      reason: i === 0 ? 'Harassment or bullying' : i === 1 ? 'Inappropriate photos' : 'Fake profile or spam',
      details: '',
      status: 'pending',
      createdAt: match(null, (5 - i) * H + (i % 2) * 3 * H),
    });
  }
  await User.updateOne(
    { _id: byRole.kabir._id },
    { $set: { shadowbannedAt: new Date(Date.now() - 4 * H), contentFrozen: true } }
  );

  // --- 4. TIME-WARP user timestamps + lastActive ---
  const recentRoles = ['anaya', 'drishti', 'arjun', 'anika', 'sanya', 'arohi', 'khushi'];
  const now = Date.now();
  const backdate = async (u, createdAgo, activeAgo) => {
    await User.updateOne(
      { _id: u._id },
      {
        $set: {
          createdAt: new Date(now - createdAgo),
          updatedAt: new Date(now - (createdAgo / 2)),
          lastActive: new Date(now - activeAgo),
        },
      }
    );
  };
  for (const u of all) {
    const activeAgo = recentRoles.includes(u._role)
      ? 0
      : u._role === 'rohan' || u._role === 'mira' || u._role === 'ved' || u._role === 'nishant' || u._role === 'raj'
        ? (8 + (u.email.length % 10)) * H
        : (12 + (u.email.charCodeAt(2) % 30)) * H;
    await backdate(u, 30 * D + (u._fillIdx || 0) * 37 * 60 * 1000, activeAgo);
  }

  const world = {
    byRole,
    byEmail,
    castUsers,
    matches,
    kabirReporters: kabirReporters.map((r) => r._id),
    connectors: { anikaRohan: matches['anika-rohan']._id, drishtiRaj: matches['drishti-raj']._id, sanyaNishant: matches['sanya-nishant']._id },
  };

  await disconnectMongo();
  return world;
}
```

