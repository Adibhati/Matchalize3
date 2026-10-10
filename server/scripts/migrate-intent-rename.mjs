/**
 * 🔀 INTENT RENAME MIGRATION — "Study Buddy" → "Activity Partner"
 *
 * Why a rename needs a data migration at all: `intent` is a RANKING SIGNAL. The
 * deck boosts candidates whose intent overlaps the viewer's. A profile still
 * holding the retired string "Study Buddy" will therefore stop overlapping
 * anyone who picked "Activity Partner" — and because both values are valid
 * strings, nothing errors. It just quietly stops producing matches, which reads
 * as broken matchmaking rather than a leftover label.
 *
 * Safe to re-run: it only writes documents whose intent actually changes, and
 * `--dry-run` (the default) reports without touching anything.
 *
 * Deliberately does NOT dedupe. Someone who somehow held both "Study Buddy" and
 * "Activity Partner" ends up with one entry after mapping, which is correct —
 * they now have a single intent, and the MAX_INTENTS cap is enforced on the
 * next profile write rather than silently expanded here.
 *
 * USAGE
 *   node server/scripts/migrate-intent-rename.mjs            # report only
 *   node server/scripts/migrate-intent-rename.mjs --execute  # apply
 */
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEPRECATED_INTENTS } from '../config/appData.js';

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

const mapping = Object.entries(DEPRECATED_INTENTS);
if (mapping.length === 0) {
  console.log('No deprecated intents defined — nothing to migrate.');
  process.exit(0);
}
console.log(`Mapping: ${mapping.map(([a, b]) => `"${a}" -> "${b}"`).join(', ')}`);
console.log(EXECUTE ? 'Mode: EXECUTE' : 'Mode: DRY RUN (pass --execute to apply)\n');

await mongoose.connect(URI);
const db = mongoose.connection.db;

let changed = 0;
let unchanged = 0;

for (const [oldValue, newValue] of mapping) {
  const affected = await db
    .collection('users')
    .find({ intent: oldValue }, { projection: { intent: 1 } })
    .toArray();

  if (affected.length === 0) {
    console.log(`  "${oldValue}": 0 users — nothing to do.`);
    continue;
  }

  for (const doc of affected) {
    const next = [...new Set(doc.intent.map((v) => (v === oldValue ? newValue : v)))];
    if (next.length === doc.intent.length && next.every((v, i) => v === doc.intent[i])) {
      unchanged += 1;
      continue;
    }
    changed += 1;
    console.log(`  ${String(doc._id)}: ${JSON.stringify(doc.intent)} -> ${JSON.stringify(next)}`);
    if (EXECUTE) {
      await db.collection('users').updateOne({ _id: doc._id }, { $set: { intent: next } });
    }
  }
}

console.log(`\n${EXECUTE ? 'Applied' : 'Would apply'} ${changed} change(s); ${unchanged} already correct.`);

/* Leave no profile holding a value the API no longer serves. Not an error
   either way — this is a data-hygiene report, and a failure here means the
   mapping is out of sync with config/appData.js, which IS worth failing on. */
const remaining = [];
for (const [oldValue] of mapping) {
  const n = await db.collection('users').countDocuments({ intent: oldValue });
  if (n > 0) remaining.push(`"${oldValue}" x${n}`);
}
if (remaining.length) {
  console.log(`\n⚠️  Still present: ${remaining.join(', ')}`);
  if (EXECUTE) {
    console.error('Migration did not converge. Check DEPRECATED_INTENTS against stored values.');
    await mongoose.disconnect();
    process.exit(1);
  }
} else {
  console.log('\n✅ No deprecated intent values remain.');
}

await mongoose.disconnect();
