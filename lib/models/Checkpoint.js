import mongoose from 'mongoose';

const CheckpointSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    sequenceOrder: { type: Number, required: true, unique: true },
    qrSecretToken: { type: String, required: true, unique: true },
    pointsReward: { type: Number, required: true, min: 0 },
    unlockLetter: { type: String, default: '', trim: true, uppercase: true, maxlength: 1 },
    clueText: { type: String, default: '' },
    bonusHint: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.Checkpoint || mongoose.model('Checkpoint', CheckpointSchema);
