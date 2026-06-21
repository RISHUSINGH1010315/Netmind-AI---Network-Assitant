import { Response } from 'express';
import Configuration from '../models/Configuration';
import Device from '../models/Device';
import AIFinding from '../models/AIFinding';
import { AuthenticatedRequest } from '../middleware/auth';
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const uploadConfig = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { deviceId, rawText } = req.body;
    let fileName = 'manual-config.cfg';
    let configText = rawText;

    if (req.file) {
      fileName = req.file.originalname;
      configText = req.file.buffer.toString('utf-8');
    }

    if (!configText) {
      return res.status(400).json({ error: 'Configuration content is required' });
    }

    const device = deviceId ? await Device.findById(deviceId) : null;

    // Create the initial Configuration document
    const newConfig = new Configuration({
      device: device ? device._id : null,
      fileName,
      rawText: configText,
      findings: []
    });

    let findings: any[] = [];
    let parsedData: any = {};

    try {
      // Forward config to FastAPI
      const response = await axios.post(`${AI_SERVICE_URL}/api/ai/analyze-config`, {
        filename: fileName,
        content: configText
      });
      findings = response.data.findings;
      parsedData = response.data.parsed_data;
    } catch (err) {
      // Node.js fallback analyzer
      findings = analyzeConfigLocally(configText);
      parsedData = {
        hostname: configText.match(/hostname\s+(\S+)/i)?.[1] || 'Unknown',
        interfaces: parseInterfacesLocally(configText),
        routing: parseRoutingLocally(configText),
        vlans: parseVlansLocally(configText)
      };
    }

    newConfig.findings = findings as any;
    newConfig.parsedData = parsedData;
    await newConfig.save();

    // Map configuration to AIFindings
    for (const finding of findings) {
      const aiFinding = new AIFinding({
        device: device ? device._id : null,
        configuration: newConfig._id,
        category: finding.type,
        issue: finding.issue,
        severity: finding.severity,
        impact: finding.impact,
        explanation: finding.explanation,
        suggestedFix: finding.suggestedFix,
        cliCommand: finding.cliCommand
      });
      await aiFinding.save();
    }

    return res.status(201).json(newConfig);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getConfigs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { deviceId } = req.query;
    const filter = deviceId ? { device: deviceId } : {};
    const configs = await Configuration.find(filter)
      .populate('device', 'name ipAddress status')
      .sort({ createdAt: -1 });
    return res.json(configs);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getConfigById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const config = await Configuration.findById(req.params.id).populate('device', 'name ipAddress status');
    if (!config) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    return res.json(config);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getAIFindings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, severity, deviceId } = req.query;
    const filter: any = {};

    if (category) filter.category = category;
    if (severity) filter.severity = severity;
    if (deviceId) filter.device = deviceId;

    const findings = await AIFinding.find(filter)
      .populate('device', 'name ipAddress vendor')
      .sort({ createdAt: -1 });

    return res.json(findings);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Fallback Helper Functions for configuration analyzing
function analyzeConfigLocally(text: string): any[] {
  const findings: any[] = [];
  const lower = text.toLowerCase();

  // 1. Security checking
  if (lower.includes('enable password') && !lower.includes('enable secret')) {
    findings.push({
      type: 'Security',
      issue: 'Plaintext Enable Password Used',
      severity: 'Critical',
      impact: 'The enable password is stored as plaintext (Type 0) or weak hash (Type 7). Anyone with configuration read access can easily decrypt and escalate privileges.',
      explanation: 'Use of "enable password" represents a weak cipher standard. Modern systems require the SHA-256 encrypted "enable secret".',
      suggestedFix: 'Replace plaintext password configuration with enable secret configuration.',
      cliCommand: 'no enable password\nenable secret [STRONG_PASSWORD_HERE]'
    });
  }

  if (lower.includes('transport input telnet') || (lower.includes('line vty') && !lower.includes('transport input ssh') && !lower.includes('transport input none'))) {
    findings.push({
      type: 'Security',
      issue: 'Insecure Telnet Protocol Enabled',
      severity: 'Critical',
      impact: 'Telnet transmits all packets (including authentication passwords) in plaintext. An attacker can intercept control packets and hijack session credentials.',
      explanation: 'Lines VTY allow remote administration. Direct Telnet protocol enabled allows remote sniffing of admin privileges.',
      suggestedFix: 'Configure transport input to only allow encrypted SSH sessions.',
      cliCommand: 'line vty 0 15\n transport input ssh'
    });
  }

  if (lower.includes('snmp-server community public') || lower.includes('snmp-server community private')) {
    findings.push({
      type: 'Security',
      issue: 'Default SNMP Community String Enabled',
      severity: 'Critical',
      impact: 'Using default names like "public" or "private" allows unauthorized network scanning, interface manipulation, and sensitive MIB data leakage.',
      explanation: 'SNMP community strings serve as passwords. Default ciphers are widely targeted by automated exploit frameworks.',
      suggestedFix: 'Delete public/private SNMP strings and configure unique secure keys or migrate to SNMPv3.',
      cliCommand: 'no snmp-server community public\nno snmp-server community private\nsnmp-server community [SECURE_STRING] RO'
    });
  }

  // 2. VLAN checking
  if (lower.includes('switchport trunk native vlan') && !lower.includes('switchport mode trunk')) {
    findings.push({
      type: 'VLAN',
      issue: 'Native VLAN Configured on Non-Trunk Port',
      severity: 'Warning',
      impact: 'Can cause VLAN mismatch issues, routing errors, and configuration warnings across spanning-tree domains.',
      explanation: 'A native VLAN is only applicable on trunk connections. Placing it on access interfaces has no structural effect.',
      suggestedFix: 'Ensure native VLAN configuration is only matched on explicit trunk lines.',
      cliCommand: 'interface [INTERFACE_NAME]\n no switchport trunk native vlan'
    });
  }

  // 3. Routing checking
  if (lower.includes('router ospf') && !lower.includes('network')) {
    findings.push({
      type: 'Routing',
      issue: 'OSPF Process Lacks Interface Networks',
      severity: 'Warning',
      impact: 'OSPF routing protocol runs but is not advertised on any local interfaces. Neighbors will not form adjacency, and no routes are exchanged.',
      explanation: 'OSPF requires declaring which subnets to participate in using network statements.',
      suggestedFix: 'Define target network subnets or set interfaces to run OSPF directly.',
      cliCommand: 'router ospf 1\n network [SUBNET_IP] [WILDCARD_MASK] area 0'
    });
  }

  if (!text.match(/ip route 0\.0\.0\.0 0\.0\.0\.0/i)) {
    findings.push({
      type: 'Routing',
      issue: 'Missing Default Route',
      severity: 'Warning',
      impact: 'The device cannot route packets directed outside its locally configured or dynamically learned subnets. Core traffic will fail egress.',
      explanation: 'An enterprise border or core router typically requires a default gateway (gateway of last resort) route.',
      suggestedFix: 'Configure a default route pointing to your ISP or next-hop gateway.',
      cliCommand: 'ip route 0.0.0.0 0.0.0.0 [NEXT_HOP_IP]'
    });
  }

  // 4. DHCP / DNS checking
  if (lower.includes('ip dhcp pool') && !lower.includes('dns-server')) {
    findings.push({
      type: 'DHCP',
      issue: 'DHCP Pool Missing DNS Server Config',
      severity: 'Warning',
      impact: 'Connected clients will obtain IP leases but fail domain name resolution (DNS), preventing internet browser requests.',
      explanation: 'Clients require DNS servers configured inside their lease pool payload.',
      suggestedFix: 'Add primary and secondary corporate DNS server configurations to the pool.',
      cliCommand: 'ip dhcp pool [POOL_NAME]\n dns-server 8.8.8.8 1.1.1.1'
    });
  }

  if (findings.length === 0) {
    findings.push({
      type: 'Config',
      issue: 'No Critical Analysis Violations',
      severity: 'Info',
      impact: 'Configuration complies with base parsing and common security policies checked locally.',
      explanation: 'No syntax issues or exposed plaintext configurations found in rule engine checks.',
      suggestedFix: 'Keep maintaining current configuration and update backup logs.',
      cliCommand: 'write memory'
    });
  }

  return findings;
}

function parseInterfacesLocally(text: string): any[] {
  const list: any[] = [];
  const regex = /interface\s+(\S+)([\s\S]*?)(?=interface|\!|$)/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const name = match[1];
    const block = match[2];
    const ip = block.match(/ip address\s+(\S+)\s+(\S+)/i);
    const shutdown = block.includes('shutdown');
    list.push({
      name,
      ipAddress: ip ? `${ip[1]} ${ip[2]}` : 'Unassigned',
      status: shutdown ? 'Shutdown' : 'Up/Active',
      description: block.match(/description\s+(.*)/i)?.[1]?.trim() || ''
    });
  }
  return list;
}

function parseRoutingLocally(text: string): any {
  const ospf = text.includes('router ospf');
  const bgp = text.includes('router bgp');
  const eigrp = text.includes('router eigrp');
  const staticRoutes: string[] = [];
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.trim().toLowerCase().startsWith('ip route ')) {
      staticRoutes.push(line.trim());
    }
  }
  return { ospf, bgp, eigrp, staticRoutes };
}

function parseVlansLocally(text: string): any[] {
  const vlans: any[] = [];
  const regex = /vlan\s+(\d+)([\s\S]*?)(?=vlan|\!|$)/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const id = match[1];
    const block = match[2];
    const name = block.match(/name\s+(\S+)/i)?.[1] || `VLAN${id}`;
    vlans.push({ id: parseInt(id), name });
  }
  return vlans;
}
