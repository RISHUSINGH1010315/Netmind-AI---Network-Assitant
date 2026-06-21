import { Response } from 'express';
import Incident from '../models/Incident';
import { AuthenticatedRequest } from '../middleware/auth';

export const getIncidents = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, severity, deviceId } = req.query;
    const filter: any = {};

    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (deviceId) filter.device = deviceId;

    const incidents = await Incident.find(filter)
      .populate('assignedTo', 'name email role')
      .populate('device', 'name ipAddress vendor model location')
      .sort({ createdAt: -1 });

    return res.json(incidents);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const createIncident = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, severity, deviceId, assignedToId } = req.body;

    const newIncident = new Incident({
      title,
      description,
      severity,
      device: deviceId || null,
      assignedTo: assignedToId || null
    });

    await newIncident.save();
    return res.status(201).json(newIncident);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateIncident = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, assignedTo, rootCause, resolutionNotes, severity, description, title } = req.body;
    const updateData: any = {};

    if (status !== undefined) updateData.status = status;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null;
    if (rootCause !== undefined) updateData.rootCause = rootCause;
    if (resolutionNotes !== undefined) updateData.resolutionNotes = resolutionNotes;
    if (severity !== undefined) updateData.severity = severity;
    if (description !== undefined) updateData.description = description;
    if (title !== undefined) updateData.title = title;

    const incident = await Incident.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('assignedTo', 'name email role')
      .populate('device', 'name ipAddress vendor');

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    return res.json(incident);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteIncident = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const incident = await Incident.findByIdAndDelete(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    return res.json({ message: 'Incident deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
