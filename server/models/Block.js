import mongoose from 'mongoose';

const blockSchema = new mongoose.Schema({
  blocker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  blocked: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

blockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

// Fast lookup: "everyone who blocked ME" (used to filter the swipe deck).
// Without this, that half of the query reads the entire blocks table.
blockSchema.index({ blocked: 1 });

const Block = mongoose.model('Block', blockSchema);
export default Block;
