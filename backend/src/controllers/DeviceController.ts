import { Response } from 'express';
import Device from '../models/Device';
import { AuthenticatedRequest } from '../middleware/auth';

export const getDevices = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, vendor, search } = req.query;
    const filter: any = {};

    if (status) filter.status = status;
    if (vendor) filter.vendor = vendor;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { ipAddress: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const devices = await Device.find(filter);
    return res.json(devices);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getDeviceById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    return res.json(device);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const createDevice = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deviceData = req.body;
    const existing = await Device.findOne({
      $or: [
        { name: deviceData.name },
        { ipAddress: deviceData.ipAddress },
        { serialNumber: deviceData.serialNumber }
      ]
    });

    if (existing) {
      return res.status(400).json({ error: 'Device with same Name, IP, or Serial Number already exists' });
    }

    const newDevice = new Device(deviceData);
    await newDevice.save();
    return res.status(201).json(newDevice);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateDevice = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const device = await Device.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    return res.json(device);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteDevice = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const device = await Device.findByIdAndDelete(req.params.id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    return res.json({ message: 'Device deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
