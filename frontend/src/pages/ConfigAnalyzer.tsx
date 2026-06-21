import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Upload, 
  Check, 
  Copy, 
  AlertTriangle, 
  Terminal, 
  CheckCircle,
  FileText,
  HelpCircle,
  Cpu
} from 'lucide-react';

export default function ConfigAnalyzer() {
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [rawText, setRawText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const getSeverityCount = (findings: any[], severityName: string) => {
    if (!findings) return 0;
    return findings.filter((f: any) => f.severity?.toLowerCase() === severityName.toLowerCase()).length;
  };

  const getCategoriesList = (findings: any[]) => {
    if (!findings) return [];
    const counts: Record<string, number> = {};
    findings.forEach((f: any) => {
      const cat = f.type || 'Config';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await axios.get('/api/devices');
      setDevices(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyCommand = (cmd: string, index: number) => {
    navigator.clipboard.writeText(cmd);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setAnalyzing(true);

    try {
      const formData = new FormData();
      if (selectedDeviceId) {
        formData.append('deviceId', selectedDeviceId);
      }

      if (file) {
        formData.append('configFile', file);
      } else if (rawText) {
        formData.append('rawText', rawText);
      } else {
        throw new Error('Please select a file or paste configuration content.');
      }

      const res = await axios.post('/api/config/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to complete configuration audit.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Upload/Paste Form */}
      <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 h-fit">
        <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
          <Upload className="w-4 h-4 text-primary" />
          <span>Upload Network Configuration</span>
        </h3>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Link to Device Inventory (Optional)</label>
            <select
              className="w-full p-2 border border-slate-200 rounded-lg outline-none bg-slate-50 focus:bg-white text-xs"
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
            >
              <option value="">-- Standalone Analysis --</option>
              {devices.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.ipAddress} - {d.vendor})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Upload Configuration File (.cfg, .txt, .log)</label>
            <div className="border-2 border-dashed border-slate-200 hover:border-primary/50 transition-colors rounded-xl p-6 text-center cursor-pointer relative bg-slate-50/50">
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFile(e.target.files[0]);
                    setRawText('');
                  }
                }}
              />
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <span className="block font-bold text-slate-700">
                {file ? file.name : 'Select configuration file'}
              </span>
              <span className="block text-slate-400 mt-1 text-[10px]">drag & drop or browse from disk</span>
            </div>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-[10px] uppercase font-bold">OR PASTE TEXT</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Paste Running Configuration</label>
            <textarea
              className="w-full h-48 p-3 border border-slate-200 rounded-xl outline-none font-mono text-[11px] bg-slate-50 focus:bg-white resize-none"
              placeholder="! paste router/switch running config here&#10;hostname Core-R1&#10;enable password plain_pass&#10;line vty 0 4&#10; transport input telnet"
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                setFile(null);
              }}
              disabled={!!file}
            />
          </div>

          <button
            type="submit"
            disabled={analyzing}
            className="w-full py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover shadow transition-all active:scale-95 disabled:opacity-50"
          >
            {analyzing ? 'AI Analyzer Analyzing...' : 'Run Audit Analyzer'}
          </button>
        </form>
      </div>

      {/* Analysis Results View */}
      <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-primary" />
          <span>Audit Findings & Diagnostics</span>
        </h3>

        {!result ? (
          <div className="flex flex-col items-center justify-center h-80 text-center border-2 border-dashed border-slate-100 rounded-xl">
            <Cpu className="w-12 h-12 text-slate-300 animate-pulse mb-2" />
            <p className="text-xs font-bold text-slate-700">Awaiting configuration audit</p>
            <p className="text-[10px] text-slate-400 mt-1">Upload or paste running config to trigger AI scanner</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 flex flex-wrap justify-between items-center gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ANALYZER MODE</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-1 shadow-sm`} style={{
                  backgroundColor: result.analyzerMode === 'LOG_ANALYSIS' ? '#eef2ff' : '#e0f2fe',
                  color: result.analyzerMode === 'LOG_ANALYSIS' ? '#4f46e5' : '#0369a1',
                  border: `1px solid ${result.analyzerMode === 'LOG_ANALYSIS' ? '#c7d2fe' : '#bae6fd'}`
                }}>
                  {result.analyzerMode === 'LOG_ANALYSIS' ? 'LOG_ANALYSIS' : 'CONFIG_AUDIT'}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TARGET IDENTITY</p>
                <p className="text-xs font-black text-slate-800 mt-1">
                  {result.analyzerMode === 'LOG_ANALYSIS' 
                    ? (result.fileName || 'manual-input.log') 
                    : (result.parsedData?.hostname || 'Generic Target Router')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ANOMALIES FOUND</p>
                <p className="text-sm font-black text-red-600 mt-0.5">{result.findings?.length || 0} issues</p>
              </div>
            </div>

            {/* Log Specific Metric & Summary Panels */}
            {result.analyzerMode === 'LOG_ANALYSIS' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Confidence and Severity Summary */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">Confidence Score</span>
                    <span className="text-sm font-extrabold text-indigo-650">{result.confidenceScore || 95}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${result.confidenceScore || 95}%` }}
                    ></div>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Severity Summary</span>
                    <div className="grid grid-cols-5 gap-1.5 text-center">
                      <div className="bg-red-50 border border-red-100 rounded p-1">
                        <p className="text-[9px] font-bold text-red-500">Critical</p>
                        <p className="text-xs font-extrabold text-red-700">{getSeverityCount(result.findings, 'critical')}</p>
                      </div>
                      <div className="bg-amber-50 border border-amber-100 rounded p-1">
                        <p className="text-[9px] font-bold text-amber-500">High</p>
                        <p className="text-xs font-extrabold text-amber-700">{getSeverityCount(result.findings, 'high')}</p>
                      </div>
                      <div className="bg-orange-50 border border-orange-100 rounded p-1">
                        <p className="text-[9px] font-bold text-orange-500">Medium</p>
                        <p className="text-xs font-extrabold text-orange-700">{getSeverityCount(result.findings, 'medium')}</p>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 rounded p-1">
                        <p className="text-[9px] font-bold text-blue-500">Low</p>
                        <p className="text-xs font-extrabold text-blue-700">{getSeverityCount(result.findings, 'low')}</p>
                      </div>
                      <div className="bg-teal-50 border border-teal-100 rounded p-1">
                        <p className="text-[9px] font-bold text-teal-500">Info</p>
                        <p className="text-xs font-extrabold text-teal-700">{getSeverityCount(result.findings, 'info')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category Summary */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Category Summary</span>
                  <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
                    {getCategoriesList(result.findings).map(([cat, count]: any) => (
                      <div key={cat} className="flex justify-between items-center text-xs text-slate-600">
                        <span className="font-semibold">{cat}</span>
                        <span className="bg-slate-200 px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-700">{count}</span>
                      </div>
                    ))}
                    {getCategoriesList(result.findings).length === 0 && (
                      <p className="text-[10px] text-slate-400">No categories recorded</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Root Causes and AI Recommendations */}
            {result.analyzerMode === 'LOG_ANALYSIS' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Root Cause Analysis */}
                <div className="bg-amber-50/55 border border-amber-250 rounded-xl p-4 space-y-2" style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }}>
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Probable Root Cause Analysis</span>
                  <div className="space-y-1">
                    {result.rootCauses && result.rootCauses.length > 0 ? (
                      result.rootCauses.map((rc: string, idx: number) => (
                        <div key={idx} className="flex items-center space-x-2 text-xs text-slate-700 font-semibold bg-white border border-amber-100 p-2 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          <span>{rc}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-500 italic">No definite root cause identified from logs.</p>
                    )}
                  </div>
                </div>

                {/* AI Recommendations */}
                <div className="bg-indigo-50/45 border border-indigo-250 rounded-xl p-4 space-y-2" style={{ backgroundColor: '#eef2ff60', borderColor: '#c7d2fe' }}>
                  <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">AI Remediation Recommendations</span>
                  <div className="text-xs text-slate-700 max-h-[140px] overflow-y-auto leading-relaxed pr-1 font-sans">
                    {result.aiRecommendations ? (
                      result.aiRecommendations.split('\n').map((para: string, idx: number) => {
                        if (para.trim().startsWith('-')) {
                          return (
                            <li key={idx} className="list-none flex items-start space-x-1.5 py-0.5">
                              <span className="text-indigo-600 mt-1 font-bold">•</span>
                              <span>{para.replace(/^-\s*/, '')}</span>
                            </li>
                          );
                        }
                        return <p key={idx} className="mb-1">{para}</p>;
                      })
                    ) : (
                      <p className="text-[10px] text-slate-500 italic">No specific remediation steps found.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
              {result.findings?.map((finding: any, idx: number) => (
                <div key={idx} className="p-4 border border-slate-200 rounded-xl space-y-3 shadow-sm hover:shadow-md transition-shadow">
                  {/* Category and Severity Banner */}
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase`} style={{
                      backgroundColor: result.analyzerMode === 'LOG_ANALYSIS' ? '#eef2ff' : '#f0f9ff',
                      color: result.analyzerMode === 'LOG_ANALYSIS' ? '#4f46e5' : '#0369a1',
                      border: `1px solid ${result.analyzerMode === 'LOG_ANALYSIS' ? '#e0e7ff' : '#e0f2fe'}`
                    }}>
                      {finding.type || 'Config'}
                    </span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase border`} style={{
                      backgroundColor: finding.severity?.toLowerCase() === 'critical' 
                        ? '#fef2f2' 
                        : finding.severity?.toLowerCase() === 'high' 
                          ? '#fffbeb' 
                          : finding.severity?.toLowerCase() === 'medium' 
                            ? '#fff7ed' 
                            : finding.severity?.toLowerCase() === 'low' 
                              ? '#eff6ff' 
                              : '#f0fdf4',
                      color: finding.severity?.toLowerCase() === 'critical' 
                        ? '#dc2626' 
                        : finding.severity?.toLowerCase() === 'high' 
                          ? '#d97706' 
                          : finding.severity?.toLowerCase() === 'medium' 
                            ? '#ea580c' 
                            : finding.severity?.toLowerCase() === 'low' 
                              ? '#2563eb' 
                              : '#0d9488',
                      borderColor: finding.severity?.toLowerCase() === 'critical' 
                        ? '#fee2e2' 
                        : finding.severity?.toLowerCase() === 'high' 
                          ? '#fef3c7' 
                          : finding.severity?.toLowerCase() === 'medium' 
                            ? '#ffedd5' 
                            : finding.severity?.toLowerCase() === 'low' 
                              ? '#dbeafe' 
                              : '#dcfce7'
                    }}>
                      {finding.severity}
                    </span>
                  </div>

                  {/* Issue */}
                  <h4 className="text-xs font-black text-slate-800">{finding.issue}</h4>

                  {/* Explanations */}
                  <div className="space-y-1.5 text-[11px] text-slate-600">
                    <p>
                      <span className="font-bold text-slate-800">Impact: </span>
                      {finding.impact}
                    </p>
                    <p>
                      <span className="font-bold text-slate-800">Explanation: </span>
                      {finding.explanation}
                    </p>
                    <p>
                      <span className="font-bold text-slate-800">Remediation: </span>
                      {finding.suggestedFix}
                    </p>
                  </div>

                  {/* Copyable CLI Command Panel */}
                  {finding.cliCommand && (
                    <div className="bg-slate-900 rounded-lg p-3 text-slate-100 font-mono text-[10px] relative mt-2 group/code">
                      <div className="flex justify-between items-center text-slate-400 mb-1 border-b border-slate-800 pb-1">
                        <span>REMEDIATION CLI</span>
                        <button
                          onClick={() => handleOpenCopy(finding.cliCommand, idx)}
                          className="text-slate-400 hover:text-white transition-colors"
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <pre className="whitespace-pre-wrap">{finding.cliCommand}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function handleOpenCopy(cmd: string, index: number) {
    handleCopyCommand(cmd, index);
  }
}
