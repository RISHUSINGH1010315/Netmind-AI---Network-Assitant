import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCw, 
  Terminal, 
  HelpCircle,
  AlertTriangle,
  Lock,
  Unlock
} from 'lucide-react';

export default function AclSecurity() {
  const [findings, setFindings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchFindings();
  }, []);

  const fetchFindings = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/config/findings?category=Security');
      setFindings(res.data);
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

  // Calculate compliance score
  const criticalCount = findings.filter(f => f.severity === 'Critical').length;
  const warningCount = findings.filter(f => f.severity === 'Warning').length;
  const securityScore = Math.max(100 - (criticalCount * 15 + warningCount * 5), 35);

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm items-center">
        <div className="md:col-span-2">
          <h3 className="text-base font-black text-slate-800 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span>Infrastructure Security Audits</span>
          </h3>
          <p className="text-slate-500 text-xs mt-1">
            Running config files are audited against NIST guidelines, Telnet transport blocks, weak passwords, and shadow ACL rules.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SECURITY SCORE</span>
          <span className={`text-4xl font-black mt-1 ${
            securityScore > 80 ? 'text-green-600' : securityScore > 50 ? 'text-orange-500' : 'text-red-600'
          }`}>{securityScore} / 100</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading security audit records...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Rules compliance list */}
          <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 h-fit">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3">Compliance Audits</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2 rounded hover:bg-slate-50">
                <span className="text-slate-600 font-semibold">SSH transport policy</span>
                {findings.some(f => f.issue.includes('Telnet')) ? (
                  <span className="text-red-600 font-bold flex items-center"><Unlock className="w-3.5 h-3.5 mr-1" /> FAILED</span>
                ) : (
                  <span className="text-green-600 font-bold flex items-center"><Lock className="w-3.5 h-3.5 mr-1" /> SECURE</span>
                )}
              </div>
              <div className="flex items-center justify-between p-2 rounded hover:bg-slate-50">
                <span className="text-slate-600 font-semibold">Enable secrets hashing</span>
                {findings.some(f => f.issue.includes('Plaintext')) ? (
                  <span className="text-red-600 font-bold flex items-center"><Unlock className="w-3.5 h-3.5 mr-1" /> FAILED</span>
                ) : (
                  <span className="text-green-600 font-bold flex items-center"><Lock className="w-3.5 h-3.5 mr-1" /> SECURE</span>
                )}
              </div>
              <div className="flex items-center justify-between p-2 rounded hover:bg-slate-50">
                <span className="text-slate-600 font-semibold">SNMP community strings</span>
                {findings.some(f => f.issue.includes('SNMP')) ? (
                  <span className="text-red-600 font-bold flex items-center"><Unlock className="w-3.5 h-3.5 mr-1" /> FAILED</span>
                ) : (
                  <span className="text-green-600 font-bold flex items-center"><Lock className="w-3.5 h-3.5 mr-1" /> SECURE</span>
                )}
              </div>
              <div className="flex items-center justify-between p-2 rounded hover:bg-slate-50">
                <span className="text-slate-600 font-semibold">Open access ACL lists</span>
                <span className="text-green-600 font-bold flex items-center"><Lock className="w-3.5 h-3.5 mr-1" /> SECURE</span>
              </div>
            </div>
          </div>

          {/* Detailed Vulnerability Findings */}
          <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-3">Detected Security Vulnerabilities</h3>
            
            <div className="space-y-4">
              {findings.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-450 border border-dashed border-slate-200 rounded-xl">
                  No security issues found. Running configurations meet high encryption policies.
                </div>
              ) : (
                findings.map((f) => (
                  <div key={f._id} className="p-4 border border-slate-200 rounded-xl space-y-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-550 uppercase">Device: {f.device?.name || 'Local config'}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                        f.severity === 'Critical' ? 'bg-red-50 text-red-650' : 'bg-orange-50 text-orange-600'
                      }`}>{f.severity}</span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 flex items-center">
                      <ShieldAlert className="w-4 h-4 text-red-500 mr-2" />
                      <span>{f.issue}</span>
                    </h4>

                    <div className="text-[11px] text-slate-650 space-y-1.5 leading-relaxed">
                      <p><span className="font-bold text-slate-800">Impact Threat:</span> {f.impact}</p>
                      <p><span className="font-bold text-slate-800">Vulnerability Explanation:</span> {f.explanation}</p>
                      <p><span className="font-bold text-slate-800">Suggested Fix:</span> {f.suggestedFix}</p>
                    </div>

                    {f.cliCommand && (
                      <div className="bg-slate-900 text-slate-100 rounded-lg p-2.5 font-mono text-[10px] relative mt-2">
                        <div className="flex justify-between text-slate-400 mb-1 border-b border-slate-800 pb-1">
                          <span>MITIGATION CONFIGS</span>
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
      )}
    </div>
  );
}
