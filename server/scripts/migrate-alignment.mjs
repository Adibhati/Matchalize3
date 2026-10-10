import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const loadEnv = () => {
  const envPaths = [
    path.join(__dirname, '../.env'),
    path.join(process.cwd(), '.env'),
  ];
  for (const p of envPaths) {
    if (fs.existsSync(p)) {
      const lines = fs.readFileSync(p, 'utf8').split('\n');
      for (const line of lines) {
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
  console.log(`🌱 Migrating DB (env: ${envFile || '(process)'})`);

  await mongoose.connect(process.env.MONGODB_URI);
  const conn = mongoose.connection;

  console.log('1/5 Rename matches -> alignments collection...');
  try {
    const res = await conn.collection('matches').rename('alignments');
    console.log('   ✅ renamed', res && res.collectionName);
  } catch (err) {
    if (err.code === 48) console.log('   ℹ️  alignments already exists, skipping rename');
    else if (err.message && err.message.includes('source namespace does not exist')) console.log('   ℹ️  no matches collection, skipping');
    else { console.error('   ❌', err.message); process.exit(1); }
  }

  console.log('2/5 Rename Message.matchId -> alignmentId (field + drop old index)...');
  try {
    const msg = conn.collection('messages');
    await msg.dropIndex('matchId_1_createdAt_1').catch(() => {});
    await msg.dropIndex('matchId_1__id_-1').catch(() => {});
    await msg.dropIndex('matchId_1_type_1').catch(() => {});
    await msg.updateMany(
      { matchId: { $exists: true } },
      [{ $set: { alignmentId: '$matchId' } }, { $unset: ['matchId'] }]
    );
    await msg.createIndex({ alignmentId: 1, createdAt: 1 });
    await msg.createIndex({ alignmentId: 1, _id: -1 });
    await msg.createIndex(
      { alignmentId: 1, type: 1 },
      { unique: true, partialFilterExpression: { type: 'opening_letter' } }
    );
    console.log('   ✅ field + indexes migrated');
  } catch (err) {
    console.error('   ❌', err.message); process.exit(1);
  }

  console.log('3/5 Interaction actionType seal_stamp -> telegram, accept_seal -> accept_letter...');
  try {
    const it = conn.collection('interactions');
    await it.updateMany({ actionType: 'seal_stamp' }, { $set: { actionType: 'telegram' } });
    await it.updateMany({ actionType: 'accept_seal' }, { $set: { actionType: 'accept_letter' } });
    console.log('   ✅ migrado');
  } catch (err) {
    console.error('   ❌', err.message); process.exit(1);
  }

  console.log('4/5 Notification type priority_seal -> priority_telegram...');
  try {
    const n = conn.collection('notifications');
    await n.updateMany({ type: 'priority_seal' }, { $set: { type: 'priority_telegram' } });
    console.log('   ✅ migrado');
  } catch (err) {
    console.error('   ❌', err.message); process.exit(1);
  }

  console.log('5/5 User.year mapped to UG/PG buckets...');
  try {
    const u = conn.collection('users');
    const exists = await u.findOne({ year: { $in: ['Freshies', 'Sophies', 'Thirdies', 'Fourthies', 'Fifthies (Dual/PG)', /^\d{4}$/] } });
    if (exists) {
      await u.updateMany(
        { $or: [{ year: { $in: ['Freshies', 'Sophies', 'Thirdies', 'Fourthies'] } }, { year: { $regex: '^\\d{4}$' } }] },
        { $set: { year: 'UG' } }
      );
      await u.updateMany({ year: 'Fifthies (Dual/PG)' }, { $set: { year: 'PG' } });
      console.log('   ✅ bucketed to UG/PG');
    } else {
      console.log('   ℹ️  no legacy year values found, skipping');
    }
  } catch (err) {
    console.error('   ❌', err.message); process.exit(1);
  }

  await mongoose.disconnect();
  console.log('🎉 Migration complete.');
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});