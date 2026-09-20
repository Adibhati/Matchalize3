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