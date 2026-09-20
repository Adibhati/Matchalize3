import mongoose from 'mongoose';

export async function connectMongo(uri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  return mongoose.connection;
}

export async function disconnectMongo() {
  await mongoose.disconnect().catch(() => {});
}

export async function resetTestDb() {
  const db = mongoose.connection.db;
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