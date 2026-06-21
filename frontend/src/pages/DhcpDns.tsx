import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  HelpCircle, 
  RefreshCw, 
  AlertTriangle,
  Activity,
  Database,
  Globe
} from 'lucide-react';

export default function DhcpDns() {
  const [dhcpFindings, setDhcpFindings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Simulated DHCP scope usage
  const scopes = [
    { name: 'Branch-Users-Pool', subnet: '192.168.20.0/24', total: 254, activeLeases: 248, dnsServers: '8.8.8.8, 1.1.1.1', gateway: '192.168.20.1' },
    { name: 'IoT-Sensors-Pool', subnet: '172.16.50.0/24', total: 254, activeLeases: 12, dnsServers: 'None', gateway: '172.16.50.1' },
    { name: 'Core-Servers-Static', subnet: '10.100.10.0/24', total: 254, activeLeases: 180, dnsServers: '10.100.10.2, 10.100.10.3', gateway: '10.100.10.1' }
  ];

  useEffect(() => {
    fetchFindings();
  }, []);

  const fetchFindings = async () => {
    setLoading(true);
    try {
      const dhcpRes = await axios.get('/api/config/findings?category=DHCP');
      const dnsRes = await axios.get('/api/config/findings?category=DNS');
      setDhcpFindings([...dhcpRes.data, ...dnsRes.data]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (cmd: string, id: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="text-xs">
          <p className="text-slate-500">DHCP & DNS Pool Scopes</p>
          <p className="text-sm font-bold text-slate-800 mt-1">Live active scopes, client lease rates, and resolve servers are audited.</p>
        </div>
        <button
          onClick={fetchFindings}
          className="p-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* DHCP Pools table */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-4">
            <Database className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-slate-800">DHCP Scope Pools</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="px-4 py-2">Pool Name</th>
                  <th className="px-4 py-2">Subnet Scope</th>
                  <th className="px-4 py-2 text-right">Lease Ratio</th>
                  <th className="px-4 py-2">Primary Gateway</th>
                  <th className="px-4 py-2">DNS Configuration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {scopes.map((scope, index) => {
                  const leasePercentage = Math.round((scope.activeLeases / scope.total) * 100);
                  const isExhausted = leasePercentage > 90;
                  const isMissingDns = scope.dnsServers === 'None';
                  
                  return (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-bold">{scope.name}</td>
                      <td className="px-4 py-3 font-mono text-slate-655">{scope.subnet}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end">
                          <span className={`font-mono font-bold ${isExhausted ? 'text-red-650' : 'text-slate-800'}`}>
                            {scope.activeLeases} / {scope.total} ({leasePercentage}%)
                          </span>
                          <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                            <div className={`h-full ${isExhausted ? 'bg-red-500' : 'bg-primary'}`} style={{ width: `${leasePercentage}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono">{scope.gateway}</td>
                      <td className={`px-4 py-3 ${isMissingDns ? 'text-orange-500 font-bold' : 'text-slate-500'}`}>
                        {scope.dnsServers}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Configuration Anomalies Findings */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-4">
            <Globe className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-slate-800">DHCP/DNS Diagnostics</h3>
          </div>

          <div className="space-y-4">
            {loading ? (
              <p className="text-xs text-slate-400">Analyzing DHCP configurations...</p>
            ) : dhcpFindings.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-55 border border-dashed border-slate-150 rounded-xl">
                No active DHCP or DNS configuration errors detected.
              </div>
            ) : (
              dhcpFindings.map((f) => (
                <div key={f._id} className="p-4 border border-slate-200 rounded-xl space-y-3 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Device: {f.device?.name || 'Local config'}</span>
                    <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded uppercase">{f.severity}</span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-850 flex items-center">
                    <AlertTriangle className="w-4 h-4 text-orange-500 mr-2 shrink-0" />
                    <span>{f.issue}</span>
                  </h4>

                  <div className="text-[11px] text-slate-600 space-y-1">
                    <p><span className="font-bold text-slate-800">Impact:</span> {f.impact}</p>
                    <p><span className="font-bold text-slate-800">Suggested Fix:</span> {f.suggestedFix}</p>
                  </div>

                  {f.cliCommand && (
                    <div className="bg-slate-900 text-slate-100 rounded-lg p-2.5 font-mono text-[10px] relative mt-2">
                      <div className="flex justify-between text-slate-400 mb-1 border-b border-slate-800 pb-1">
                        <span>REMEDIATION COMMANDS</span>
                        <button
                          onClick={() => handleCopy(f.cliCommand, f._id)}
                          className="text-slate-400 hover:text-white"
                        >
                          {copiedId === f._id ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <pre className="whitespace-pre-wrap">{f.cliCommand}</pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
