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
    const mode = detectFileType(configText);

    // Create the initial Configuration document
    const newConfig = new Configuration({
      device: device ? device._id : null,
      fileName,
      rawText: configText,
      analyzerMode: mode,
      findings: []
    });

    let findings: any[] = [];
    let parsedData: any = {};
    let rootCauses: string[] = [];
    let aiRecommendations = '';
    let confidenceScore = 100;

    if (mode === 'LOG_ANALYSIS') {
      try {
        const response = await axios.post(`${AI_SERVICE_URL}/api/ai/analyze-log-file`, {
          content: configText
        });
        findings = response.data.findings;
        rootCauses = response.data.root_causes;
        aiRecommendations = response.data.ai_recommendations;
        confidenceScore = response.data.confidence_score;
      } catch (err) {
        const localLogResult = analyzeLogLocally(configText);
        findings = localLogResult.findings;
        rootCauses = localLogResult.rootCauses;
        aiRecommendations = localLogResult.aiRecommendations;
        confidenceScore = localLogResult.confidenceScore;
      }
    } else {
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
    }

    newConfig.findings = findings as any;
    newConfig.parsedData = parsedData;
    newConfig.rootCauses = rootCauses;
    newConfig.aiRecommendations = aiRecommendations;
    newConfig.confidenceScore = confidenceScore;
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

function detectFileType(content: string): 'CONFIG_AUDIT' | 'LOG_ANALYSIS' {
  const contentLower = content.toLowerCase();
  
  // 1. Check for specific log indicators
  const logKeywords = [
    '[critical]',
    '[high]',
    '[medium]',
    '[low]',
    '[info]',
    'error',
    'warning',
    'alert',
    'critical',
    '%link-',
    '%lineproto-',
    '%sec-',
    'interface down',
    'packet loss',
    'timeout',
    'brute force',
    'database failed',
    'event id',
    'source:',
    'level:',
    'kernel:',
    'systemd:',
    'sshd:'
  ];
  
  const hasLogKeywords = logKeywords.some(keyword => contentLower.includes(keyword));
  
  // Syslog pattern like "Jun 21 10:10:01" or "Jul 15 12:05:30"
  const syslogRegex = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}/mi;
  const hasSyslogPattern = syslogRegex.test(content);
  
  if (hasLogKeywords || hasSyslogPattern) {
    return 'LOG_ANALYSIS';
  }

  // 2. Check for config indicators
  const configKeywords = [
    'hostname',
    'interface',
    'router ospf',
    'router bgp',
    'ip route',
    'switchport',
    'vlan',
    'line vty',
    'aaa new-model',
    'snmp-server',
    'logging host',
    'enable secret'
  ];
  
  const hasConfigKeywords = configKeywords.some(keyword => contentLower.includes(keyword));
  if (hasConfigKeywords) {
    return 'CONFIG_AUDIT';
  }
  
  return 'CONFIG_AUDIT';
}

function analyzeLogLocally(content: string): any {
  const findings: any[] = [];
  const rootCauses: string[] = [];
  const categories = new Set<string>();
  
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const lineLower = line.toLowerCase();
    
    // WAN Down
    if (lineLower.includes('wan down')) {
      findings.push({
        type: 'Connectivity',
        issue: 'WAN Down',
        severity: 'CRITICAL',
        impact: 'Internet connectivity unavailable',
        explanation: 'WAN interface transitioned to down or lost link connection.',
        suggestedFix: 'Verify ISP status and WAN interface',
        cliCommand: 'interface GigabitEthernet0/0\n no shutdown'
      });
      rootCauses.push('ISP Outage');
      categories.add('Connectivity');
    }
    
    // Packet Loss
    else if (lineLower.includes('packet loss')) {
      findings.push({
        type: 'Performance',
        issue: 'Packet Loss',
        severity: 'HIGH',
        impact: 'Degraded packet delivery and increased latency',
        explanation: 'Link reporting packet drops above acceptable thresholds.',
        suggestedFix: 'Check congestion and interface errors',
        cliCommand: 'show interfaces summary'
      });
      categories.add('Performance');
    }
    
    // DNS Timeout
    else if (lineLower.includes('dns timeout')) {
      findings.push({
        type: 'DNS',
        issue: 'DNS Timeout',
        severity: 'HIGH',
        impact: 'Domain name resolution failures for clients',
        explanation: 'DNS queries to primary server timed out.',
        suggestedFix: 'Verify DNS server health and reachability',
        cliCommand: 'ping 8.8.8.8'
      });
      rootCauses.push('DNS Failure');
      categories.add('DNS');
    }
    
    // SSH Brute Force
    else if (lineLower.includes('ssh brute force') || lineLower.includes('brute force')) {
      findings.push({
        type: 'Security',
        issue: 'SSH Brute Force Attack',
        severity: 'CRITICAL',
        impact: 'Potential unauthorized administrative access',
        explanation: 'Detected abnormal frequency of failed administrative login attempts.',
        suggestedFix: 'Block source IP and enable rate limiting',
        cliCommand: 'ip access-list standard BLOCK_IP\n deny 192.168.1.50\n permit any'
      });
      rootCauses.push('Brute Force Attack');
      categories.add('Security');
    }
    
    // Broadcast Storm
    else if (lineLower.includes('broadcast storm')) {
      findings.push({
        type: 'Switching',
        issue: 'Broadcast Storm',
        severity: 'CRITICAL',
        impact: 'Extreme network bandwidth saturation',
        explanation: 'Broadcast frame traffic rate exceeded port bandwidth limitations.',
        suggestedFix: 'Check STP and Layer 2 loops',
        cliCommand: 'show spanning-tree summary'
      });
      rootCauses.push('Layer 2 Loop');
      categories.add('Switching');
    }
    
    // CRC Errors
    else if (lineLower.includes('crc errors')) {
      findings.push({
        type: 'Physical Layer',
        issue: 'CRC Errors',
        severity: 'MEDIUM',
        impact: 'Layer 1 physical link errors',
        explanation: 'High rate of Cyclic Redundancy Check failures on the interface.',
        suggestedFix: 'Inspect cable and transceiver',
        cliCommand: 'show interface status'
      });
      categories.add('Physical Layer');
    }
    
    // Database connection failure
    else if (lineLower.includes('database connection failed') || lineLower.includes('database failed')) {
      findings.push({
        type: 'Application',
        issue: 'Database Connection Failed',
        severity: 'CRITICAL',
        impact: 'Operational database unavailable for client transactions',
        explanation: 'Express backend server failed to ping database port.',
        suggestedFix: 'Check database service and connectivity',
        cliCommand: 'telnet localhost 27017'
      });
      rootCauses.push('Database Outage');
      categories.add('Application');
    }
    
    // High CPU Usage
    else if (lineLower.includes('high cpu')) {
      findings.push({
        type: 'Infrastructure',
        issue: 'High CPU Usage',
        severity: 'MEDIUM',
        impact: 'Control plane responsiveness degradation',
        explanation: 'Router/switch CPU utilization exceeded safety threshold.',
        suggestedFix: 'Investigate running processes and CPU usage logs',
        cliCommand: 'show processes cpu sorted'
      });
      categories.add('Infrastructure');
    }
    
    // DHCP Lease Assigned
    else if (lineLower.includes('dhcp lease')) {
      findings.push({
        type: 'Connectivity',
        issue: 'DHCP Lease Assigned',
        severity: 'INFO',
        impact: 'Client IP parameters assigned successfully',
        explanation: 'IP allocation logged for client interface.',
        suggestedFix: 'No action required.',
        cliCommand: ''
      });
      categories.add('Connectivity');
    }
    
    // User Login Successful
    else if (lineLower.includes('user login')) {
      findings.push({
        type: 'Security',
        issue: 'User Login Successful',
        severity: 'INFO',
        impact: 'Successful operator login session established',
        explanation: 'Operator authenticated successfully.',
        suggestedFix: 'No action required.',
        cliCommand: ''
      });
      categories.add('Security');
    }
  }
  
  const recs = findings
    .filter(f => f.suggestedFix)
    .map(f => `- **${f.issue}**: ${f.suggestedFix}.`);
  const aiRecommendations = recs.length > 0 ? recs.join('\n') : 'All logs conform to standard operational metrics.';
  
  const uniqueRootCauses: string[] = [];
  for (const rc of rootCauses) {
    if (!uniqueRootCauses.includes(rc)) {
      uniqueRootCauses.push(rc);
    }
  }
  
  return {
    findings,
    rootCauses: uniqueRootCauses,
    aiRecommendations,
    confidenceScore: findings.length > 0 ? 96 : 100
  };
}
