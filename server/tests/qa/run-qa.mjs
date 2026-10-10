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