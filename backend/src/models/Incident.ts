import { Schema, model, Types } from 'mongoose';

import { wrapModelWithProxy } from './modelProxy';

const IncidentSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    severity: { type: String, enum: ['Critical', 'Warning', 'Info'], required: true },
    status: { type: String, enum: ['Open', 'In Progress', 'Resolved'], default: 'Open' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    device: { type: Schema.Types.ObjectId, ref: 'Device', default: null },
    rootCause: { type: String, default: '' },
    resolutionNotes: { type: String, default: '' }
  },
  { timestamps: true }
);

const RealIncident = model('Incident', IncidentSchema);
export const Incident = wrapModelWithProxy('Incident', RealIncident);
export default Incident;
