import mongoose from 'mongoose';

const dailyAlignQuotaSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  dayKey: {
    type: String,
    required: true,
  },
  count: {
    type: Number,
    required: true,
    min: 0,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

dailyAlignQuotaSchema.index({ userId: 1, dayKey: 1 }, { unique: true });
dailyAlignQuotaSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const DailyAlignQuota = mongoose.model('DailyAlignQuota', dailyAlignQuotaSchema);
export default DailyAlignQuota;
