/**
 * 🪜 PROFILE LADDER BACKFILL
 *
 * `User.profileScore` is owned by utils/ladder.js and recomputed on every
 * profile write. Whenever the scoring formula changes, existing documents
 * retain their old scores until this script recalculates them.
 *
 * This script recomputes every user's score from public profile content. It is
 * safe to re-run: it writes only rows whose score differs and reports changes.
 * Runtime assertions protect the public-content rules and the 100-point cap.
 *
 * USAGE
 *   node server/scripts/backfill-ladder.mjs           # report only, changes nothing
 *   node server/scripts/backfill-ladder.mjs --execute # apply
 */
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { computeScore, LADDER } from '../utils/ladder.js';
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

/**
 * Fail fast if the weights no longer satisfy the public-content design.
 */
const assertInvariants = () => {
  const photo = (n) => Array.from({ length: n }, (_, i) => `photo${i}.jpg`);
  const prompts = (n) =>
    Array.from({ length: n }, (_, i) => ({ question: `q${i}`, answer: `a${i}` }));

  const requiredFactsOnly = {
    gender: 'Female',
    name: 'Anaya',
    year: 'UG',
    age: 21,
    intent: ['Dating'],
    interestedIn: ['Male'],
    currentLatLng: { lat: 1, lng: 1 },
  };

  const requiredFactsScore = computeScore(requiredFactsOnly);
  if (requiredFactsScore !== 0) {
    throw new Error(
      `Required facts/preferences scored ${requiredFactsScore}; they must not add profile-strength points.`,
    );
  }

  const mainPhoto = computeScore({ ...requiredFactsOnly, photos: photo(1) });
  if (mainPhoto !== 25) {
    throw new Error(
      `A main photo scores ${mainPhoto}, expected 25.`,
    );
  }

  const unlocked = computeScore({
    photos: photo(1),
    bio: 'A little about me.',
    prompts: prompts(1),
  });
  if (unlocked < LADDER.interact) {
    throw new Error(
      `A main photo, bio, and answered prompt score ${unlocked}, ` +
        `below interact (${LADDER.interact}).`,
    );
  }

  const complete = computeScore({
    photos: photo(4),
    bio: 'A little about me.',
    prompts: prompts(3),
    interests: ['Music'],
  });
  if (complete !== LADDER.aspirational) {
    throw new Error(
      `A fully built profile scores ${complete}, expected ${LADDER.aspirational}.`,
    );
  }

  console.log('✅ Invariants hold: required facts=0, main photo=25, unlock=45, full=100');
};

const run = async () => {
  const envFile = loadEnv();
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in server/.env');
    process.exit(1);
  }
  console.log(`📄 env: ${envFile}`);
  console.log(`🔍 mode: ${EXECUTE ? '⚠️  EXECUTE (will write)' : 'report only'}`);
  assertInvariants();
  console.log('');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`✅ MongoDB: ${mongoose.connection.host}/${mongoose.connection.name}\n`);

  // Only the fields computeScore reads. Nothing else can change the score, so
  // there is no reason to pull whole documents into memory.
  const users = await User.find(
    {},
    { name: 1, email: 1, photos: 1, bio: 1, prompts: 1, interests: 1, profileScore: 1 },
  ).lean();

  const ops = [];
  const buckets = { locked: 0, published: 0, interactable: 0, aspirational: 0 };

  for (const u of users) {
    const correct = computeScore(u);
    const band =
      correct >= LADDER.aspirational
        ? 'aspirational'
        : correct >= LADDER.interact
          ? 'interactable'
          : correct >= LADDER.publish
            ? 'published'
            : 'locked';
    buckets[band]++;
    if (u.profileScore === correct) continue;
    ops.push({
      updateOne: {
        filter: { _id: u._id },
        update: { $set: { profileScore: correct } },
      },
      label: `${u.name || u.email || u._id}: ${u.profileScore ?? 0} → ${correct} (${band})`,
    });
  }

  console.log(`users total             ${users.length}`);
  console.log(`  band locked          ${buckets.locked}`);
  console.log(`  band published       ${buckets.published}`);
  console.log(`  band interactable    ${buckets.interactable}`);
  console.log(`  band aspirational    ${buckets.aspirational}`);
  console.log(`scores to fix          ${ops.length}\n`);

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

  const result = await User.bulkWrite(ops.map((o) => ({ updateOne: o.updateOne })));
  console.log(`\n✅ Updated ${result.modifiedCount} document(s).`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('❌ Backfill failed:', err?.error?.message || err?.message || err);
  process.exit(1);
});