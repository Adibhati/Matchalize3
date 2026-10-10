import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    // HMAC-SHA256 fingerprint of the code — NOT the code itself.
    // See utils/otpHash.js. The plaintext code only ever exists in memory
    // long enough to be emailed.
    otpHash: {
      type: String,
      required: true,
    },
    // The college the user PICKED before requesting the code.
    //
    // ⚠️ This is the binding between step 1 (pick your college) and step 3
    // (enter the code). It lives server-side so the client cannot re-assert a
    // different college at verification time — otherwise the picker would be
    // advisory only, since anyone could send a code request for IIT Bombay and
    // verify against whichever college they actually wanted.
    collegeCode: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Document will expire at the specified date
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for rate limiting queries (find by email within last hour)
otpSchema.index({ email: 1, createdAt: 1 });

const OTP = mongoose.model('OTP', otpSchema);
export default OTP;
