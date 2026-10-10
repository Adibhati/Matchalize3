import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import College from '../models/College.js';

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
 * 🏫 SEED IIT BOMBAY — non-destructive.
 *
 * The safe sibling of reset-colleges.mjs, which DELETES every user and college
 * before seeding. That is the wrong tool for a pilot launch: the moment you
 * want to add the first campus is the same moment you have real signups you
 * cannot afford to lose.
 *
 * This script only touches the `colleges` collection. It never reads or writes
 * a single user row, so it is safe to run against a database that already has
 * students in it — which is exactly the situation it is for.
 *
 *   node server/scripts/seed-iitb.mjs            # dry run, reports only
 *   node server/scripts/seed-iitb.mjs --execute  # upsert the college
 */

const SEED = {
  code: 'iitb',
  name: 'Indian Institute of Technology Bombay',
  // Exact-or-subdomain matching means every department address
  // (cse.iitb.ac.in, mech.iitb.ac.in, …) verifies against this one entry.
  domains: ['iitb.ac.in'],
  city: 'Mumbai',
  state: 'Maharashtra',
  country: 'India',
  active: true,
  // IIT Bombay main campus, Powai. This is campus data — a building's public
  // location — not a student's coordinates, so it carries none of the privacy
  // weight of User.currentLatLng. Optional: without it, students at this campus
  // rank as "unknown location" and sort last rather than being guessed at.
  latLng: [19.124, 72.914],
};

const EXECUTE = process.argv.includes('--execute');

const run = async () => {
  const envFile = loadEnv();
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found. Set it in server/.env.');
    process.exit(1);
  }
  console.log(`📄 env: ${envFile}`);
  console.log(`🔍 mode: ${EXECUTE ? '⚠️  EXECUTE' : 'report only'}`);
  console.log(`🗄  db:  ${process.env.MONGODB_URI.split('@').pop()}\n`);

  await mongoose.connect(process.env.MONGODB_URI);

  const existing = await College.find({}).sort({ code: 1 }).lean();
  console.log(`colleges currently in the database: ${existing.length}`);
  for (const c of existing) {
    const match = c.code === SEED.code ? '  ← this script' : '';
    console.log(`   ${c.code.padEnd(10)} active=${String(c.active).padEnd(5)} ${c.name}${match}`);
  }

  const already = await College.findOne({ code: SEED.code }).lean();
  if (already) {
    // Report drift rather than silently overwriting. A difference here means
    // an operator edited the college from /admin — the admin value may be the
    // corrected one, so this prints and stops rather than winning.
    const drift = ['name', 'active'].filter((k) => String(already[k]) !== String(SEED[k]));
    const domainDrift = JSON.stringify([...(already.domains || [])].sort())
      !== JSON.stringify([...SEED.domains].sort());

    if (drift.length || domainDrift) {
      console.log('\n⚠️  IIT Bombay already exists and differs from this script:');
      if (drift.length) console.log(`     fields: ${drift.join(', ')}`);
      if (domainDrift) {
        console.log(`     domains: db has [${(already.domains || []).join(', ')}], script has [${SEED.domains.join(', ')}]`);
      }
      console.log('     Not overwriting. The value in the database is the live one.');
      console.log('     To change it, edit the college from /admin.');
      await mongoose.disconnect();
      return;
    }
    console.log('\n✅ IIT Bombay already matches. Nothing to do.');
    await mongoose.disconnect();
    return;
  }

  if (!EXECUTE) {
    console.log('\n📋 Would seed:');
    console.log(`   ${SEED.name}  (${SEED.code})  @${SEED.domains[0]}`);
    console.log('   Re-run with --execute to apply.');
    await mongoose.disconnect();
    return;
  }

  // Upsert so re-running does not collide with the unique code index.
  await College.findOneAndUpdate({ code: SEED.code }, { $set: SEED }, { upsert: true, new: true });

  const after = await College.countDocuments({});
  console.log(`\n✅ Seeded ${SEED.name} (${SEED.code})`);
  console.log(`   colleges now: ${after}`);

  const gate = process.env.ALLOWED_COLLEGES;
  if (gate) {
    const allowed = gate.split(',').map((c) => c.trim().toLowerCase());
    console.log(`\n🚪 ALLOWED_COLLEGES = "${gate}"`);
    console.log(allowed.includes(SEED.code)
      ? '   ✓ IIT Bombay can sign up.'
      : `   ✗ IIT Bombay is NOT in the gate — nobody will be able to sign up.\n     Set ALLOWED_COLLEGES=${SEED.code}`);
  } else {
    console.log('\n🚪 ALLOWED_COLLEGES is not set — every active college can sign up.');
    console.log(`   Set ALLOWED_COLLEGES=${SEED.code} to run this as an IIT-Bombay-only pilot.`);
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('❌ Seed failed:', err?.error?.message || err?.message || err);
  process.exit(1);
});