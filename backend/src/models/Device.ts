import { Schema, model } from 'mongoose';

import { wrapModelWithProxy } from './modelProxy';

const DeviceSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    vendor: { type: String, required: true }, // Cisco, Juniper, Nokia, etc.
    model: { type: String, required: true },
    serialNumber: { type: String, required: true, unique: true },
    ipAddress: { type: String, required: true, unique: true },
    location: { type: String, required: true },
    firmware: { type: String, required: true },
    status: { type: String, enum: ['Online', 'Offline'], default: 'Online' },
    macAddress: { type: String, required: true },
    // Realtime/Simulated metrics
    cpuUsage: { type: Number, default: 0 },
    memoryUsage: { type: Number, default: 0 }, // in GB
    memoryTotal: { type: Number, default: 16 }, // in GB
    uptime: { type: Number, default: 0 }, // in days
    packetLoss: { type: Number, default: 0 } // percentage
  },
  { timestamps: true }
);

const RealDevice = model('Device', DeviceSchema);
export const Device = wrapModelWithProxy('Device', RealDevice);
export default Device;
