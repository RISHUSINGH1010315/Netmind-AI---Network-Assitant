import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  ToggleLeft, 
  AlertCircle, 
  CheckCircle,
  HelpCircle,
  Activity,
  ArrowDownCircle,
  Cpu
} from 'lucide-react';

export default function Interfaces() {
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Simulated interface details
  const [interfaces, setInterfaces] = useState<any[]>([]);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await axios.get('/api/devices');
      setDevices(res.data);
      if (res.data.length > 0) {
        handleSelectDevice(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDevice = (dev: any) => {
    setSelectedDevice(dev);
    // Generate simulated interface listing for the device
    const interfacesList = [
      { name: 'GigabitEthernet1/0/1', desc: 'Transit Link to Core-R2', status: 'Up', speed: '1000Mbps', duplex: 'Full', crcErrors: 0, drops: 0, rxRate: 42, txRate: 65 },
      { name: 'GigabitEthernet1/0/2', desc: 'Access Switch Link', status: 'Up', speed: '1000Mbps', duplex: 'Full', crcErrors: 124, drops: 12, rxRate: 15, txRate: 8 },
      { name: 'GigabitEthernet1/0/3', desc: 'Server Rack 2 Link', status: 'Up', speed: '100Mbps', duplex: 'Half', crcErrors: 14502, drops: 844, rxRate: 85, txRate: 74 },
      { name: 'GigabitEthernet1/0/4', desc: 'Spare Access Port', status: 'Shutdown', speed: 'Auto', duplex: 'Auto', crcErrors: 0, drops: 0, rxRate: 0, txRate: 0 }
    ];

    if (dev.status === 'Offline') {
      interfacesList.forEach(i => {
        i.status = 'Down';
        i.rxRate = 0;
        i.txRate = 0;
      });
    }

    setInterfaces(interfacesList);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Device Selector */}
      <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
          <Activity className="w-4 h-4 text-primary" />
          <span>Select Target Node</span>
        </h3>

        {loading ? (
          <p className="text-xs text-slate-400">Loading nodes...</p>
        ) : (
          <div className="space-y-2">
            {devices.map((d) => (
              <button
                key={d._id}
                onClick={() => handleSelectDevice(d)}
                className={`w-full text-left p-3 rounded-lg border text-xs flex justify-between items-center transition-all ${
                  selectedDevice?._id === d._id 
                    ? 'border-primary bg-sky-50/50 font-bold text-primary shadow-sm' 
                    : 'border-slate-150 hover:bg-slate-50'
                }`}
              >
                <div>
                  <p>{d.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{d.ipAddress}</p>
                </div>
                <span className={`w-2 h-2 rounded-full ${d.status === 'Online' ? 'bg-green-500' : 'bg-red-500'}`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Interfaces Details */}
      <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
            <ToggleLeft className="w-5 h-5 text-primary" />
            <span>Port Line Status Analyzer</span>
          </h3>
          {selectedDevice && (
            <span className="text-xs text-slate-500 font-bold">Node: {selectedDevice.name}</span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <th className="px-4 py-2">Port</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Config (Speed/Duplex)</th>
                <th className="px-4 py-2 text-right">CRC Errors</th>
                <th className="px-4 py-2 text-right">Packets Dropped</th>
                <th className="px-4 py-2 text-right">Usage (Rx/Tx)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {interfaces.map((face, index) => {
                const hasDuplexAnomaly = face.duplex === 'Half';
                const hasCrcAnomaly = face.crcErrors > 100;
                
                return (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{face.name}</span>
                        <span className="text-[10px] text-slate-400 truncate max-w-xs">{face.desc}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        face.status === 'Up' 
                          ? 'bg-green-50 text-green-700' 
                          : face.status === 'Shutdown' 
                            ? 'bg-slate-100 text-slate-650' 
                            : 'bg-red-50 text-red-700'
                      }`}>{face.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1.5">
                        <span>{face.speed} / {face.duplex}</span>
                        {hasDuplexAnomaly && (
                          <span className="p-0.5 bg-orange-50 text-orange-500 rounded" title="Duplex Mismatch Threat! Half duplex locks bandwidth capability.">
                            <AlertCircle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-right font-mono font-bold ${hasCrcAnomaly ? 'text-red-600' : ''}`}>
                      {face.crcErrors.toLocaleString()}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono font-bold ${face.drops > 0 ? 'text-orange-600' : ''}`}>
                      {face.drops.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col text-[10px]">
                        <span>Rx: {face.rxRate}%</span>
                        <span>Tx: {face.txRate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Diagnostic recommendations */}
        <div className="bg-slate-50 p-4 rounded-xl space-y-3">
          <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
            <Cpu className="w-4 h-4 text-primary" />
            <span>AI Interface Recommendations</span>
          </h4>
          <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
            {interfaces.some(i => i.duplex === 'Half') && (
              <p className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                <span>
                  **Duplex Mismatch:** GigabitEthernet1/0/3 is configured in **Half Duplex** mode. This causes packet collision loops on full-duplex endpoints. Configure it to auto-negotiate.
                </span>
              </p>
            )}
            {interfaces.some(i => i.crcErrors > 100) && (
              <p className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <span>
                  **CRC Packet Errors:** Elevated CRC error counts on GigabitEthernet1/0/3 and GigabitEthernet1/0/2 suggest physical layer degradation. Check fiber transceivers, cable bends, or patch cords.
                </span>
              </p>
            )}
            {!interfaces.some(i => i.duplex === 'Half' || i.crcErrors > 100) && (
              <p className="flex items-start space-x-2 text-green-600 font-semibold">
                <CheckCircle className="w-4 h-4 mr-1 shrink-0" />
                <span>All network interfaces are operating with 0 CRC error loops and symmetric full-duplex setups.</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
