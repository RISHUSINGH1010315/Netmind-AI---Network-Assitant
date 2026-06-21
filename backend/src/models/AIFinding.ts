import { Schema, model } from 'mongoose';

import { wrapModelWithProxy } from './modelProxy';

const AIFindingSchema = new Schema(
  {
    device: { type: Schema.Types.ObjectId, ref: 'Device', default: null },
    configuration: { type: Schema.Types.ObjectId, ref: 'Configuration', default: null },
    category: { type: String, enum: ['Config', 'VLAN', 'Routing', 'ACL', 'DHCP', 'DNS', 'Security'], required: true },
    issue: { type: String, required: true },
    severity: { type: String, enum: ['Critical', 'Warning', 'Info'], required: true },
    impact: { type: String, required: true },
    explanation: { type: String, required: true },
    suggestedFix: { type: String, required: true },
    cliCommand: { type: String, default: '' }
  },
  { timestamps: true }
);

const RealAIFinding = model('AIFinding', AIFindingSchema);
export const AIFinding = wrapModelWithProxy('AIFinding', RealAIFinding);
export default AIFinding;
