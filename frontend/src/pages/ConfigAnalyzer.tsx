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
            {analyzing ? 'AI Configuration Parsing...' : 'Run Audit Analyzer'}
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
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DEVICE IDENTITY</p>
                <p className="text-sm font-black text-slate-800 mt-0.5">
                  {result.parsedData?.hostname || 'Generic Target Router'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ANOMALIES FOUND</p>
                <p className="text-sm font-black text-red-600 mt-0.5">{result.findings?.length || 0} issues</p>
              </div>
            </div>

            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
              {result.findings?.map((finding: any, idx: number) => (
                <div key={idx} className="p-4 border border-slate-200 rounded-xl space-y-3 shadow-sm hover:shadow-md transition-shadow">
                  {/* Category and Severity Banner */}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-primary bg-sky-50 px-2 py-0.5 rounded uppercase">
                      {finding.type || 'Config'}
                    </span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                      finding.severity === 'Critical' 
                        ? 'bg-red-50 text-red-600' 
                        : finding.severity === 'Warning' 
                          ? 'bg-orange-50 text-orange-600' 
                          : 'bg-blue-50 text-blue-600'
                    }`}>
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
