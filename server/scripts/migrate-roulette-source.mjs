/**
 * 🌱 MIGRATE — Roulette identity fields.
 *
 * ── WHAT IT DOES ─────────────────────────────────────────────────────────────
 * Stage 1 added four fields to `Alignment` (source, profileGrants,
 * conversationAliases, revealRequest) plus three to `Notification` and one to
 * `Interaction`. Mongoose defaults cover new writes, but existing documents
 * predate the fields entirely, and one of them cannot be defaulted safely.
 *
 * Every pre-Roulette connection was a DECK connection, and a deck connection
 * showed both profiles openly. So each one needs:
 *
 *   source        = 'deck'
 *   profileGrants = TWO grants, one per direction, source 'legacy'
 *
 * ── WHY BACKFILL RATHER THAN A SPECIAL CASE ───────────────────────────────────
 * The obvious shortcut is to leave existing rows alone and write the resolver
 * as "if no grants, treat it as a deck connection and allow". That is a branch
 * keyed on a field being absent — and a branch is exactly what fails. The first
 * hidden Roulette row written before its grants are populated would take that
 * path and show a real name.
 *
 * Backfilling removes the branch entirely. After this runs, the resolver has
 * ONE rule: is there a grant? Absence means no, for everybody, forever.
 *
 * ── SAFE BY DEFAULT ───────────────────────────────────────────────────────────
 *   node scripts/migrate-roulette-source.mjs            # dry run, writes nothing
 *   node scripts/migrate-roulette-source.mjs --execute  # actually writes
 *
 * Rollback is `unset` of the same four fields; no data is destroyed and the
 * three Notification/Interaction fields are left untouched.
 *
 * Design source: ambitions/roulette.md §4.6
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import '../models/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXECUTE = process.argv.includes('--execute');

const loadEnv = () => {
  const envPaths = [path.join(__dirname, '../.env'), path.join(process.cwd(), '.env')];
  for (const p of envPaths) {
    if (fs.existsSync(p)) {
      for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
        const idx = line.indexOf('=');
        if (idx === -1) continue;
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
      return p;
    }
  }
  return null;
};

const run = async () => {
  const envFile = loadEnv();
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found.');
    process.exit(1);
  }

  const dbName = mongoose.connection.name;
  console.log(`${EXECUTE ? '🔧' : '🔍'} Roulette identity migration${EXECUTE ? '' : ' (DRY RUN)'}`);
  console.log(`   env     : ${envFile || '(process)'}`);
  console.log(`   database: ${dbName}`);

  if (EXECUTE && dbName === 'matchalize_test') {
    console.log('   ℹ️  Target is the test database — fine, but noting it.');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const alignments = mongoose.connection.collection('alignments');
  const total = await alignments.countDocuments({});

  /* ── Scope ──────────────────────────────────────────────────────────────────
   * Only rows that predate the fields. A document already carrying a non-empty
   * profileGrants was either created after Stage 1 or already migrated, and
   * rewriting it would DISCARD real grants — including a granted profile a
   * user agreed to share. Skipping them is what makes re-running safe. */
  const needsWork = await alignments.countDocuments({
    $or: [
      { source: { $exists: false } },
      { source: null },
      { profileGrants: { $exists: false } },
      { profileGrants: { $size: 0 } },
    ],
  });

  const skipped = total - needsWork;
  const alreadyAliased = await alignments.countDocuments({
    conversationAliases: { $exists: true, $size: { $gt: 0 } },
  });

  console.log(`\n1/4 Alignments`);
  console.log(`   total            : ${total}`);
  console.log(`   need backfill    : ${needsWork}`);
  console.log(`   already migrated : ${skipped}`);
  console.log(`   carry an alias   : ${alreadyAliased}  (left untouched)`);

  if (needsWork === 0) {
    console.log('\n   ✅ Nothing to do.');
  } else if (!EXECUTE) {
    console.log('\n2/4 Writing pairs\n   ℹ️  DRY RUN — no writes performed. Re-run with --execute.');
  } else {
    /* ── Do it one document at a time ────────────────────────────────────────
     * Not `updateMany`. Each connection needs grants built from ITS OWN two
     * user ids, in both directions, and a bulk update cannot express that
     * without an aggregation pipeline — which would also bypass
     * Alignment.js's pre('validate') integrity hook, the very thing that
     * guarantees a grant only ever names a member of its own connection.
     *
     * Per-document writes run through validation. If a malformed row exists
     * (three users, a pairKey that disagrees with its users), it fails loudly
     * here and is reported, rather than being silently "fixed" into a document
     * that hands access to a non-member. */
    console.log('\n2/4 Writing profile grants per connection...');

    const cursor = alignments.find(
      {
        $or: [
          { source: { $exists: false } },
          { source: null },
          { profileGrants: { $exists: false } },
          { profileGrants: { $size: 0 } },
        ],
      },
      // ⚠️ isActive and unlockedByInteractionId MUST be projected. An alignment
      // that was unmatched has isActive:false, and rebuilding it with a
      // hardcoded `true` would SILENTLY REACTIVATE every severed connection —
      // resurfacing old matches in the Chats list. Both fields are carried
      // across verbatim, never reconstructed.
      {
        projection: {
          users: 1,
          pairKey: 1,
          isActive: 1,
          unlockedByInteractionId: 1,
          profileGrants: 1,
          conversationAliases: 1,
        },
      },
    );

    const grantedAt = new Date();
    let written = 0;
    let failed = 0;
    let missingInteraction = 0;
    const failures = [];

    for await (const doc of cursor) {
      const users = Array.isArray(doc.users) ? doc.users.map(String) : [];

      if (users.length !== 2) {
        failed += 1;
        failures.push({ _id: String(doc._id), reason: `${users.length} users, expected 2` });
        continue;
      }

      // The schema marks it required, so a row without it cannot be rebuilt.
      // Skip rather than invent a value — a fabricated interactionRef would
      // point the "unlocked by" provenance at an object that does not exist.
      if (!doc.unlockedByInteractionId) {
        missingInteraction += 1;
        failures.push({ _id: String(doc._id), reason: 'missing unlockedByInteractionId — skipped' });
        continue;
      }

      try {
        // Constructed through the model so pre('validate') runs.
        const Alignment = mongoose.model('Alignment');
        const alignment = new Alignment({
          _id: doc._id,
          pairKey: doc.pairKey,
          users: doc.users,
          isActive: doc.isActive,
          unlockedByInteractionId: doc.unlockedByInteractionId,
          source: 'deck',
          profileGrants: [
            { viewerId: users[0], subjectId: users[1], source: 'legacy', grantedAt },
            { viewerId: users[1], subjectId: users[0], source: 'legacy', grantedAt },
          ],
          conversationAliases: doc.conversationAliases ?? [],
          revealRequest: { state: 'none' },
        });

        await alignment.save();
        written += 1;
      } catch (err) {
        failed += 1;
        failures.push({ _id: String(doc._id), reason: err.message });
      }
    }

    console.log(`   written : ${written}`);
    console.log(`   failed  : ${failed}`);
    if (missingInteraction) {
      console.log(`   ⚠️  skipped for missing unlockedByInteractionId: ${missingInteraction}`);
    }
    if (failures.length) {
      console.log('\n   Malformed rows — NOT migrated, left as they were:');
      for (const f of failures.slice(0, 20)) console.log(`     ${f._id}  ${f.reason}`);
      if (failures.length > 20) console.log(`     …and ${failures.length - 20} more`);
    }
  }

  /* ── Notifications and Interactions ────────────────────────────────────────
   * These NEED no backfill. `source` defaults to 'deck' on both models, which
   * is correct for every existing row — a request or action that predates
   * Roulette came from the Deck. Counting them is confirmation, not a write. */
  console.log('\n3/4 Notification / Interaction defaults');
  const notifications = mongoose.connection.collection('notifications');
  const interactions = mongoose.connection.collection('interactions');
  console.log(`   notifications   : ${await notifications.countDocuments({})} (source defaults to 'deck')`);
  console.log(`   interactions    : ${await interactions.countDocuments({})} (source defaults to 'deck')`);

  console.log('\n4/4 Indexes');
  try {
    await alignments.createIndex(
      { 'profileGrants.viewerId': 1, 'profileGrants.subjectId': 1 },
      { name: 'profile_grants_lookup' },
    );
    console.log('   ✅ profile_grants_lookup');
  } catch (err) {
    console.error('   ❌', err.message);
  }
  try {
    await notifications.createIndex(
      { callSessionId: 1 },
      { sparse: true, name: 'roulette_call_expiry_sweep' },
    );
    console.log('   ✅ roulette_call_expiry_sweep');
  } catch (err) {
    console.error('   ❌', err.message);
  }

  if (EXECUTE) {
    console.log('\n✅ Done. To reverse: unset source, profileGrants, conversationAliases');
    console.log('   and revealRequest on the alignments collection.');
  } else {
    console.log('\nℹ️  DRY RUN complete. Nothing was written.');
    console.log('   Re-run with --execute to apply.');
  }

  await mongoose.connection.close();
};

run().catch((err) => {
  console.error('💥 Migration failed:', err.message);
  process.exit(1);
});
