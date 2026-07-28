import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      required: true,
      enum: ['appConfig'], // Can be expanded later
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Setting', settingSchema);