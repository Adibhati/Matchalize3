/**
 * 🎂 AGE BACKFILL
 *
 * `User.age` is written once during onboarding and never refreshed, so it drifts
 * by one year every birthday. The Discover deck and the Matches/Chat surfaces no
 * longer read it — they derive a current age from `dob` at request time (see
 * utils/age.js). But three surfaces still read the stored field, because they
 * can't compute on read:
 *
 *   - routes/notifications.js   → `.populate('senderId', '... age ...')`
 *   - GET /api/auth/me          → full document
 *   - GET /api/users/profile    → full document
 *
 * This script recomputes `age` from `dob` for every user so those three are
 * correct. Safe to re-run any time: it only writes rows whose age actually
 * differs, and reports what it changed.
 *
 * USAGE
 *   node server/scripts/backfill-age.mjs           # report only, changes nothing
 *   node server/scripts/backfill-age.mjs --execute # apply
 */
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { computeAgeFromDob } from '../utils/age.js';
import User from '../models/User.js';

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

const EXECUTE = process.argv.includes('--execute');

const run = async () => {
  const envFile = loadEnv();
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in server/.env');
    process.exit(1);
  }
  console.log(`📄 env: ${envFile}`);
  console.log(`🔍 mode: ${EXECUTE ? '⚠️  EXECUTE (will write)' : 'report only'}`);

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`✅ MongoDB: ${mongoose.connection.host}/${mongoose.connection.name}\n`);

  // Only users who actually have a dob can be recomputed. Users without one
  // keep whatever age they have (or null) — we must not invent a value.
  const users = await User.find({ dob: { $ne: null } }, { age: 1, dob: 1, name: 1, email: 1 }).lean();

  const ops = [];
  let noDob = 0;
  for (const u of users) {
    const correct = computeAgeFromDob(u.dob);
    if (correct === null) { noDob++; continue; }
    if (u.age === correct) continue;
    ops.push({
      updateOne: {
        filter: { _id: u._id },
        update: { $set: { age: correct } },
      },
      label: `${u.name || u.email || u._id}: ${u.age ?? 'null'} → ${correct}`,
    });
  }

  const [total, withDob] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ dob: { $ne: null } }),
  ]);
  const noDobAnywhere = total - withDob;

  console.log(`users total          ${total}`);
  console.log(`with a dob           ${withDob}`);
  console.log(`without a dob        ${noDobAnywhere}  (age left as-is)`);
  console.log(`unparseable dob      ${noDob}`);
  console.log(`stale ages to fix    ${ops.length}\n`);

  if (!ops.length) {
    console.log('✅ Nothing to backfill.');
    await mongoose.disconnect();
    return;
  }

  ops.slice(0, 15).forEach((o) => console.log(`   ${o.label}`));
  if (ops.length > 15) console.log(`   ... and ${ops.length - 15} more`);

  if (!EXECUTE) {
    console.log('\n📋 Report only. Re-run with --execute to apply.');
    await mongoose.disconnect();
    return;
  }

  const result = await User.bulkWrite(ops.map((o) => o.updateOne));
  console.log(`\n✅ Updated ${result.modifiedCount} document(s).`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('❌ Backfill failed:', err?.error?.message || err?.message || err);
  process.exit(1);
});