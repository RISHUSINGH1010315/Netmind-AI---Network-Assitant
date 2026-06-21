import { Router } from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { upload } from '../middleware/upload';

import * as authController from '../controllers/AuthController';
import * as deviceController from '../controllers/DeviceController';
import * as incidentController from '../controllers/IncidentController';
import * as logController from '../controllers/LogController';
import * as alertController from '../controllers/AlertController';
import * as configController from '../controllers/ConfigController';
import * as chatController from '../controllers/ChatController';
import * as reportController from '../controllers/ReportController';
import * as analyticsController from '../controllers/AnalyticsController';
import * as topologyController from '../controllers/TopologyController';

const router = Router();

// ==========================================
// Public Auth Endpoints
// ==========================================
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/refresh', authController.tokenRefresh);
router.post('/auth/logout', authController.logout);

// ==========================================
// Protected Routes (Authenticate JWT first)
// ==========================================
router.use(authenticateJWT);

router.get('/auth/me', authController.getMe);

// Devices
router.get('/devices', deviceController.getDevices);
router.get('/devices/:id', deviceController.getDeviceById);
router.post('/devices', requireRole(['Super Admin', 'Network Engineer']), deviceController.createDevice);
router.put('/devices/:id', requireRole(['Super Admin', 'Network Engineer']), deviceController.updateDevice);
router.delete('/devices/:id', requireRole(['Super Admin']), deviceController.deleteDevice);

// Incidents
router.get('/incidents', incidentController.getIncidents);
router.post('/incidents', requireRole(['Super Admin', 'Network Engineer', 'NOC Engineer']), incidentController.createIncident);
router.put('/incidents/:id', requireRole(['Super Admin', 'Network Engineer', 'NOC Engineer']), incidentController.updateIncident);
router.delete('/incidents/:id', requireRole(['Super Admin']), incidentController.deleteIncident);

// Logs
router.get('/logs', logController.getLogs);
router.post('/logs', requireRole(['Super Admin', 'Network Engineer', 'NOC Engineer']), logController.createLog);
router.post('/logs/analyze/:logId', requireRole(['Super Admin', 'Network Engineer', 'Security Analyst']), logController.analyzeLog);

// Alerts
router.get('/alerts', alertController.getAlerts);
router.post('/alerts/read/:id', alertController.markAlertAsRead);
router.post('/alerts/read-all', alertController.markAllAlertsAsRead);

// Configurations Analyzer
router.post('/config/analyze', upload.single('configFile'), configController.uploadConfig);
router.get('/config', configController.getConfigs);
router.get('/config/findings', configController.getAIFindings);
router.get('/config/:id', configController.getConfigById);

// Topology Map
router.post('/topology/generate', topologyController.generateTopology);

// Chat Sessions (RAG)
router.get('/chat/sessions', chatController.getSessions);
router.get('/chat/sessions/:id', chatController.getSessionById);
router.post('/chat/sessions', chatController.createSession);
router.post('/chat/sessions/:sessionId/message', chatController.sendMessage);

// Reports Generator
router.get('/reports', reportController.getReports);
router.get('/reports/pdf', reportController.generatePDFReport);
router.get('/reports/excel', reportController.generateExcelReport);

// Dashboard Analytics
router.get('/analytics/dashboard', analyticsController.getDashboardStats);
router.get('/analytics/predict', analyticsController.getPredictiveAnalytics);

export default router;
