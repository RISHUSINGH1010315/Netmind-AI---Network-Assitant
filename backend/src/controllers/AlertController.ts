import { Response } from 'express';
import Alert from '../models/Alert';
import { AuthenticatedRequest } from '../middleware/auth';

export const getAlerts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { unreadOnly } = req.query;
    const filter: any = {};

    if (unreadOnly === 'true') {
      filter.isRead = false;
    }

    const alerts = await Alert.find(filter)
      .populate('device', 'name ipAddress status')
      .sort({ timestamp: -1 })
      .limit(100);

    return res.json(alerts);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const markAlertAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    return res.json(alert);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const markAllAlertsAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await Alert.updateMany({ isRead: false }, { isRead: true });
    return res.json({ message: 'All alerts marked as read' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
