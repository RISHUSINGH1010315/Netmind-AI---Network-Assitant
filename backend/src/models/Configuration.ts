import { Schema, model } from 'mongoose';

import { wrapModelWithProxy } from './modelProxy';

const ConfigurationSchema = new Schema(
  {
    device: { type: Schema.Types.ObjectId, ref: 'Device', default: null },
    fileName: { type: String, required: true },
    rawText: { type: String, required: true },
    parsedData: { type: Schema.Types.Mixed, default: {} },
    findings: [
      {
        type: { type: String }, // Config, VLAN, Routing, ACL, DHCP, DNS, Security
        issue: { type: String },
        severity: { type: String }, // Critical, Warning, Info
        impact: { type: String },
        explanation: { type: String },
        suggestedFix: { type: String },
        cliCommand: { type: String }
      }
    ]
  },
  { timestamps: true }
);

const RealConfiguration = model('Configuration', ConfigurationSchema);
export const Configuration = wrapModelWithProxy('Configuration', RealConfiguration);
export default Configuration;
