import { Schema, model } from 'mongoose';

import { wrapModelWithProxy } from './modelProxy';

const ReportSchema = new Schema(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ['PDF', 'Excel'], required: true },
    summary: { type: String, required: true },
    networkHealthScore: { type: Number, default: 100 },
    securityScore: { type: Number, default: 100 },
    filePath: { type: String, default: '' }
  },
  { timestamps: true }
);

const RealReport = model('Report', ReportSchema);
export const Report = wrapModelWithProxy('Report', RealReport);
export default Report;
