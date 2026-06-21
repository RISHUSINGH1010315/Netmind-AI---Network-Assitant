import { Response } from 'express';
import Log from '../models/Log';
import Device from '../models/Device';
import { AuthenticatedRequest } from '../middleware/auth';
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const getLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { deviceId, severity, source } = req.query;
    const filter: any = {};

    if (deviceId) filter.device = deviceId;
    if (severity) filter.severity = severity;
    if (source) filter.source = source;

    const logs = await Log.find(filter)
      .populate('device', 'name ipAddress')
      .sort({ timestamp: -1 })
      .limit(100);

    return res.json(logs);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const createLog = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { deviceId, source, rawContent, severity } = req.body;

    const newLog = new Log({
      device: deviceId || null,
      source,
      rawContent,
      severity: severity || 'Info',
      parsedExplanation: 'Pending analysis...'
    });

    await newLog.save();
    return res.status(201).json(newLog);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const analyzeLog = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { logId } = req.params;
    const log = await Log.findById(logId);
    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }

    let explanation = '';
    let detectedSeverity = log.severity;

    try {
      // Call python AI Service for log explanation
      const response = await axios.post(`${AI_SERVICE_URL}/api/ai/analyze-log`, {
        raw_log: log.rawContent
      });
      explanation = response.data.explanation;
      detectedSeverity = response.data.severity || log.severity;
    } catch (err) {
      // Local fallback logic
      const rawLower = log.rawContent.toLowerCase();
      if (rawLower.includes('ospf-5-adjchg')) {
        explanation = 'OSPF Adjacency Change detected. Neighbor state transitioned. Likely cause: Interface flap, configuration mismatch (hello timers, subnet mask), or physical link instability.';
        detectedSeverity = 'Warning';
      } else if (rawLower.includes('%lineproto-5-updown')) {
        explanation = 'Interface Line Protocol state changed. The physical layer remains up, but data link layer protocol failed. Commonly due to keepalive failure, encapsulation mismatch, or loopback configuration.';
        detectedSeverity = 'Info';
      } else if (rawLower.includes('%link-3-updown')) {
        explanation = 'Physical link state changed. A physical interface transitioned status. Check cable connection, SFPs, or transceiver power levels.';
        detectedSeverity = 'Warning';
      } else if (rawLower.includes('%sec-6-ipaccesslogp')) {
        explanation = 'Access List violation log. Traffic was matched and logged by an ACL statement. Suggests access attempts from unauthorized IP ranges.';
        detectedSeverity = 'Warning';
      } else {
        explanation = 'Syslog message parsed. No immediate critical warning pattern matched in rule engine. Standard network telemetry log.';
      }
    }

    log.parsedExplanation = explanation;
    log.severity = detectedSeverity;
    await log.save();

    return res.json(log);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
