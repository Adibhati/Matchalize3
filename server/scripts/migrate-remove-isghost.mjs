/**
 * 👻 isGhost REMOVAL MIGRATION
 *
 * `isGhost` used to be one sticker for two different facts — "moderated" and
 * "deleted" — and the admin panel only half-synced it with `shadowbannedAt`,
 * so counts and toggles disagreed. Every writer now uses the real markers
 * (`shadowbannedAt`, `isDeleted`); this script finishes the job:
 *
 *   1. Any account still carrying `isGhost: true` that is NOT deleted gets its
 *      `shadowbannedAt` set (if it lacks one), so hiding them keeps working.
 *   2. `isGhost` is $unset everywhere.
 *   3. The old deck filter index is dropped; Mongoose recreates the new one
 *      (keyed on `shadowbannedAt`) on next app boot.
 *
 * Safe to re-run. DRY RUN unless --execute is passed.
 *
 * USAGE
 *   node server/scripts/migrate-remove-isghost.mjs            # report only
 *   node server/scripts/migrate-remove-isghost.mjs --execute  # apply
 */
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const envPath = path.join(root, 'server/.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    process.env[t.slice(0, i).trim()] ??= t.slice(i + 1).trim();
  }
}

const EXECUTE = process.argv.includes('--execute');
const URI = process.env.MONGODB_URI;
if (!URI) {
  console.error('❌ MONGODB_URI is not set. Refusing to guess a database.');
  console.error('   Set it in server/.env — never run this against an unintended target.');
  process.exit(1);
}

console.log(EXECUTE ? 'Mode: EXECUTE' : 'Mode: DRY RUN (pass --execute to apply)\n');

await mongoose.connect(URI);
const db = mongoose.connection.db;
const users = db.collection('users');

const needsShadowbanDate = await users.countDocuments({ isGhost: true, isDeleted: { $ne: true }, shadowbannedAt: null });
const needsUnset = await users.countDocuments({ isGhost: { $exists: true } });
console.log(`Users whose isGhost=true will gain a shadowbannedAt date: ${needsShadowbanDate}`);
console.log(`Users carrying the isGhost field at all (will be unset):   ${needsUnset}`);

if (EXECUTE) {
  const r1 = await users.updateMany(
    { isGhost: true, isDeleted: { $ne: true }, shadowbannedAt: null },
    { $set: { shadowbannedAt: new Date() } },
  );
  console.log(`Set shadowbannedAt on ${r1.modifiedCount} users.`);

  const r2 = await users.updateMany({}, { $unset: { isGhost: '' } });
  console.log(`Unset isGhost on ${r2.modifiedCount} users.`);

  try {
    await users.dropIndex('discover_deck_filter_index');
    console.log('Dropped old discover_deck_filter_index — Mongoose recreates it on boot.');
  } catch {
    console.log('Old discover_deck_filter_index not present — nothing to drop.');
  }
}

await mongoose.disconnect();
