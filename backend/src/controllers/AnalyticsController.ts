import { Response } from 'express';
import Device from '../models/Device';
import Incident from '../models/Incident';
import AIFinding from '../models/AIFinding';
import Alert from '../models/Alert';
import { AuthenticatedRequest } from '../middleware/auth';

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalDevices = await Device.countDocuments();
    const onlineDevices = await Device.countDocuments({ status: 'Online' });
    const offlineDevices = await Device.countDocuments({ status: 'Offline' });

    const totalAlerts = await Alert.countDocuments({ isRead: false });
    const criticalAlerts = await Alert.countDocuments({ severity: 'Critical', isRead: false });
    const warningAlerts = await Alert.countDocuments({ severity: 'Warning', isRead: false });

    // Calculate score
    const healthScore = totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 100;
    const securityScore = Math.max(100 - (await AIFinding.countDocuments({ severity: 'Critical' })) * 5, 40);

    const recentIncidents = await Incident.find()
      .populate('device', 'name ipAddress')
      .sort({ createdAt: -1 })
      .limit(5);

    // AI recommendations summary
    const activeFindings = await AIFinding.find().sort({ createdAt: -1 }).limit(3);
    const recommendations = activeFindings.map((f: any) => ({
      type: f.category,
      message: `AI detected a potential ${f.issue} on ${f.device ? 'linked device' : 'configuration'}. Recommendation: ${f.suggestedFix}`,
      severity: f.severity
    }));

    return res.json({
      totalDevices,
      onlineDevices,
      offlineDevices,
      totalAlerts,
      criticalAlerts,
      warningAlerts,
      healthScore,
      securityScore,
      recentIncidents,
      recommendations
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getPredictiveAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const devices = await Device.find();
    const projections = devices.map((d: any) => {
      // Simulate historical trends
      const baseCpu = d.cpuUsage;
      const baseMem = d.memoryUsage;

      // Project next 6 hours
      const cpuForecast = Array.from({ length: 6 }, (_, i) => {
        const trend = Math.sin(i) * 5 + i * 2; // linear increase with variance
        const val = Math.min(Math.round(baseCpu + trend), 100);
        return { hour: `+${i + 1}h`, usage: Math.max(val, 0) };
      });

      const memForecast = Array.from({ length: 6 }, (_, i) => {
        const trend = (i * 0.15); // growing memory leak simulator
        const val = Number(Math.min(baseMem + trend, d.memoryTotal).toFixed(2));
        return { hour: `+${i + 1}h`, usage: val };
      });

      // Predict issues
      const willExhaustCpu = cpuForecast.some(f => f.usage > 90);
      const willExhaustMem = memForecast.some(f => f.usage > d.memoryTotal * 0.85);

      let prediction = 'Stable status';
      let riskLevel = 'Low';
      let recommendation = 'No action required.';

      if (willExhaustCpu && willExhaustMem) {
        prediction = 'High probability of Resource Exhaustion & Crash';
        riskLevel = 'Critical';
        recommendation = 'Investigate memory leaks and optimize traffic control lines immediately.';
      } else if (willExhaustCpu) {
        prediction = 'CPU saturation threshold threat';
        riskLevel = 'Warning';
        recommendation = 'Balance control plane traffic or audit routing process overhead.';
      } else if (willExhaustMem) {
        prediction = 'Memory leak warning';
        riskLevel = 'Warning';
        recommendation = 'Schedule a device soft reboot or upgrade routing firmware version.';
      }

      return {
        deviceId: d._id,
        deviceName: d.name,
        currentCpu: baseCpu,
        currentMemory: baseMem,
        memoryTotal: d.memoryTotal,
        cpuForecast,
        memForecast,
        prediction,
        riskLevel,
        recommendation
      };
    });

    return res.json(projections);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
