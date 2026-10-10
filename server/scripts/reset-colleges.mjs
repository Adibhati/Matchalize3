import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import College from '../models/College.js';
import CollegeRequest from '../models/CollegeRequest.js';
import User from '../models/User.js';
import Alignment from '../models/Alignment.js';
import Interaction from '../models/Interaction.js';
import Notification from '../models/Notification.js';
import Message from '../models/Message.js';
import Report from '../models/Report.js';
import Block from '../models/Block.js';
import OTP from '../models/OTP.js';
import Analytics from '../models/Analytics.js';

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
 * ⚠️ DESTRUCTIVE. Wipes every user and everything hanging off them, then seeds
 * one college so the picker has something to show.
 *
 * Users only, in the app's real database. No --execute means report-only.
 *
 *   node server/scripts/reset-colleges.mjs            # dry run
 *   node server/scripts/reset-colleges.mjs --execute  # do it
 */
const run = async () => {
  const envFile = loadEnv();
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found');
    process.exit(1);
  }
  console.log(`📄 env: ${envFile}`);
  console.log(`🔍 mode: ${EXECUTE ? '⚠️  EXECUTE — THIS DELETES DATA' : 'report only'}`);

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`✅ MongoDB: ${mongoose.connection.host}/${mongoose.connection.name}\n`);

  const models = [
    ['User', User],
    ['Alignment', Alignment],
    ['Interaction', Interaction],
    ['Notification', Notification],
    ['Message', Message],
    ['Report', Report],
    ['Block', Block],
    ['OTP', OTP],
    ['Analytics', Analytics],
    ['CollegeRequest', CollegeRequest],
  ];

  console.log('rows that will be deleted:');
  const counts = {};
  for (const [name, M] of models) {
    // eslint-disable-next-line no-await-in-loop
    const n = await M.countDocuments({});
    counts[name] = n;
    console.log(`   ${name.padEnd(16)} ${n}`);
  }

  const seed = {
    code: 'iitb',
    name: 'Indian Institute of Technology Bombay',
    domains: ['iitb.ac.in'],
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    active: true,
  };

  console.log('\ncollege to be seeded:');
  console.log(`   ${seed.name}  (${seed.code})  @${seed.domains[0]}`);

  if (!EXECUTE) {
    console.log('\n📋 Report only. Re-run with --execute to apply.');
    await mongoose.disconnect();
    return;
  }

  for (const [, M] of models) {
    // eslint-disable-next-line no-await-in-loop
    await M.deleteMany({});
  }
  console.log('\n✅ Wiped all user + related collections.');

  // upsert so re-running this script doesn't fail on the unique code index.
  await College.findOneAndUpdate({ code: seed.code }, { $set: seed }, { upsert: true, new: true });
  console.log(`✅ Seeded college: ${seed.name} (${seed.code})`);

  const total = await User.countDocuments({});
  const collegeCount = await College.countDocuments({});
  console.log(`\nusers: ${total}   colleges: ${collegeCount}`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('❌ Reset failed:', err?.error?.message || err?.message || err);
  process.exit(1);
});