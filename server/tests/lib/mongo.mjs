import mongoose from 'mongoose';

// The one database name these tests are ever allowed to touch. Mirrors
// TEST_DB_NAME in ./env.mjs.
const ALLOWED_TEST_DBNAME = 'matchalize_test';

export async function connectMongo(uri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  return mongoose.connection;
}

export async function disconnectMongo() {
  await mongoose.disconnect().catch(() => {});
}

/**
 * 🛑 REFUSE TO RUN AGAINST A DATABASE THAT ISN'T THE TEST DATABASE.
 *
 * resetTestDb() drops every collection it finds. `deriveTestUri` (env.mjs)
 * rewrites the db segment of server/.env's MONGODB_URI to `matchalize_test`,
 * which means the tests are safe by ACCIDENT even if that URI points at a
 * production CLUSTER — but that single indirection is the only thing standing
 * between a misconfigured .env and dropped collections. If env.mjs is ever
 * changed, or someone exports MONGODB_URI directly, the guard is gone.
 *
 * So assert the resolved database name before touching anything. Cheap, and it
 * converts a catastrophic, irreversible mistake into an immediate, obvious one.
 */
function assertDisposableDatabase(db) {
  const name = db.databaseName;
  if (name !== ALLOWED_TEST_DBNAME) {
    throw new Error(
      `🛑 REFUSING TO RUN: connected to database "${name}", expected "${ALLOWED_TEST_DBNAME}".\n` +
      `   These tests DROP every collection they find. Check MONGODB_URI in server/.env.`
    );
  }
}

export async function resetTestDb() {
  const db = mongoose.connection.db;
  assertDisposableDatabase(db);
  const collections = await db.listCollections().toArray();
  for (const c of collections) {
    await db.dropCollection(c.name).catch(() => {});
  }
}

export async function findLatestOtpEmail(db, email) {
  return db.collection('otps').findOne({ email }, { sort: { createdAt: -1 } });
}

export async function updateUserLastActive(db, emailsByRole, deltaMs) {
  const users = db.collection('users');
  for (const email of emailsByRole) {
    await users.updateOne({ email }, { $set: { lastActive: new Date(Date.now() - deltaMs) } });
  }
}