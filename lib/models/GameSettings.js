import mongoose from 'mongoose';

const GameSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'main' },
    finalPassword: { type: String, default: '' },
    finalRiddle: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.GameSettings || mongoose.model('GameSettings', GameSettingsSchema);