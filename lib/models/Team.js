import mongoose from 'mongoose';

const CompletedCheckpointSchema = new mongoose.Schema(
  {
    checkpointId: { type: mongoose.Schema.Types.ObjectId, ref: 'Checkpoint', required: true },
    unlockedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const UsedLifelineSchema = new mongoose.Schema(
  {
    lifelineType: { type: String, enum: ['HINT'], required: true },
    cost: { type: Number, required: true },
    usedAt: { type: Date, default: Date.now },
    checkpointId: { type: mongoose.Schema.Types.ObjectId, ref: 'Checkpoint' },
  },
  { _id: false }
);

const TeamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    accessCode: { type: String, required: true, unique: true, uppercase: true, minlength: 6, maxlength: 6 },
    score: { type: Number, default: 0 },
    completedCheckpoints: { type: [CompletedCheckpointSchema], default: [] },
    usedLifelines: { type: [UsedLifelineSchema], default: [] },
  },
  { timestamps: true }
);

TeamSchema.index({ score: -1, updatedAt: 1 });

export default mongoose.models.Team || mongoose.model('Team', TeamSchema);
