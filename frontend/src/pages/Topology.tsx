import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Network } from 'vis-network';
import { 
  Network as NetworkIcon, 
  Upload, 
  RefreshCw, 
  HelpCircle,
  Cpu,
  Info
} from 'lucide-react';

export default function Topology() {
  const [rawOutput, setRawOutput] = useState('');
  const [localDeviceName, setLocalDeviceName] = useState('Cisco-Core-01');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const networkInstanceRef = useRef<Network | null>(null);

  // Seed sample CDP output
  const sampleCdp = `Cisco-Core-01# show cdp neighbors
Capability Codes: R - Router, T - Trans Bridge, B - Source Route Bridge
                  S - Switch, H - Host, I - IGMP, r - Repeater, P - Phone, 
                  D - Remote Source Route Bridge, s - Subhost, M - Two-port Mac Relay

Device ID        Local Intrfce     Holdtme    Capability  Platform  Port ID
Juniper-Edge-04  Gig 1/0/1         125        R           MX204     Gig 0/0/1
Access-SW-02     Gig 1/0/2         172        S           C9300L    Gig 1/0/24
Nokia-Dist-12    Gig 1/0/3         130        R S         7750SR    Port-1/1
`;

  useEffect(() => {
    // Generate default/mock topology on first load
    handleAnalyze(sampleCdp);
  }, []);

  const handleAnalyze = async (textToAnalyze?: string) => {
    const inputContent = textToAnalyze !== undefined ? textToAnalyze : rawOutput;
    if (!inputContent.trim()) {
      setError('Please provide a valid CDP or LLDP command output.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Forward parsing to FastAPI backend (routed via Node proxy)
      const res = await axios.post('/api/topology/generate', {
        raw_output: inputContent,
        local_device_name: localDeviceName
      });

      const { nodes, edges } = res.data;
      renderNetwork(nodes, edges);

    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to parse neighbor topology.');
    } finally {
      setLoading(false);
    }
  };

  const renderNetwork = (nodes: any[], edges: any[]) => {
    if (!containerRef.current) return;

    // Destroy existing instance if active
    if (networkInstanceRef.current) {
      networkInstanceRef.current.destroy();
    }

    // Format vis-network nodes and edges
    const visNodes = nodes.map(n => {
      let color = '#d0e1fb'; // default
      if (n.type === 'Core Router' || n.type === 'Router') {
        color = '#b2c5ff';
      } else if (n.type === 'Access Point') {
        color = '#fed7aa';
      }
      return {
        id: n.id,
        label: `${n.label}\n(${n.type || 'Node'})`,
        shape: 'box',
        margin: { top: 10, right: 10, bottom: 10, left: 10 },
        color: {
          background: color,
          border: '#003d9b',
          highlight: {
            background: '# dae2ff',
            border: '#003d9b'
          }
        },
        font: {
          face: 'Inter',
          size: 11,
          bold: {
            color: '#111c2d',
            size: 11,
            vadjust: -1
          }
        }
      };
    });

    const visEdges = edges.map(e => ({
      from: e.from,
      to: e.to,
      label: e.label || '',
      font: { size: 9, align: 'top', color: '#64748b' },
      arrows: { to: { enabled: true, scaleFactor: 0.5 } },
      color: { color: '#cbd5e1', highlight: '#003d9b' }
    }));

    const data = {
      nodes: visNodes,
      edges: visEdges
    };

    const options = {
      physics: {
        stabilization: true,
        barnesHut: {
          gravitationalConstant: -2000,
          springLength: 150
        }
      },
      interaction: {
        hover: true,
        dragNodes: true
      }
    };

    networkInstanceRef.current = new Network(containerRef.current, data, options);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-180px)]">
      {/* Upload CDP block */}
      <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
        <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest shrink-0">Topology Discovery</h3>
          
          <div className="space-y-3 flex-grow overflow-y-auto pr-1">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Local Device Hostname</label>
              <input
                type="text"
                className="w-full p-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                value={localDeviceName}
                onChange={e => setLocalDeviceName(e.target.value)}
              />
            </div>

            <div className="flex-1 flex flex-col min-h-[250px]">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">CDP / LLDP Command Output</label>
              <textarea
                className="flex-grow w-full p-3 border border-slate-200 rounded-xl outline-none font-mono text-[10px] bg-slate-50 focus:bg-white resize-none"
                placeholder="Paste 'show cdp neighbors' output..."
                value={rawOutput}
                onChange={e => setRawOutput(e.target.value)}
              />
            </div>
          </div>
        </div>

        {error && <div className="p-2 bg-red-50 text-red-700 text-[10px] font-bold rounded mt-2">{error}</div>}

        <div className="mt-4 pt-4 border-t border-slate-100 flex space-x-2 shrink-0">
          <button
            onClick={() => {
              setRawOutput(sampleCdp);
              handleAnalyze(sampleCdp);
            }}
            className="flex-1 py-2 border border-slate-200 text-slate-655 text-xs font-bold rounded-lg hover:bg-slate-50"
          >
            Load Sample
          </button>
          <button
            onClick={() => handleAnalyze()}
            disabled={loading}
            className="flex-1 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-hover active:scale-95 transition-all"
          >
            {loading ? 'Analyzing...' : 'Discover Map'}
          </button>
        </div>
      </div>

      {/* Network Canvas */}
      <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden relative">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <NetworkIcon className="w-5 h-5 text-primary" />
            <div>
              <h4 className="text-xs font-bold text-slate-800">Dynamic Connection Map</h4>
              <p className="text-[9px] font-bold text-slate-400 uppercase">CDP / LLDP Relationship Matrix</p>
            </div>
          </div>
        </div>

        {/* Vis container */}
        <div ref={containerRef} className="flex-1 w-full bg-slate-50/50" style={{ height: '100%' }} />

        <div className="absolute bottom-4 left-4 bg-white/85 backdrop-blur-sm border border-slate-200 rounded-lg p-3 text-[10px] space-y-1.5 pointer-events-none max-w-xs shadow-sm">
          <p className="font-bold text-slate-850">Map Legend</p>
          <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 bg-blue-100 border border-primary rounded shrink-0"></span><span>Core Routers / Gateways</span></div>
          <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 bg-sky-100 border border-primary rounded shrink-0"></span><span>Access Switches</span></div>
          <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 bg-orange-100 border border-primary rounded shrink-0"></span><span>WiFi Access Points</span></div>
        </div>
      </div>
    </div>
  );
}
