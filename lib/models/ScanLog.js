import mongoose from 'mongoose';

const ScanLogSchema = new mongoose.Schema(
  {
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    type: { type: String, enum: ['CHECKPOINT_SCAN', 'LIFELINE_USED'], required: true },
    pointsDelta: { type: Number, required: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.models.ScanLog || mongoose.model('ScanLog', ScanLogSchema);
