/**
 * ♻️ ANNUAL RE-VERIFICATION SWEEP
 *
 * Flips accounts to `reverify_due` once their annual check is past due AND the
 * grace window has expired. Runs once a day; safe to re-run.
 *
 * ⚠️ WHY THIS DOESN'T DELETE ANYTHING
 *
 * A missing email is not proof that someone is an impostor — college mail
 * servers fail, mailboxes get forwarded, alumni addresses outlive enrolment.
 * This job only changes a flag that makes the client ASK for a code. Removal is
 * always a human decision.
 *
 * Run manually:  node server/scripts/reverify-sweep.mjs
 */
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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

const GRACE_DAYS = 14;
const DRY_RUN = !process.argv.includes('--execute');

const run = async () => {
  const envFile = loadEnv();
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in server/.env');
    process.exit(1);
  }
  console.log(`📄 env: ${envFile}`);
  console.log(`🔍 mode: ${DRY_RUN ? 'report only' : '⚠️  EXECUTE'}`);

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`✅ MongoDB: ${mongoose.connection.host}/${mongoose.connection.name}\n`);

  const now = Date.now();
  const graceCutoff = new Date(now - GRACE_DAYS * 24 * 60 * 60 * 1000);

  const due = await User.find({
    reverifyDue: { $ne: null, $lt: graceCutoff },
    status: { $ne: 'reverify_due' },
    isDeleted: { $ne: true },
    suspended: { $ne: true },
  })
    .select('name email status reverifyDue college')
    .lean();

  console.log(`accounts past due + past ${GRACE_DAYS}-day grace   ${due.length}`);
  console.log(`(no accounts are deleted by this job — it sets status = reverify_due)\n`);

  if (!due.length) {
    console.log('✅ Nothing to do.');
    await mongoose.disconnect();
    return;
  }

  due.slice(0, 15).forEach((u) => {
    const overdueBy = Math.round((now - new Date(u.reverifyDue).getTime()) / (24 * 60 * 60 * 1000));
    console.log(`   ${(u.name || u.email).padEnd(28)} due ${String(u.reverifyDue).slice(0, 10)}  (${overdueBy}d past)`);
  });
  if (due.length > 15) console.log(`   ... and ${due.length - 15} more`);

  if (DRY_RUN) {
    console.log('\n📋 Report only. Re-run with --execute to flag them.');
    await mongoose.disconnect();
    return;
  }

  const result = await User.updateMany(
    { _id: { $in: due.map((u) => u._id) } },
    { $set: { status: 'reverify_due' } },
  );
  console.log(`\n✅ Flagged ${result.modifiedCount} account(s) as reverify_due.`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('❌ Sweep failed:', err?.error?.message || err?.message || err);
  process.exit(1);
});