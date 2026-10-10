/**
 * 🧹 CLOUDINARY ORPHAN AUDIT
 *
 * Recovers the storage lost to the deleted-message media leak
 * (routes/messages.js:286 passed no userId, so the ownership guard refused every
 * cleanup and the file stayed in Cloudinary forever).
 *
 * That bug is fixed, but the files it orphaned are still in Cloudinary and still
 * count against the storage cap. This script finds them.
 *
 * HOW IT DECIDES: every Cloudinary asset under matchalize/ is listed from the
 * Cloudinary Admin API, then compared against every media URL still referenced
 * in MongoDB. Anything in Cloudinary that no live record points at is an orphan.
 * Soft-deleted messages are excluded from the reference set because their
 * image/mediaUrl were blanked at messages.js:291-292 — so their assets are
 * correctly reported as orphans.
 *
 * 🔒 READ-ONLY BY DEFAULT. Nothing is destroyed unless you pass --execute.
 *
 * USAGE
 *   node server/scripts/audit-cloudinary-orphans.mjs
 *   node server/scripts/audit-cloudinary-orphans.mjs --execute
 *   node server/scripts/audit-cloudinary-orphans.mjs --execute --min-age-hours 48
 *
 * Before --execute, read the report and sanity-check the count. A large number
 * is expected if the leak ran for a while. A number that looks *too* high (e.g.
 * most of your library) means a reference field was missed below — abort.
 */
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import { extractCloudinaryPublicId } from '../utils/media.js';
import User from '../models/User.js';
import Message from '../models/Message.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const loadEnv = () => {
  for (const p of [path.join(__dirname, '../.env'), path.join(process.cwd(), '.env')]) {
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const idx = line.indexOf('=');
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      if (!process.env[key]) process.env[key] = line.slice(idx + 1).trim();
    }
    return p;
  }
  return null;
};

const argv = process.argv.slice(2);
const EXECUTE = argv.includes('--execute');
const minAgeArg = argv.indexOf('--min-age-hours');
const MIN_AGE_HOURS = minAgeArg !== -1 ? Number(argv[minAgeArg + 1]) : 24;

const bytesToMb = (b) => (b / 1024 / 1024).toFixed(1);

/** Every media URL still referenced by a live record. */
const collectReferenced = async () => {
  const refs = new Set();
  let refCount = 0;

  const users = await User.find(
    { $or: [{ 'photos.0': { $exists: true } }, { bioPhoto: { $nin: ['', null] } }, { 'prompts.0': { $exists: true } }] },
    { photos: 1, bioPhoto: 1, prompts: 1 }
  ).lean();

  const addRef = (url) => {
    if (!url) return;
    refs.add(url);
    refCount += 1;
  };

  for (const u of users) {
    for (const url of u.photos || []) addRef(url);
    addRef(u.bioPhoto);
    for (const p of u.prompts || []) addRef(p?.photoUrl);
  }

  const messages = await Message.find(
    { $or: [{ mediaUrl: { $nin: ['', null] } }, { image: { $nin: ['', null] } }] },
    { mediaUrl: 1, image: 1 }
  ).lean();

  for (const m of messages) {
    addRef(m.mediaUrl);
    addRef(m.image);
  }

  return { refs, refCount, users: users.length, messages: messages.length };
};

/**
 * All Cloudinary assets this app owns, for both resource types.
 *
 * Prefix is `matchalize` with NO trailing slash on purpose: the current layout
 * is matchalize/photos/<userId>/, but an older one used matchalize_messages/.
 * Scanning `matchalize/` alone would silently skip the legacy folder and hide
 * its orphans. Known legacy public_ids:
 *   matchalize_messages/<file>            — pre-per-user-folder uploads
 *
 * Note the param name: the Admin API takes `resource_type` ('image' | 'video').
 * `type` means the delivery type ('upload' | 'private' | 'authenticated') —
 * passing `type: 'image'` fails with "Invalid value image for parameter type".
 */
const listCloudAssets = async () => {
  const assets = [];
  for (const resourceType of ['image', 'video']) {
    let cursor;
    do {
      const res = await cloudinary.api.resources({
        resource_type: resourceType,
        type: 'upload',
        prefix: 'matchalize',
        max_results: 500,
        ...(cursor ? { next_cursor: cursor } : {}),
      });
      for (const r of res.resources || []) {
        assets.push({
          public_id: r.public_id,
          resource_type: r.resource_type || resourceType,
          bytes: r.bytes || 0,
          created_at: r.created_at,
        });
      }
      cursor = res.next_cursor;
    } while (cursor);
  }
  return assets;
};

const run = async () => {
  const envFile = loadEnv();
  console.log(`📄 env: ${envFile || 'none (using process env)'}`);
  console.log(`🔍 mode: ${EXECUTE ? '⚠️  EXECUTE (will destroy)' : 'read-only (report only)'}`);
  console.log(`⏳ grace period: skipping assets newer than ${MIN_AGE_HOURS}h\n`);

  const missing = ['MONGODB_URI', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
    .filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`❌ Missing env: ${missing.join(', ')}`);
    process.exit(1);
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`✅ MongoDB: ${mongoose.connection.host}/${mongoose.connection.name}`);

  const { refs, refCount, users, messages } = await collectReferenced();
  console.log(`   referenced URLs: ${refCount} (from ${users} users, ${messages} messages)`);

  const assets = await listCloudAssets();
  console.log(`   Cloudinary assets under matchalize*: ${assets.length}\n`);

  const referencedIds = new Set();
  for (const url of refs) {
    const id = extractCloudinaryPublicId(url);
    if (id) referencedIds.add(id);
  }

  const cutoff = Date.now() - MIN_AGE_HOURS * 3600 * 1000;
  const tooRecent = [];
  const orphans = [];
  for (const a of assets) {
    if (new Date(a.created_at).getTime() > cutoff) tooRecent.push(a);
    else if (!referencedIds.has(a.public_id)) orphans.push(a);
  }

  const orphanBytes = orphans.reduce((s, a) => s + a.bytes, 0);
  const totalBytes = assets.reduce((s, a) => s + a.bytes, 0);

  console.log('───────────────��──────────────────────────────');
  console.log(`  Reachable      ${assets.length - orphans.length - tooRecent.length}`);
  console.log(`  Too recent      ${tooRecent.length}  (inside grace period, untouched)`);
  console.log(`  ORPHANS         ${orphans.length}  ← ${bytesToMb(orphanBytes)} MB reclaimable`);
  console.log(`  Total library   ${bytesToMb(totalBytes)} MB`);
  console.log('─────────────────────────────────────────────');

  if (!orphans.length) {
    console.log('\n✅ No orphans. Nothing to reclaim.');
    await mongoose.disconnect();
    return;
  }

  console.log('\nOldest 10 orphans:');
  orphans
    .slice()
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .slice(0, 10)
    .forEach((a) => console.log(`   ${a.created_at.slice(0, 10)}  ${bytesToMb(a.bytes).padStart(6)} MB  ${a.public_id}`));
  if (orphans.length > 10) console.log(`   ... and ${orphans.length - 10} more`);

  if (!EXECUTE) {
    console.log('\n📋 Report only. Re-run with --execute to destroy these.');
    await mongoose.disconnect();
    return;
  }

  console.log(`\n⚠️  Destroying ${orphans.length} orphan(s)...`);
  let failed = 0;
  for (const a of orphans) {
    try {
      const r = await cloudinary.uploader.destroy(a.public_id, { resource_type: a.resource_type });
      if (r?.result !== 'ok') {
        failed++;
        console.warn(`   ⚠️  ${r?.result || 'unknown'} ${a.public_id}`);
      }
    } catch (e) {
      failed++;
      console.warn(`   ❌ ${a.public_id}: ${e.message}`);
    }
  }
  console.log(`\n✅ Destroyed ${orphans.length - failed}/${orphans.length} (${failed} failed).`);
  console.log(`   Reclaimed up to ${bytesToMb(orphanBytes)} MB.`);
  await mongoose.disconnect();
};

run().catch((err) => {
  // Cloudinary SDK errors put the useful text on err.error.message and leave
  // err.message undefined, so surface both.
  console.error('❌ Audit failed:', err?.error?.message || err?.message || err);
  process.exit(1);
});