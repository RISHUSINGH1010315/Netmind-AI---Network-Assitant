import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  GitBranch, 
  RefreshCw, 
  AlertTriangle, 
  Terminal, 
  Activity, 
  Network,
  ListRestart,
  Route
} from 'lucide-react';

export default function VlanRouting() {
  const [vlanFindings, setVlanFindings] = useState<any[]>([]);
  const [routingFindings, setRoutingFindings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchFindings();
  }, []);

  const fetchFindings = async () => {
    setLoading(true);
    try {
      const vlanRes = await axios.get('/api/config/findings?category=VLAN');
      const routingRes = await axios.get('/api/config/findings?category=Routing');
      setVlanFindings(vlanRes.data);
      setRoutingFindings(routingRes.data);
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
          <p className="text-slate-500">Routing & VLAN status indicators</p>
          <p className="text-sm font-bold text-slate-800 mt-1">OSPF, BGP, Static Routes & trunk links are evaluated</p>
        </div>
        <button
          onClick={fetchFindings}
          className="p-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Auditing VLAN & Routing configurations...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* VLAN Diagnostics */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-4">
              <Network className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-slate-800">VLAN Troubleshooting Engine</h3>
            </div>

            <div className="space-y-4">
              {vlanFindings.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-55 rounded-xl border border-dashed border-slate-100">
                  No active VLAN configuration anomalies. Spanning-tree status: Normal.
                </div>
              ) : (
                vlanFindings.map((finding) => (
                  <div key={finding._id} className="p-4 border border-slate-200 rounded-xl space-y-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Device: {finding.device?.name || 'Generic Switch'}</span>
                      <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded uppercase">
                        {finding.severity}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800">{finding.issue}</h4>

                    <div className="text-[11px] text-slate-600 space-y-1">
                      <p><span className="font-bold text-slate-800">Root Cause:</span> {finding.explanation}</p>
                      <p><span className="font-bold text-slate-800">Impact:</span> {finding.impact}</p>
                      <p><span className="font-bold text-slate-800">Suggested Fix:</span> {finding.suggestedFix}</p>
                    </div>

                    {finding.cliCommand && (
                      <div className="bg-slate-900 text-slate-100 rounded-lg p-2.5 font-mono text-[10px] relative mt-2">
                        <div className="flex justify-between text-slate-400 mb-1 border-b border-slate-800 pb-1">
                          <span>REMEDIATION COMMANDS</span>
                          <button
                            onClick={() => handleCopy(finding.cliCommand, finding._id)}
                            className="text-slate-400 hover:text-white"
                          >
                            {copiedId === finding._id ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        <pre className="whitespace-pre-wrap">{finding.cliCommand}</pre>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Routing Diagnostics */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-4">
              <Route className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-slate-800">Routing Analyzer</h3>
            </div>

            <div className="space-y-4">
              {routingFindings.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-55 rounded-xl border border-dashed border-slate-100">
                  No active routing convergence errors. OSPF/BGP status: Healthy.
                </div>
              ) : (
                routingFindings.map((finding) => (
                  <div key={finding._id} className="p-4 border border-slate-200 rounded-xl space-y-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Device: {finding.device?.name || 'Generic Router'}</span>
                      <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded uppercase">
                        {finding.severity}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800">{finding.issue}</h4>

                    <div className="text-[11px] text-slate-600 space-y-1">
                      <p><span className="font-bold text-slate-800">Explanation:</span> {finding.explanation}</p>
                      <p><span className="font-bold text-slate-800">Impact:</span> {finding.impact}</p>
                      <p><span className="font-bold text-slate-800">Suggested Fix:</span> {finding.suggestedFix}</p>
                    </div>

                    {finding.cliCommand && (
                      <div className="bg-slate-900 text-slate-100 rounded-lg p-2.5 font-mono text-[10px] relative mt-2">
                        <div className="flex justify-between text-slate-400 mb-1 border-b border-slate-800 pb-1">
                          <span>REMEDIATION COMMANDS</span>
                          <button
                            onClick={() => handleCopy(finding.cliCommand, finding._id)}
                            className="text-slate-400 hover:text-white"
                          >
                            {copiedId === finding._id ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        <pre className="whitespace-pre-wrap">{finding.cliCommand}</pre>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
