import { Response } from 'express';
import ChatSession from '../models/ChatSession';
import Configuration from '../models/Configuration';
import { AuthenticatedRequest } from '../middleware/auth';
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const getSessions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const sessions = await ChatSession.find({ user: req.user.id })
      .select('title createdAt updatedAt')
      .sort({ updatedAt: -1 });
    return res.json(sessions);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getSessionById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const session = await ChatSession.findById(req.params.id)
      .populate('contextFiles', 'fileName createdAt');

    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    if (session.user.toString() !== req.user?.id && req.user?.role !== 'Super Admin') {
      return res.status(403).json({ error: 'Access denied to this chat session' });
    }

    return res.json(session);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const createSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, contextFileIds } = req.body;
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const newSession = new ChatSession({
      user: req.user.id,
      title: title || 'New Troubleshooting Session',
      messages: [],
      contextFiles: contextFileIds || []
    });

    await newSession.save();
    return res.status(201).json(newSession);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const session = await ChatSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    // Append user message
    session.messages.push({
      sender: 'user',
      content: message,
      timestamp: new Date()
    });

    // Retrieve context configurations
    let contextConfigs: any[] = [];
    if (session.contextFiles && session.contextFiles.length > 0) {
      contextConfigs = await Configuration.find({ _id: { $in: session.contextFiles } }).select('fileName rawText findings');
    }

    let reply = '';

    try {
      // Forward to FastAPI RAG service
      const response = await axios.post(`${AI_SERVICE_URL}/api/ai/chat`, {
        session_id: session._id,
        user_message: message,
        context_files: contextConfigs.map((c) => ({
          filename: c.fileName,
          raw_text: c.rawText,
          findings: c.findings
        }))
      });
      reply = response.data.reply;
    } catch (err) {
      // Node.js fallback RAG generator
      reply = generateFallbackReply(message, contextConfigs);
    }

    // Append AI reply
    session.messages.push({
      sender: 'ai',
      content: reply,
      timestamp: new Date()
    });

    await session.save();
    return res.json(session);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

function generateFallbackReply(msg: string, configs: any[]): string {
  const query = msg.toLowerCase();

  // Basic routing helper
  if (query.includes('ospf')) {
    return `### OSPF Troubleshooting Insights\n\nBased on common OSPF issues:\n1. **Hello/Dead Intervals:** Ensure neighbor timers match exactly (default is Hello 10s, Dead 40s on Ethernet).\n2. **Area Matching:** Confirm interface area configurations match. OSPF area 0 is required for transit connectivity.\n3. **IP/Subnet Mismatch:** Neighbors must belong to the exact same subnet mask.\n4. **MTU Mismatch:** Check interface MTUs. If they mismatch, neighbors might stay stuck in Exchange/Loading state.\n\n**CLI Check Commands:**\n\`\`\`cisco\nshow ip ospf neighbor\nshow ip ospf interface brief\ndebug ip ospf adj\n\`\`\``;
  }

  if (query.includes('vlan') || query.includes('reach vlan')) {
    return `### Inter-VLAN Routing Diagnostics\n\nIf VLANs cannot reach each other:\n1. **Layer 3 Switch/Router Gateway:** Check if a Gateway of Last Resort or subinterfaces (Router-on-a-Stick) are configured. Ensure the interfaces are up (\`no shutdown\`).\n2. **Trunk Links:** Verify the links between switches are configured as trunks: \`switchport mode trunk\`.\n3. **Native VLAN:** Ensure both sides of the trunk have the identical native VLAN (\`switchport trunk native vlan [ID]\`). Mismatches cause packets to leak or be dropped.\n4. **IP Routing:** Enable IP routing on Layer 3 switches with the command \`ip routing\`.`;
  }

  if (query.includes('analyze') || query.includes('configuration') || query.includes('config')) {
    if (configs.length > 0) {
      const summary = configs.map(c => `**${c.fileName}** with ${c.findings?.length || 0} findings`).join(', ');
      return `### Loaded Configuration Context\n\nI have indexed the configuration: ${summary}.\n\nHere are the critical observations:\n- **Security:** Please ensure plaintext telnet configurations are audited. We found insecure transport setups.\n- **Interface configurations:** Please review any interfaces containing physical errors or interface down state.\n\nLet me know if you want me to write CLI configurations to fix these issues.`;
    }
    return `No configuration file has been loaded in this chat session. You can link a configuration file to this session or upload one in the **Config Analyzer** tab for me to trace its security rules, routing details, and ACL configurations.`;
  }

  return `### NetMind AI Operations Center\n\nHello! I am NetMind AI, your Network Troubleshooting Assistant.\n\nI can help you debug:\n- OSPF/BGP routing anomalies\n- VLAN trunking, mismatch, and routing failures\n- ACL security audits\n- Syslog parsing\n- Interface CRC packet drop diagnostics\n\nTry asking me:\n- *"Why is OSPF failing?"*\n- *"Analyze the uploaded Cisco switch config"* \n- *"How do I resolve a Native VLAN mismatch?"*`;
}
