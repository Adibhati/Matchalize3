import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

/**
 * 🧹 DROP THE ORPHANED WAITLIST COLLECTION.
 *
 * Removing the waitlist removed the code. This removes what the code left
 * behind: a `waitlist` collection, and the indexes it created, still sitting
 * in the database with nothing reading them.
 *
 * Why bother, since it is inert:
 *   - It holds real email addresses that people submitted. Those addresses
 *     were collected for a purpose that no longer exists, and leaving them is
 *     the kind of thing that becomes a privacy question the day you notice.
 *   - An orphaned indexed collection is invisible in every dashboard except a
 *     database browser, which is precisely why it gets forgotten.
 *
 * ── WHY THIS IS DESTRUCTIVE, AND WHY IT STILL ASKS ──────────────────────────
 * There is no undo without a backup. The dry-run default prints the exact row
 * count and the addresses involved so that decision is an informed one rather
 * than a reflex — and if the count is anything other than what you expected,
 * that is a reason to stop and read the list before passing --execute.
 *
 *   node server/scripts/drop-waitlist.mjs            # report only
 *   node server/scripts/drop-waitlist.mjs --execute  # drop it
 */

const EXECUTE = process.argv.includes('--execute');

const run = async () => {
  const envFile = loadEnv();
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found. Set it in server/.env.');
    process.exit(1);
  }
  console.log(`📄 env: ${envFile}`);
  console.log(`🔍 mode: ${EXECUTE ? '⚠️  EXECUTE — collection will be DROPPED' : 'report only'}`);

  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  console.log(`🗄  db:  ${mongoose.connection.host}/${mongoose.connection.name}\n`);

  const exists = await db.listCollections({ name: 'waitlist' }).hasNext();

  if (!exists) {
    console.log('✅ No `waitlist` collection in this database. Nothing to do.');
    await mongoose.disconnect();
    return;
  }

  const count = await db.collection('waitlist').countDocuments({});
  const indexes = await db.collection('waitlist').indexes();
  console.log(`collection: waitlist`);
  console.log(`   documents: ${count}`);
  console.log(`   indexes:   ${indexes.length}`);

  if (count > 0) {
    // These are real addresses people typed in. Print them so the decision to
    // delete is made with the data in front of you, not in the abstract.
    const rows = await db.collection('waitlist')
      .find({}, { projection: { email: 1, name: 1, tier: 1, createdAt: 1 } })
      .sort({ createdAt: 1 })
      .limit(100)
      .toArray();

    console.log('\naddresses that will be deleted:');
    for (const r of rows) {
      const when = r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : '?';
      console.log(`   ${String(r.email || '(none)').padEnd(38)} ${when}  ${r.tier || ''}`);
    }
    if (rows.length < count) console.log(`   … and ${count - rows.length} more`);
  }

  if (!EXECUTE) {
    console.log('\n📋 Report only. Re-run with --execute to drop the collection.');
    await mongoose.disconnect();
    return;
  }

  await db.collection('waitlist').drop();
  console.log('\n✅ Dropped collection: waitlist (documents and indexes).');
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('❌ Failed:', err?.error?.message || err?.message || err);
  process.exit(1);
});