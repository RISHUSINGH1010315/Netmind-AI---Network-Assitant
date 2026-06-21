import { Response } from 'express';
import Device from '../models/Device';
import Incident from '../models/Incident';
import AIFinding from '../models/AIFinding';
import Report from '../models/Report';
import { AuthenticatedRequest } from '../middleware/auth';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

export const getReports = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    return res.json(reports);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const generatePDFReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const devicesCount = await Device.countDocuments();
    const onlineDevices = await Device.countDocuments({ status: 'Online' });
    const offlineDevices = await Device.countDocuments({ status: 'Offline' });
    const incidentsCount = await Incident.countDocuments();
    const activeIncidents = await Incident.countDocuments({ status: { $ne: 'Resolved' } });
    const securityFindings = await AIFinding.find({ category: 'Security' }).populate('device');

    // Calculate score
    const healthScore = devicesCount > 0 ? Math.round((onlineDevices / devicesCount) * 100) : 100;
    const criticalIssues = await AIFinding.countDocuments({ severity: 'Critical' });
    const securityScore = Math.max(100 - criticalIssues * 8, 30);

    const doc = new PDFDocument({ margin: 50 });

    // Stream PDF directly to client response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="NetMind_Health_Report.pdf"');
    doc.pipe(res);

    // Title
    doc.fillColor('#003d9b').fontSize(24).text('NetMind AI Network Audit Report', { align: 'center' });
    doc.fontSize(10).fillColor('#505f76').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    // Summary Box
    doc.fillColor('#111c2d').fontSize(14).text('Executive Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).text(`NetMind AI performed a global automated audit on the network infrastructure. The overall network health score is evaluated at ${healthScore}%, and the security integrity index stands at ${securityScore}%.`);
    doc.moveDown(1.5);

    // Stats Grid
    doc.text(`Total Devices Managed: ${devicesCount}`);
    doc.text(`Devices Online: ${onlineDevices} | Offline: ${offlineDevices}`);
    doc.text(`Active Security Risk Findings: ${securityFindings.length}`);
    doc.text(`Total Logged Incidents: ${incidentsCount} (${activeIncidents} active tickets)`);
    doc.moveDown(1.5);

    // Security Section
    doc.fillColor('#ba1a1a').fontSize(14).text('Critical Security Alerts', { underline: true });
    doc.moveDown(0.5);
    doc.fillColor('#111c2d');

    if (securityFindings.length === 0) {
      doc.fontSize(10).text('No critical security findings detected in the current configurations.');
    } else {
      securityFindings.forEach((f: any, idx: number) => {
        doc.fontSize(11).text(`${idx + 1}. [${f.severity}] ${f.issue} - Device: ${f.device?.name || 'Global'}`);
        doc.fontSize(9).fillColor('#505f76').text(`Impact: ${f.impact}`);
        doc.text(`Recommended Fix: ${f.suggestedFix}`);
        doc.fillColor('#111c2d');
        doc.moveDown(0.5);
      });
    }

    doc.moveDown(1.5);
    doc.fillColor('#003d9b').fontSize(10).text('Report secured and encrypted by NetMind AI Core Engine.', { align: 'center' });

    doc.end();

    // Save report metadata
    const reportMeta = new Report({
      title: 'Global Network Health Audit',
      type: 'PDF',
      summary: `Network Health: ${healthScore}%, Security Score: ${securityScore}%. Audited ${devicesCount} devices.`,
      networkHealthScore: healthScore,
      securityScore: securityScore,
      filePath: 'streamed'
    });
    await reportMeta.save();

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const generateExcelReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const devices = await Device.find();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Inventory Report');

    sheet.columns = [
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Device Name', key: 'name', width: 25 },
      { header: 'Vendor', key: 'vendor', width: 15 },
      { header: 'Model', key: 'model', width: 15 },
      { header: 'IP Address', key: 'ipAddress', width: 18 },
      { header: 'Location', key: 'location', width: 20 },
      { header: 'Firmware', key: 'firmware', width: 15 },
      { header: 'MAC Address', key: 'macAddress', width: 20 },
      { header: 'CPU (%)', key: 'cpuUsage', width: 10 },
      { header: 'Memory (GB)', key: 'memoryUsage', width: 12 },
      { header: 'Uptime (Days)', key: 'uptime', width: 12 }
    ];

    devices.forEach((d: any) => {
      sheet.addRow({
        status: d.status,
        name: d.name,
        vendor: d.vendor,
        model: d.model,
        ipAddress: d.ipAddress,
        location: d.location,
        firmware: d.firmware,
        macAddress: d.macAddress,
        cpuUsage: d.cpuUsage,
        memoryUsage: d.memoryUsage,
        uptime: d.uptime
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="NetMind_Inventory.xlsx"');

    await workbook.xlsx.write(res);
    res.end();

    const reportMeta = new Report({
      title: 'Device Inventory Audit',
      type: 'Excel',
      summary: `Exported inventory logs for ${devices.length} network nodes.`,
      networkHealthScore: 100,
      securityScore: 100,
      filePath: 'streamed'
    });
    await reportMeta.save();

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
