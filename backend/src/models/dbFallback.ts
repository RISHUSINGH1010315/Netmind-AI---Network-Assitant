import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Global In-Memory Store
const store: { [modelName: string]: any[] } = {
  User: [],
  Device: [],
  Alert: [],
  Incident: [],
  Log: [],
  Configuration: [],
  AIFinding: [],
  ChatSession: [],
  Report: []
};

// Helper to generate mongo-like ObjectId strings
const generateId = () => crypto.randomBytes(12).toString('hex');

// Preseed the in-memory database with identical data as seed.ts
function preseed() {
  const salt = bcrypt.genSaltSync(10);
  const hashedAdminPassword = bcrypt.hashSync('admin123', salt);
  const hashedEngineerPassword = bcrypt.hashSync('engineer123', salt);
  const hashedNocPassword = bcrypt.hashSync('noc123', salt);

  // 1. Users
  const uAdmin = { _id: 'admin_id', name: 'Alex Rivera', email: 'admin@netmind.ai', password: hashedAdminPassword, role: 'Super Admin' };
  const uEng = { _id: 'engineer_id', name: 'Sarah Connor', email: 'engineer@netmind.ai', password: hashedEngineerPassword, role: 'Network Engineer' };
  const uNoc = { _id: 'noc_id', name: 'John Doe', email: 'noc@netmind.ai', password: hashedNocPassword, role: 'NOC Engineer' };
  const uSec = { _id: 'security_id', name: 'Neo Smith', email: 'security@netmind.ai', password: hashedAdminPassword, role: 'Security Analyst' };
  const uView = { _id: 'viewer_id', name: 'Alice Brown', email: 'viewer@netmind.ai', password: hashedAdminPassword, role: 'Viewer' };

  store.User = [uAdmin, uEng, uNoc, uSec, uView];

  // 2. Devices
  const d1 = {
    _id: 'dev1_id',
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
  };
  const d2 = {
    _id: 'dev2_id',
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
  };
  const d3 = {
    _id: 'dev3_id',
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
  };
  const d4 = {
    _id: 'dev4_id',
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
  };

  store.Device = [d1, d2, d3, d4];

  // 3. Alerts
  store.Alert = [
    { _id: 'a1_id', title: 'BGP Connection Loss', message: 'BGP session state transitioned to Active/Idle with peer 192.168.10.44 on Juniper-Edge-04', severity: 'Critical', device: d2, isRead: false, timestamp: new Date() },
    { _id: 'a2_id', title: 'Interface Flap Warning', message: 'Interface GigabitEthernet1/0/2 state changed to down on Cisco-Access-P2', severity: 'Warning', device: d4, isRead: false, timestamp: new Date() },
    { _id: 'a3_id', title: 'VLAN Pruned Configuration', message: 'Spanning tree detected configuration pruning on VLAN 100 on Cisco-Core-01', severity: 'Info', device: d1, isRead: false, timestamp: new Date() }
  ];

  // 4. Incidents
  store.Incident = [
    { _id: 'inc1_id', title: 'Nokia-Dist-12 Down Alert', description: 'Nokia aggregation switch Nokia-Dist-12 is unreachable via SNMP/ICMP.', severity: 'Critical', status: 'Open', device: d3, assignedTo: uNoc, createdAt: new Date() },
    { _id: 'inc2_id', title: 'OSPF Neighborhood Loss', description: 'Cisco-Core-01 has lost OSPF adjacency with neighbor core node.', severity: 'Warning', status: 'In Progress', device: d1, assignedTo: uEng, rootCause: 'MTU mismatch on VLAN interface config', createdAt: new Date() }
  ];

  // 5. Logs
  store.Log = [
    { _id: 'log1_id', device: d1, source: 'Syslog', rawContent: '%OSPF-5-ADJCHG: Process 1, Nbr 10.120.44.2 on GigabitEthernet1/0/1 from FULL to DOWN, Neighbor Down: Dead timer expired', parsedExplanation: 'OSPF dead timer expired with neighbor 10.120.44.2.', severity: 'Critical', timestamp: new Date() },
    { _id: 'log2_id', device: d4, source: 'Syslog', rawContent: '%LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet1/0/2, changed state to down', parsedExplanation: 'Line protocol layer 2 failed. Suggests a duplex mismatch.', severity: 'Warning', timestamp: new Date() }
  ];

  // 6. Configurations & Findings
  const configId = 'c1_id';
  store.Configuration = [{
    _id: configId,
    device: d1,
    fileName: 'Cisco-Core-01-running.cfg',
    rawText: '!Running Config...',
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
      { _id: 'f1_id', type: 'Security', issue: 'Plaintext Enable Password Used', severity: 'Critical', impact: 'Weak privilege control.', explanation: 'Plaintext enable password.', suggestedFix: 'Use enable secret.', cliCommand: 'no enable password\nenable secret admin_secure_pass' },
      { _id: 'f2_id', type: 'Security', issue: 'Insecure Telnet Protocol Enabled', severity: 'Critical', impact: 'Exposes cleartext passwords.', explanation: 'Lines vty allow telnet.', suggestedFix: 'Change to SSH.', cliCommand: 'line vty 0 4\n transport input ssh' }
    ]
  }];

  store.AIFinding = [
    { _id: 'f1_id', device: d1, configuration: configId, category: 'Security', issue: 'Plaintext Enable Password Used', severity: 'Critical', impact: 'Weak privilege control.', explanation: 'Plaintext enable password.', suggestedFix: 'Use enable secret.', cliCommand: 'no enable password\nenable secret admin_secure_pass' },
    { _id: 'f2_id', device: d1, configuration: configId, category: 'Security', issue: 'Insecure Telnet Protocol Enabled', severity: 'Critical', impact: 'Exposes cleartext passwords.', explanation: 'Lines vty allow telnet.', suggestedFix: 'Change to SSH.', cliCommand: 'line vty 0 4\n transport input ssh' }
  ];
}

// Execute preseed on module load
preseed();

class MockQuery {
  private data: any;
  constructor(data: any) {
    if (data === null || data === undefined) {
      this.data = data;
    } else if (Array.isArray(data)) {
      this.data = data.map(item => (typeof item === 'object' && item !== null) ? { ...item } : item);
    } else if (typeof data === 'object') {
      this.data = { ...data };
    } else {
      this.data = data;
    }
  }
  populate(path: string | any) {
    // Populate simple simulated refs if matching
    if (Array.isArray(this.data)) {
      this.data.forEach(item => this._populateItem(item, path));
    } else if (this.data) {
      this._populateItem(this.data, path);
    }
    return this;
  }
  _populateItem(item: any, path: any) {
    const key = typeof path === 'string' ? path : path.path;
    if (key === 'device' && typeof item.device === 'string') {
      item.device = store.Device.find(d => d._id === item.device) || null;
    }
    if (key === 'assignedTo' && typeof item.assignedTo === 'string') {
      item.assignedTo = store.User.find(u => u._id === item.assignedTo) || null;
    }
    if (key === 'contextFiles' && Array.isArray(item.contextFiles)) {
      item.contextFiles = item.contextFiles.map((id: any) => store.Configuration.find(c => c._id === id)).filter(Boolean);
    }
  }
  sort() { return this; }
  limit() { return this; }
  select() { return this; }
  // Thenable trigger
  then(resolve: any) {
    resolve(this.data);
  }
  catch(reject: any) {
    // no-op for mock success
  }
}

class MockModel {
  public modelName: string;
  constructor(name: string) {
    this.modelName = name;
  }

  find(query: any = {}) {
    let list = store[this.modelName] || [];
    // Basic filter helper
    if (query && typeof query === 'object') {
      list = list.filter(item => {
        for (const k in query) {
          if (query[k] !== undefined) {
            if (k === '$or' && Array.isArray(query[k])) {
              return query[k].some((subQuery: any) => {
                const subKey = Object.keys(subQuery)[0];
                const subVal = subQuery[subKey];
                if (subVal && subVal.$regex) {
                  const reg = new RegExp(subVal.$regex, 'i');
                  return reg.test(item[subKey] || '');
                }
                if (this.modelName === 'User' && subKey === 'email' && typeof item[subKey] === 'string' && typeof subVal === 'string') {
                  return item[subKey].toLowerCase().trim() === subVal.toLowerCase().trim();
                }
                return item[subKey] === subVal;
              });
            }
            if (query[k] && query[k].$regex) {
              const reg = new RegExp(query[k].$regex, 'i');
              return reg.test(item[k] || '');
            }
            if (query[k] && query[k].$in) {
              return query[k].$in.includes(item[k]);
            }
            if (query[k] && query[k].$ne) {
              return item[k] !== query[k].$ne;
            }
            if (this.modelName === 'User' && k === 'email' && typeof item[k] === 'string' && typeof query[k] === 'string') {
              if (item[k].toLowerCase().trim() !== query[k].toLowerCase().trim()) return false;
            } else {
              if (item[k] !== query[k]) return false;
            }
          }
        }
        return true;
      });
    }
    return new MockQuery(list);
  }

  findOne(query: any = {}) {
    const list = this.find(query);
    let result = null;
    list.then((res: any) => {
      result = res[0] || null;
    });
    // Add User comparePassword mock method if User model
    if (result && this.modelName === 'User') {
      (result as any).comparePassword = async function(pwd: string) {
        return bcrypt.compare(pwd, this.password);
      };
    }
    return new MockQuery(result);
  }

  findById(id: string) {
    const list = store[this.modelName] || [];
    const result = list.find(item => item._id === id) || null;
    return new MockQuery(result);
  }

  findByIdAndUpdate(id: string, update: any, options: any = {}) {
    const list = store[this.modelName] || [];
    const idx = list.findIndex(item => item._id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...update };
      return new MockQuery(list[idx]);
    }
    return new MockQuery(null);
  }

  findByIdAndDelete(id: string) {
    const list = store[this.modelName] || [];
    const idx = list.findIndex(item => item._id === id);
    if (idx !== -1) {
      const removed = list.splice(idx, 1)[0];
      return new MockQuery(removed);
    }
    return new MockQuery(null);
  }

  countDocuments(query: any = {}) {
    let count = 0;
    this.find(query).then((res: any) => {
      count = res.length;
    });
    return new MockQuery(count);
  }

  updateMany(query: any, update: any) {
    const list = store[this.modelName] || [];
    list.forEach((item, idx) => {
      // Apply update
      list[idx] = { ...item, ...update };
    });
    return new MockQuery({ modifiedCount: list.length });
  }

  // Support document instantiation new Model(data)
  createDocument(data: any) {
    const doc = {
      _id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data
    };
    
    // Add User password hashing and email normalization simulator
    if (this.modelName === 'User') {
      if (doc.password) {
        const salt = bcrypt.genSaltSync(10);
        doc.password = bcrypt.hashSync(doc.password, salt);
      }
      if (doc.email) {
        doc.email = doc.email.toLowerCase().trim();
      }
    }

    const self = this;
    return {
      ...doc,
      save: async function() {
        const list = store[self.modelName] || [];
        const existingIdx = list.findIndex(item => item._id === doc._id);
        if (existingIdx !== -1) {
          list[existingIdx] = { ...list[existingIdx], ...this, updatedAt: new Date() };
        } else {
          list.push({ ...this, updatedAt: new Date() });
        }
        return this;
      }
    };
  }
}

export function getMockModel(modelName: string) {
  const modelInstance = new MockModel(modelName);
  // Return constructor function proxy
  const constructorMock = function(data: any) {
    return modelInstance.createDocument(data);
  };
  // Copy static methods
  Object.setPrototypeOf(constructorMock, modelInstance);
  
  // Set function name property so this.name also matches modelName
  Object.defineProperty(constructorMock, 'name', {
    value: modelName,
    configurable: true
  });
  
  return constructorMock;
}
