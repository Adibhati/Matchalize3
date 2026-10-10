/**
 * 🪜 PROFILE LADDER BACKFILL
 *
 * `User.profileScore` is owned by utils/ladder.js and recomputed on every
 * profile write. But documents that existed BEFORE the field landed never go
 * through a write, so they keep the schema default of 0.
 *
 * That matters more than it looks: 0 is below LADDER.publish (45), so every
 * pre-existing user would read as "not published" the moment the deck starts
 * gating on this — they'd lose their deck until they edited their profile once.
 *
 * This script recomputes the score for every user from the fields already on
 * the document. Safe to re-run: it only writes rows whose score actually
 * differs, and reports what it changed.
 *
 * It also carries the ladder's invariants as runtime assertions. Re-weighting
 * WEIGHTS in utils/ladder.js without preserving the gate promise would ship a
 * gate that tells users "add a photo and a prompt" and then keeps them locked
 * — so this script fails loudly instead.
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
 * Fail fast if the weights no longer satisfy the design. These are cheap and
 * they protect the one promise the gate makes out loud.
 */
const assertInvariants = () => {
  const photo = (n) => Array.from({ length: n }, (_, i) => `photo${i}.jpg`);
  const prompts = (n) =>
    Array.from({ length: n }, (_, i) => ({ question: `q${i}`, answer: `a${i}` }));

  const publishSet = {
    photos: photo(1),
    gender: 'Female',
    name: 'Anaya',
    year: 'UG',
    intent: ['Dating'],
  };

  const publish = computeScore(publishSet);
  if (publish !== LADDER.publish) {
    throw new Error(
      `Publish band scores ${publish}, expected ${LADDER.publish}. ` +
        `The 0→${LADDER.publish} weights no longer sum to the threshold.`,
    );
  }

  const unlocked = computeScore({ ...publishSet, photos: photo(2), prompts: prompts(1) });
  if (unlocked < LADDER.interact) {
    throw new Error(
      `GATE INVARIANT BROKEN: one photo + one prompt scores ${unlocked}, ` +
        `which is below interact (${LADDER.interact}). The gate would promise ` +
        `an unlock and then keep the user locked. photo2 + prompt1 must sum ` +
        `to ${LADDER.interact - LADDER.publish}.`,
    );
  }

  const complete = computeScore({ ...publishSet, photos: photo(4), prompts: prompts(3) });
  if (complete !== LADDER.aspirational) {
    throw new Error(
      `A fully built profile scores ${complete}, expected ${LADDER.aspirational}.`,
    );
  }

  console.log('✅ Invariants hold: publish=45, photo+prompt unlocks, full=100');
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
    { name: 1, email: 1, photos: 1, prompts: 1, gender: 1, year: 1, intent: 1, profileScore: 1 },
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