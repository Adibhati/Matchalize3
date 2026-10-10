import mongoose from 'mongoose';

/**
 * 📨 COLLEGE REQUEST — "I can't find my college, please add it."
 *
 * A student at an unlisted campus submits this. It does NOT get them into the
 * product: nobody can sign up until an operator verifies the domain and adds
 * the college. The request is a waiting list, not a back door.
 *
 * That distinction matters — if a requester could self-declare a college and a
 * domain, anyone could invent a fake campus and verify against it.
 */
const collegeRequestSchema = new mongoose.Schema(
  {
    // What they typed. Deliberately structured (not one free-text blob) so the
    // same campus can't hide behind three differently-spelled names in the
    // operator's grouped queue.
    collegeName: { type: String, required: true, trim: true, maxlength: 200 },
    city: { type: String, trim: true, default: '', maxlength: 100 },
    state: { type: String, trim: true, default: '', maxlength: 100 },
    country: { type: String, trim: true, default: '', maxlength: 100 },

    // Their institutional address. Two jobs: it is the only real evidence the
    // requester belongs to that campus, and its domain usually tells the
    // operator what domain to verify. Never emailed a sign-in link (see
    // routes/colleges.js) — doing so would let someone use this form to
    // hijack an arbitrary inbox.
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    name: { type: String, trim: true, default: '', maxlength: 100 },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },

    // Set when the operator notifies them, so nobody gets emailed twice.
    notifiedAt: { type: Date, default: null },

    // Which college this request became, if it was approved.
    collegeCode: { type: String, default: '' },
  },
  { timestamps: true }
);

// Operator queue: pending first, grouped/sorted by collegeName.
collegeRequestSchema.index({ status: 1, collegeName: 1 });
// One request per email, so a campus with 200 students doesn't produce 200
// rows and doesn't distort the count that drives operator prioritisation.
collegeRequestSchema.index({ email: 1 }, { unique: true });

export default mongoose.model('CollegeRequest', collegeRequestSchema);