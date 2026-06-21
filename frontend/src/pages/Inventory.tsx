import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  X, 
  Terminal, 
  Cpu, 
  Layers, 
  Activity, 
  TrendingDown, 
  Info,
  SlidersHorizontal
} from 'lucide-react';

export default function Inventory() {
  const { user } = useAuthStore();
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');

  // Selected device for slide-over panel
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [showSlideOver, setShowSlideOver] = useState(false);

  // CRUD Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [targetDevice, setTargetDevice] = useState<any>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [vendor, setVendor] = useState('Cisco');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [location, setLocation] = useState('');
  const [firmware, setFirmware] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [formError, setFormError] = useState('');

  const canEdit = user?.role === 'Super Admin' || user?.role === 'Network Engineer';
  const canDelete = user?.role === 'Super Admin';

  useEffect(() => {
    fetchDevices();
  }, [search, statusFilter, vendorFilter]);

  const fetchDevices = async () => {
    try {
      const res = await axios.get(`/api/devices?search=${search}&status=${statusFilter}&vendor=${vendorFilter}`);
      setDevices(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSlideOver = (dev: any) => {
    setSelectedDevice(dev);
    setShowSlideOver(true);
  };

  const handleOpenAddModal = () => {
    setName('');
    setVendor('Cisco');
    setModel('');
    setSerialNumber('');
    setIpAddress('');
    setLocation('');
    setFirmware('');
    setMacAddress('');
    setFormError('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (dev: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid opening the slide-over
    setTargetDevice(dev);
    setName(dev.name);
    setVendor(dev.vendor);
    setModel(dev.model);
    setSerialNumber(dev.serialNumber);
    setIpAddress(dev.ipAddress);
    setLocation(dev.location);
    setFirmware(dev.firmware);
    setMacAddress(dev.macAddress);
    setFormError('');
    setShowEditModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      const payload = { name, vendor, model, serialNumber, ipAddress, location, firmware, macAddress };
      await axios.post('/api/devices', payload);
      setShowAddModal(false);
      fetchDevices();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to register network node.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      const payload = { name, vendor, model, serialNumber, ipAddress, location, firmware, macAddress };
      await axios.put(`/api/devices/${targetDevice._id}`, payload);
      setShowEditModal(false);
      fetchDevices();
      // If editing currently selected details, update panel details too
      if (selectedDevice?._id === targetDevice._id) {
        setSelectedDevice({ ...selectedDevice, ...payload });
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to update network node.');
    }
  };

  const handleDelete = async (deviceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Confirm deletion of this network node from system logs?')) return;
    try {
      await axios.delete(`/api/devices/${deviceId}`);
      if (selectedDevice?._id === deviceId) {
        setShowSlideOver(false);
      }
      fetchDevices();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Action Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-white rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            placeholder="Search IP, Name, or Serial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex items-center space-x-3">
          <select
            className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-600 focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Status: All</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
          </select>

          <select
            className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-600 focus:outline-none"
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
          >
            <option value="">Vendor: All</option>
            <option value="Cisco">Cisco</option>
            <option value="Juniper">Juniper</option>
            <option value="Nokia">Nokia</option>
          </select>

          {canEdit && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center space-x-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-hover shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Device</span>
            </button>
          )}
        </div>
      </div>

      {/* Main List Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading devices list...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="px-6 py-3 text-center w-12">Status</th>
                  <th className="px-6 py-3">Device Name</th>
                  <th className="px-6 py-3">Vendor</th>
                  <th className="px-6 py-3">Model</th>
                  <th className="px-6 py-3">IP Address</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Firmware</th>
                  {canEdit && <th className="px-6 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {devices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">No matching network nodes found.</td>
                  </tr>
                ) : (
                  devices.map((dev) => (
                    <tr
                      key={dev._id}
                      onClick={() => handleOpenSlideOver(dev)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors group"
                    >
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                          dev.status === 'Online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                        }`}></span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-primary group-hover:underline">{dev.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5">SN: {dev.serialNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold">{dev.vendor}</td>
                      <td className="px-6 py-4">{dev.model}</td>
                      <td className="px-6 py-4 font-mono text-slate-600">{dev.ipAddress}</td>
                      <td className="px-6 py-4 text-slate-500">{dev.location}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600">{dev.firmware}</span>
                      </td>
                      {canEdit && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={(e) => handleOpenEditModal(dev, e)}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-primary transition-colors"
                              title="Edit parameters"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {canDelete && (
                              <button
                                onClick={(e) => handleDelete(dev._id, e)}
                                className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                                title="Delete node"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over Device details panel */}
      {showSlideOver && selectedDevice && (
        <div className="fixed inset-0 overflow-hidden z-50">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setShowSlideOver(false)} />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-[450px] bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full transform transition-all duration-300">
              {/* Header */}
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-lg font-black text-primary leading-tight">{selectedDevice.name}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`w-2 h-2 rounded-full ${selectedDevice.status === 'Online' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-xs text-slate-500 font-bold">Status: {selectedDevice.status}</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowSlideOver(false)}
                  className="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Simulated live telemetry metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">CPU LOAD</p>
                    <div className="flex items-end justify-between">
                      <span className="text-2xl font-black text-slate-800">{selectedDevice.cpuUsage || 0}%</span>
                      {selectedDevice.status === 'Online' && (
                        <span className="text-green-600 text-xs font-bold flex items-center space-x-0.5">
                          <TrendingDown className="w-3.5 h-3.5" />
                          <span>-2%</span>
                        </span>
                      )}
                    </div>
                    <div className="mt-3 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${selectedDevice.cpuUsage || 0}%` }}></div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">MEMORY UTIL</p>
                    <div className="flex items-end justify-between">
                      <span className="text-2xl font-black text-slate-800">
                        {selectedDevice.memoryUsage || 0}
                        <small className="text-xs text-slate-400 ml-0.5">GB</small>
                      </span>
                      <span className="text-xs text-slate-400">of {selectedDevice.memoryTotal || 16}GB</span>
                    </div>
                    <div className="mt-3 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${((selectedDevice.memoryUsage || 0) / (selectedDevice.memoryTotal || 16)) * 100}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Connectivity statistics */}
                <div className="p-4 border border-slate-200 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Connectivity Stats</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-black text-slate-800">{selectedDevice.status === 'Online' ? `${selectedDevice.uptime || 0} days` : '0 days'}</span>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Uptime</p>
                    </div>
                    <div className="w-px h-10 bg-slate-200 mx-4"></div>
                    <div className="flex-1">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                        <span>Packet Loss</span>
                        <span>{selectedDevice.packetLoss || 0}%</span>
                      </div>
                      <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${100 - (selectedDevice.packetLoss || 0)}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Specs */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hardware Specifications</p>
                  <div className="divide-y divide-slate-100">
                    <div className="flex justify-between py-2 text-xs">
                      <span className="text-slate-500">IP Address</span>
                      <span className="font-mono text-slate-800 font-bold">{selectedDevice.ipAddress}</span>
                    </div>
                    <div className="flex justify-between py-2 text-xs">
                      <span className="text-slate-500">MAC Address</span>
                      <span className="font-mono text-slate-800 font-bold">{selectedDevice.macAddress}</span>
                    </div>
                    <div className="flex justify-between py-2 text-xs">
                      <span className="text-slate-500">Vendor / Model</span>
                      <span className="text-slate-800 font-bold">{selectedDevice.vendor} {selectedDevice.model}</span>
                    </div>
                    <div className="flex justify-between py-2 text-xs">
                      <span className="text-slate-500">OS Version</span>
                      <span className="text-slate-800 font-bold">{selectedDevice.firmware}</span>
                    </div>
                    <div className="flex justify-between py-2 text-xs">
                      <span className="text-slate-500">Physical Location</span>
                      <span className="text-slate-800 font-bold">{selectedDevice.location}</span>
                    </div>
                  </div>
                </div>

                {/* AI recommendation preview */}
                <div className="p-4 bg-sky-50 border border-sky-100 rounded-xl relative overflow-hidden flex items-start space-x-3">
                  <div className="p-1.5 bg-primary text-white rounded-lg mt-0.5 shrink-0">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-primary">AI Device Diagnostic</h5>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {selectedDevice.status === 'Online' 
                        ? 'CPU utilization is within stable baselines. Monitor traffic rates on the core trunks regularly.' 
                        : 'Node is unreachable. AI detects link outage or local power failure. Escalating incident ticket.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-800">Add Network Node</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            {formError && <div className="p-2 bg-red-50 text-red-700 text-xs font-bold rounded">{formError}</div>}

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Device Name</label>
                  <input type="text" required className="w-full p-2 border border-slate-200 rounded outline-none" placeholder="Router-Core-1" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Vendor</label>
                  <select className="w-full p-2 border border-slate-200 rounded outline-none" value={vendor} onChange={e => setVendor(e.target.value)}>
                    <option value="Cisco">Cisco</option>
                    <option value="Juniper">Juniper</option>
                    <option value="Nokia">Nokia</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Model</label>
                  <input type="text" required className="w-full p-2 border border-slate-200 rounded outline-none" placeholder="Catalyst 9300" value={model} onChange={e => setModel(e.target.value)} />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Serial Number</label>
                  <input type="text" required className="w-full p-2 border border-slate-200 rounded outline-none" placeholder="SN12345" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">IP Address</label>
                  <input type="text" required className="w-full p-2 border border-slate-200 rounded outline-none" placeholder="10.100.1.1" value={ipAddress} onChange={e => setIpAddress(e.target.value)} />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">MAC Address</label>
                  <input type="text" required className="w-full p-2 border border-slate-200 rounded outline-none" placeholder="00:1A:2B:3C:4D:5E" value={macAddress} onChange={e => setMacAddress(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Firmware Version</label>
                  <input type="text" required className="w-full p-2 border border-slate-200 rounded outline-none" placeholder="17.06.01" value={firmware} onChange={e => setFirmware(e.target.value)} />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Physical Location</label>
                  <input type="text" required className="w-full p-2 border border-slate-200 rounded outline-none" placeholder="DC-Rack-4" value={location} onChange={e => setLocation(e.target.value)} />
                </div>
              </div>

              <button type="submit" className="w-full py-2.5 bg-primary text-white font-bold rounded hover:bg-primary-hover shadow transition-all">
                Save Device
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-800">Edit Network Node</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            {formError && <div className="p-2 bg-red-50 text-red-700 text-xs font-bold rounded">{formError}</div>}

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Device Name</label>
                  <input type="text" required className="w-full p-2 border border-slate-200 rounded outline-none" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Vendor</label>
                  <select className="w-full p-2 border border-slate-200 rounded outline-none" value={vendor} onChange={e => setVendor(e.target.value)}>
                    <option value="Cisco">Cisco</option>
                    <option value="Juniper">Juniper</option>
                    <option value="Nokia">Nokia</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Model</label>
                  <input type="text" required className="w-full p-2 border border-slate-200 rounded outline-none" value={model} onChange={e => setModel(e.target.value)} />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Serial Number</label>
                  <input type="text" required className="w-full p-2 border border-slate-200 rounded outline-none" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">IP Address</label>
                  <input type="text" required className="w-full p-2 border border-slate-200 rounded outline-none" value={ipAddress} onChange={e => setIpAddress(e.target.value)} />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">MAC Address</label>
                  <input type="text" required className="w-full p-2 border border-slate-200 rounded outline-none" value={macAddress} onChange={e => setMacAddress(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Firmware Version</label>
                  <input type="text" required className="w-full p-2 border border-slate-200 rounded outline-none" value={firmware} onChange={e => setFirmware(e.target.value)} />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Physical Location</label>
                  <input type="text" required className="w-full p-2 border border-slate-200 rounded outline-none" value={location} onChange={e => setLocation(e.target.value)} />
                </div>
              </div>

              <button type="submit" className="w-full py-2.5 bg-primary text-white font-bold rounded hover:bg-primary-hover shadow transition-all">
                Update Device
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
