import { Schema, model, Types } from 'mongoose';

import { wrapModelWithProxy } from './modelProxy';

const LogSchema = new Schema(
  {
    device: { type: Schema.Types.ObjectId, ref: 'Device', default: null },
    source: { type: String, enum: ['Syslog', 'Event Log', 'Device Log'], required: true },
    rawContent: { type: String, required: true },
    parsedExplanation: { type: String, default: '' },
    severity: { type: String, enum: ['Critical', 'Warning', 'Info'], default: 'Info' },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const RealLog = model('Log', LogSchema);
export const Log = wrapModelWithProxy('Log', RealLog);
export default Log;
