import { Schema, model, Types } from 'mongoose';

import { wrapModelWithProxy } from './modelProxy';

const AlertSchema = new Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    severity: { type: String, enum: ['Critical', 'Warning', 'Info'], required: true },
    device: { type: Schema.Types.ObjectId, ref: 'Device', default: null },
    isRead: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const RealAlert = model('Alert', AlertSchema);
export const Alert = wrapModelWithProxy('Alert', RealAlert);
export default Alert;
