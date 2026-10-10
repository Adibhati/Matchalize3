import mongoose from 'mongoose';
// Importing the barrel registers every model before we try to verify it.
import './../models/index.js';

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 10000,
    maxPoolSize: 20,
  });
  console.log(`MongoDB Connected: ${conn.connection.host}`);

  // 🔊 LOUD INDEX VERIFICATION
  //
  // Schema `.index()` calls are only *instructions*. Mongoose fires them in the
  // background on model compile via autoIndex, and it only logs failures —
  // nothing awaits them, nothing reports them. So a missing index is
  // indistinguishable from a present one until a query goes slow in production.
  //
  // `syncIndexes()` is used rather than `init()` deliberately:
  //   - init() reads the `autoIndex` option and silently returns early if it's
  //     false. Turning autoIndex off is the standard move once you notice 11
  //     models rebuilding indexes on every cold start — and that would turn
  //     this check into a lie that always passes.
  //   - syncIndexes() compares the live database against the schemas and
  //     reports anything missing, regardless of autoIndex. It also creates
  //     any index that doesn't exist yet, which is what covers the Notification
  //     30-day TTL index and the Message unique-partial index that the
  //     race-safe upserts in discover.js / notifications.js rely on.
  //
  // Failure refuses to boot: a server that quietly runs without its indexes is
  // worse than one that doesn't start, because the problem surfaces later,
  // somewhere unrelated, to whoever is on call.
  const names = mongoose.modelNames();
  if (names.length === 0) {
    throw new Error(
      'Index verification aborted: zero models registered. Import models/index.js in db.js.'
    );
  }

  const results = await Promise.allSettled(
    names.map((name) => mongoose.model(name).syncIndexes())
  );

  const failed = results
    .map((r, i) => ({ r, name: names[i] }))
    .filter(({ r }) => r.status === 'rejected');

  if (failed.length > 0) {
    for (const { name, r } of failed) {
      console.error(`❌ Index sync failed for model "${name}": ${r.reason?.message || r.reason}`);
    }
    throw new Error(
      `Index sync failed for ${failed.length}/${names.length} models — refusing to start`
    );
  }

  console.log(`✅ Verified indexes on ${names.length} models (${names.join(', ')})`);
};

export default connectDB;