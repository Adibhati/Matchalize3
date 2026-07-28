import mongoose from 'mongoose';

export const REPORT_REASONS = [
  'Inappropriate photos',
  'Harassment or bullying',
  'Fake profile or spam',
  'Underage user',
  'Other',
];

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reported: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, enum: REPORT_REASONS, required: true },
  details: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'dismissed', 'actioned'],
    default: 'pending',
  },
  createdAt: { type: Date, default: Date.now },
});

reportSchema.index({ reporter: 1, reported: 1 }, { unique: true });

const Report = mongoose.model('Report', reportSchema);
export default Report;
