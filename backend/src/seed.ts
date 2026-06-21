import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';
import Device from './models/Device';
import Alert from './models/Alert';
import Incident from './models/Incident';
import Log from './models/Log';
import Configuration from './models/Configuration';
import AIFinding from './models/AIFinding';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/netmind-ai';

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Device.deleteMany({});
    await Alert.deleteMany({});
    await Incident.deleteMany({});
    await Log.deleteMany({});
    await Configuration.deleteMany({});
    await AIFinding.deleteMany({});

    console.log('Cleared existing collections.');

    // 1. Create Users
    const adminUser = new User({
      name: 'Alex Rivera',
      email: 'admin@netmind.ai',
      password: 'admin123',
      role: 'Super Admin'
    });

    const engineerUser = new User({
      name: 'Sarah Connor',
      email: 'engineer@netmind.ai',
      password: 'engineer123',
      role: 'Network Engineer'
    });

    const nocUser = new User({
      name: 'John Doe',
      email: 'noc@netmind.ai',
      password: 'noc123',
      role: 'NOC Engineer'
    });

    const securityUser = new User({
      name: 'Neo Smith',
      email: 'security@netmind.ai',
      password: 'security123',
      role: 'Security Analyst'
    });

    const viewerUser = new User({
      name: 'Alice Brown',
      email: 'viewer@netmind.ai',
      password: 'viewer123',
      role: 'Viewer'
    });

    await adminUser.save();
    await engineerUser.save();
    await nocUser.save();
    await securityUser.save();
    await viewerUser.save();

    console.log('Seeded Users: admin@netmind.ai / admin123, engineer@netmind.ai / engineer123, etc.');

    // 2. Create Devices
    const dev1 = new Device({
      name: 'Cisco-Core-01',
      vendor: 'Cisco',
      model: 'Catalyst 9500',
      serialNumber: 'FXS22019X02',
      ipAddress: '10.120.44.1',
      location: 'San Jose - DC1',
      firmware: '17.06.01s',
      status: 'Online',
      macAddress: '00:1A:2B:3C:4D:5E',
      cpuUsage: 12,
      memoryUsage: 4.2,
      memoryTotal: 16,
      uptime: 242,
      packetLoss: 0.02
    });

    const dev2 = new Device({
      name: 'Juniper-Edge-04',
      vendor: 'Juniper',
      model: 'MX204-HW',
      serialNumber: 'JUN-99812-B',
      ipAddress: '192.168.10.45',
      location: 'London - LHR-02',
      firmware: '21.4R1.12',
      status: 'Online',
      macAddress: '00:11:22:33:44:55',
      cpuUsage: 28,
      memoryUsage: 6.8,
      memoryTotal: 16,
      uptime: 98,
      packetLoss: 0.05
    });

    const dev3 = new Device({
      name: 'Nokia-Dist-12',
      vendor: 'Nokia',
      model: '7750 SR-1s',
      serialNumber: 'NOK-12345',
      ipAddress: '172.16.88.12',
      location: 'Tokyo - TYO-09',
      firmware: '22.10.R3',
      status: 'Offline',
      macAddress: 'AA:BB:CC:DD:EE:FF',
      cpuUsage: 0,
      memoryUsage: 0,
      memoryTotal: 32,
      uptime: 0,
      packetLoss: 100
    });

    const dev4 = new Device({
      name: 'Cisco-Access-P2',
      vendor: 'Cisco',
      model: 'Catalyst 9300L',
      serialNumber: 'C9300-33L10',
      ipAddress: '10.120.55.102',
      location: 'San Jose - DC1',
      firmware: '17.03.04',
      status: 'Online',
      macAddress: '00:AA:BB:CC:DD:EE',
      cpuUsage: 8,
      memoryUsage: 3.1,
      memoryTotal: 8,
      uptime: 154,
      packetLoss: 0.00
    });

    await dev1.save();
    await dev2.save();
    await dev3.save();
    await dev4.save();

    console.log('Seeded Devices.');

    // 3. Create Alerts
    const alert1 = new Alert({
      title: 'BGP Connection Loss',
      message: 'BGP session state transitioned to Active/Idle with peer 192.168.10.44 on Juniper-Edge-04',
      severity: 'Critical',
      device: dev2._id
    });

    const alert2 = new Alert({
      title: 'Interface Flap Warning',
      message: 'Interface GigabitEthernet1/0/2 state changed to down on Cisco-Access-P2',
      severity: 'Warning',
      device: dev4._id
    });

    const alert3 = new Alert({
      title: 'VLAN Pruned Configuration',
      message: 'Spanning tree detected configuration pruning on VLAN 100 on Cisco-Core-01',
      severity: 'Info',
      device: dev1._id
    });

    await alert1.save();
    await alert2.save();
    await alert3.save();

    console.log('Seeded Alerts.');

    // 4. Create Incidents
    const inc1 = new Incident({
      title: 'Nokia-Dist-12 Down Alert',
      description: 'Nokia aggregation switch Nokia-Dist-12 is unreachable via SNMP/ICMP. Potential power line issue or interface loop in local rack TYO-09.',
      severity: 'Critical',
      status: 'Open',
      device: dev3._id,
      assignedTo: nocUser._id
    });

    const inc2 = new Incident({
      title: 'OSPF Neighborhood Loss',
      description: 'Cisco-Core-01 has lost OSPF adjacency with neighbor core node. Check interface subnets and MTU configurations.',
      severity: 'Warning',
      status: 'In Progress',
      device: dev1._id,
      assignedTo: engineerUser._id,
      rootCause: 'MTU mismatch on VLAN interface config'
    });

    await inc1.save();
    await inc2.save();

    console.log('Seeded Incidents.');

    // 5. Create logs
    const log1 = new Log({
      device: dev1._id,
      source: 'Syslog',
      rawContent: '%OSPF-5-ADJCHG: Process 1, Nbr 10.120.44.2 on GigabitEthernet1/0/1 from FULL to DOWN, Neighbor Down: Dead timer expired',
      parsedExplanation: 'OSPF dead timer expired with neighbor 10.120.44.2. Usually caused by physical packet drops, MTU mismatch, or keepalive delay.',
      severity: 'Critical'
    });

    const log2 = new Log({
      device: dev4._id,
      source: 'Syslog',
      rawContent: '%LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet1/0/2, changed state to down',
      parsedExplanation: 'Line protocol layer 2 failed. Suggests a duplex mismatch, trunk VLAN pruning, or faulty transceiver.',
      severity: 'Warning'
    });

    await log1.save();
    await log2.save();

    console.log('Seeded Logs.');

    // 6. Create Configuration with AI Findings
    const sampleConfig = new Configuration({
      device: dev1._id,
      fileName: 'Cisco-Core-01-running.cfg',
      rawText: `!
hostname Cisco-Core-01
!
enable password cisco_unsafe_admin
!
username admin privilege 15 secret admin123
!
interface GigabitEthernet1/0/1
 description Transit Link to Core-R2
 ip address 10.120.44.1 255.255.255.252
!
interface GigabitEthernet1/0/2
 description Access Switch link
 switchport trunk native vlan 99
!
router ospf 1
 router-id 1.1.1.1
!
line vty 0 4
 transport input telnet
 login local
!
`,
      parsedData: {
        hostname: 'Cisco-Core-01',
        interfaces: [
          { name: 'GigabitEthernet1/0/1', ipAddress: '10.120.44.1 255.255.255.252', status: 'Up/Active', description: 'Transit Link to Core-R2' },
          { name: 'GigabitEthernet1/0/2', ipAddress: 'Unassigned', status: 'Up/Active', description: 'Access Switch link' }
        ],
        routing: { ospf: true, bgp: false, staticRoutes: [] },
        vlans: []
      },
      findings: [
        {
          type: 'Security',
          issue: 'Plaintext Enable Password Used',
          severity: 'Critical',
          impact: 'The enable password is stored as plaintext. Anyone with configuration read access can easily decrypt and escalate privileges.',
          explanation: 'Use of "enable password" represents a weak cipher standard. Modern systems require the SHA-256 encrypted "enable secret".',
          suggestedFix: 'Replace plaintext password configuration with enable secret configuration.',
          cliCommand: 'no enable password\nenable secret admin_secure_pass'
        },
        {
          type: 'Security',
          issue: 'Insecure Telnet Protocol Enabled',
          severity: 'Critical',
          impact: 'Telnet transmits all packets (including authentication passwords) in plaintext. An attacker can intercept control packets and hijack session credentials.',
          explanation: 'Lines VTY allow remote administration. Direct Telnet protocol enabled allows remote sniffing of admin privileges.',
          suggestedFix: 'Configure transport input to only allow encrypted SSH sessions.',
          cliCommand: 'line vty 0 4\n transport input ssh'
        },
        {
          type: 'Routing',
          issue: 'OSPF Process Lacks Interface Networks',
          severity: 'Warning',
          impact: 'OSPF routing protocol runs but is not advertised on any local interfaces. Neighbors will not form adjacency, and no routes are exchanged.',
          explanation: 'OSPF requires declaring which subnets to participate in using network statements.',
          suggestedFix: 'Define target network subnets or set interfaces to run OSPF directly.',
          cliCommand: 'router ospf 1\n network 10.120.44.0 0.0.0.3 area 0'
        }
      ]
    });

    await sampleConfig.save();

    for (const finding of sampleConfig.findings) {
      const aiFinding = new AIFinding({
        device: dev1._id,
        configuration: sampleConfig._id,
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

    console.log('Seeded Configuration and findings.');

    console.log('Database seeding successfully finished.');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.warn('\n⚠️  MongoDB connection failed. Skipping seeding.');
    console.warn('The application will run automatically in in-memory fallback mode using pre-seeded mock data.\n');
    process.exit(0);
  }
}

seed();
