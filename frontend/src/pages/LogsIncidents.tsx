import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { 
  History, 
  AlertOctagon, 
  User, 
  Clock, 
  CheckCircle, 
  HelpCircle,
  FileText,
  Plus,
  RefreshCw,
  Zap,
  X
} from 'lucide-react';

export default function LogsIncidents() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'logs' | 'incidents'>('logs');
  const [logs, setLogs] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [engineers, setEngineers] = useState<any[]>([]);
  
  // State loaders
  const [logsLoading, setLogsLoading] = useState(true);
  const [incidentsLoading, setIncidentsLoading] = useState(true);

  // Log Parsing state
  const [analyzingLogId, setAnalyzingLogId] = useState<string | null>(null);

  // Modals / forms
  const [showAddTicketModal, setShowAddTicketModal] = useState(false);
  const [showEditTicketModal, setShowEditTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  // Forms fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('Warning');
  const [deviceId, setDeviceId] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [status, setStatus] = useState('Open');
  const [rootCause, setRootCause] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [formError, setFormError] = useState('');

  const canEditTicket = user?.role === 'Super Admin' || user?.role === 'Network Engineer' || user?.role === 'NOC Engineer';

  useEffect(() => {
    fetchLogs();
    fetchIncidents();
    fetchHelperData();
  }, []);

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await axios.get('/api/logs');
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchIncidents = async () => {
    setIncidentsLoading(true);
    try {
      const res = await axios.get('/api/incidents');
      setIncidents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIncidentsLoading(false);
    }
  };

  const fetchHelperData = async () => {
    try {
      const devRes = await axios.get('/api/devices');
      setDevices(devRes.data);
      
      // Load mock/real operators for ticket assignees (we can filter for engineers/admins in a real system)
      // Since user profiles are created, let's load all or default to preseeded ones
      setEngineers([
        { id: 'admin', name: 'Alex Rivera (Super Admin)' },
        { id: 'engineer', name: 'Sarah Connor (Network Engineer)' },
        { id: 'noc', name: 'John Doe (NOC Engineer)' }
      ]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTranslateLog = async (logId: string) => {
    setAnalyzingLogId(logId);
    try {
      await axios.post(`/api/logs/analyze/${logId}`);
      fetchLogs(); // refresh listing to load description
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzingLogId(null);
    }
  };

  const handleOpenAddTicket = () => {
    setTitle('');
    setDescription('');
    setSeverity('Warning');
    setDeviceId('');
    setAssignedToId('');
    setFormError('');
    setShowAddTicketModal(true);
  };

  const handleAddTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      const payload = { title, description, severity, deviceId, assignedToId };
      await axios.post('/api/incidents', payload);
      setShowAddTicketModal(false);
      fetchIncidents();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to open ticket.');
    }
  };

  const handleOpenEditTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setTitle(ticket.title);
    setDescription(ticket.description);
    setSeverity(ticket.severity);
    setDeviceId(ticket.device?._id || '');
    setAssignedToId(ticket.assignedTo?._id || '');
    setStatus(ticket.status);
    setRootCause(ticket.rootCause || '');
    setResolutionNotes(ticket.resolutionNotes || '');
    setFormError('');
    setShowEditTicketModal(true);
  };

  const handleEditTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      const payload = { title, description, severity, status, assignedTo: assignedToId || null, rootCause, resolutionNotes };
      await axios.put(`/api/incidents/${selectedTicket._id}`, payload);
      setShowEditTicketModal(false);
      fetchIncidents();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to update ticket details.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center space-x-2 px-6 py-3 border-b-2 text-sm transition-all ${
            activeTab === 'logs' 
              ? 'border-primary text-primary font-bold' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Syslog Analyzer</span>
        </button>
        <button
          onClick={() => setActiveTab('incidents')}
          className={`flex items-center space-x-2 px-6 py-3 border-b-2 text-sm transition-all ${
            activeTab === 'incidents' 
              ? 'border-primary text-primary font-bold' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>Incident Tickets</span>
        </button>
      </div>

      {activeTab === 'logs' ? (
        // ==========================================
        // SYSLOG VIEW
        // ==========================================
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Device Syslog Stream</span>
            <button
              onClick={fetchLogs}
              className="p-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {logsLoading ? (
              <div className="p-8 text-center text-slate-400">Loading syslogs...</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">No syslog messages logged.</div>
                ) : (
                  logs.map((log) => (
                    <div key={log._id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col space-y-2">
                      <div className="flex flex-wrap justify-between items-center text-xs">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${
                            log.severity === 'Critical' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                          }`}>{log.severity}</span>
                          <span className="text-slate-400 font-bold">{new Date(log.timestamp).toLocaleString()}</span>
                          <span className="font-semibold text-primary">{log.device?.name || 'Local Host'}</span>
                        </div>
                        {(!log.parsedExplanation || log.parsedExplanation.includes('Pending')) && (
                          <button
                            onClick={() => handleTranslateLog(log._id)}
                            disabled={analyzingLogId === log._id}
                            className="flex items-center space-x-1 px-2.5 py-1 bg-sky-50 text-primary font-bold rounded hover:bg-sky-100 disabled:opacity-50 text-[10px]"
                          >
                            <Zap className="w-3 h-3 text-primary fill-primary" />
                            <span>{analyzingLogId === log._id ? 'AI Parsing...' : 'Translate Log'}</span>
                          </button>
                        )}
                      </div>

                      {/* Raw Content */}
                      <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-[10px] overflow-x-auto whitespace-pre-wrap">
                        {log.rawContent}
                      </pre>

                      {/* AI Translation */}
                      {log.parsedExplanation && !log.parsedExplanation.includes('Pending') && (
                        <div className="p-3 bg-sky-50/50 border border-sky-100/50 rounded-lg text-xs flex items-start space-x-2">
                          <Zap className="w-4 h-4 text-primary fill-primary mt-0.5 shrink-0" />
                          <div>
                            <p className="font-bold text-primary">AI Translation & Cause Summary:</p>
                            <p className="text-slate-650 mt-1 leading-relaxed">{log.parsedExplanation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        // ==========================================
        // INCIDENTS TICKETS VIEW
        // ==========================================
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Troubleshooting Tickets</span>
            {canEditTicket && (
              <button
                onClick={handleOpenAddTicket}
                className="flex items-center space-x-1 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-hover active:scale-95 transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Open Ticket</span>
              </button>
            )}
          </div>

          {incidentsLoading ? (
            <div className="text-center py-8 text-slate-400">Loading tickets list...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {incidents.length === 0 ? (
                <div className="col-span-2 p-8 text-center text-slate-400 bg-white border border-slate-200 rounded-xl">
                  No operational incidents or open troubleshooting tickets.
                </div>
              ) : (
                incidents.map((inc) => (
                  <div
                    key={inc._id}
                    onClick={() => canEditTicket && handleOpenEditTicket(inc)}
                    className={`bg-white border rounded-xl p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow relative ${
                      canEditTicket ? 'cursor-pointer hover:border-primary/40' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${
                        inc.severity === 'Critical' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                      }`}>{inc.severity}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        inc.status === 'Resolved' ? 'bg-green-50 text-green-700' : 'bg-sky-50 text-sky-700'
                      }`}>{inc.status}</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-800 truncate">{inc.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{inc.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-[10px] text-slate-400 font-bold uppercase">
                      <div>
                        <span>DEVICE</span>
                        <p className="text-primary mt-0.5 font-bold">{inc.device?.name || 'Network Core'}</p>
                      </div>
                      <div>
                        <span>ASSIGNEE</span>
                        <p className="text-slate-700 mt-0.5 font-bold">{inc.assignedTo?.name || 'Unassigned'}</p>
                      </div>
                    </div>

                    {inc.rootCause && (
                      <div className="p-3 bg-slate-50 rounded-lg text-xs">
                        <p className="font-bold text-slate-700">Root Cause:</p>
                        <p className="text-slate-500 mt-0.5">{inc.rootCause}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Ticket Modal */}
      {showAddTicketModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-800">Open Incident Ticket</h3>
              <button onClick={() => setShowAddTicketModal(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-650"><X className="w-4 h-4" /></button>
            </div>

            {formError && <div className="p-2 bg-red-50 text-red-700 text-xs font-bold rounded">{formError}</div>}

            <form onSubmit={handleAddTicketSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ticket Title</label>
                <input type="text" required className="w-full p-2 border border-slate-200 rounded outline-none" placeholder="OSPF neighbor down on Core-R1" value={title} onChange={e => setTitle(e.target.value)} />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Diagnostics</label>
                <textarea required className="w-full h-24 p-2 border border-slate-200 rounded outline-none resize-none" placeholder="Details of interface or packet drops observed" value={description} onChange={e => setDescription(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Severity</label>
                  <select className="w-full p-2 border border-slate-200 rounded outline-none" value={severity} onChange={e => setSeverity(e.target.value)}>
                    <option value="Critical">Critical</option>
                    <option value="Warning">Warning</option>
                    <option value="Info">Info</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Device</label>
                  <select className="w-full p-2 border border-slate-200 rounded outline-none" value={deviceId} onChange={e => setDeviceId(e.target.value)}>
                    <option value="">Global Core Network</option>
                    {devices.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assign Operator</label>
                <select className="w-full p-2 border border-slate-200 rounded outline-none" value={assignedToId} onChange={e => setAssignedToId(e.target.value)}>
                  <option value="">Leave Unassigned</option>
                  {engineers.map(eng => <option key={eng.id} value={eng.id}>{eng.name}</option>)}
                </select>
              </div>

              <button type="submit" className="w-full py-2.5 bg-primary text-white font-bold rounded hover:bg-primary-hover shadow transition-all">
                Open Ticket Log
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Ticket Modal */}
      {showEditTicketModal && selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-800">Escalate / Resolve Ticket</h3>
              <button onClick={() => setShowEditTicketModal(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-650"><X className="w-4 h-4" /></button>
            </div>

            {formError && <div className="p-2 bg-red-50 text-red-700 text-xs font-bold rounded">{formError}</div>}

            <form onSubmit={handleEditTicketSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ticket Title</label>
                <input type="text" required className="w-full p-2 border border-slate-200 rounded outline-none" value={title} onChange={e => setTitle(e.target.value)} />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea required className="w-full h-20 p-2 border border-slate-200 rounded outline-none resize-none" value={description} onChange={e => setDescription(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ticket Status</label>
                  <select className="w-full p-2 border border-slate-200 rounded outline-none font-bold" value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Operator Assignment</label>
                  <select className="w-full p-2 border border-slate-200 rounded outline-none font-bold" value={assignedToId} onChange={e => setAssignedToId(e.target.value)}>
                    <option value="">Leave Unassigned</option>
                    {engineers.map(eng => <option key={eng.id} value={eng.id}>{eng.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 font-bold">Identified Root Cause (AI / Manual Audit)</label>
                <input type="text" className="w-full p-2 border border-slate-200 rounded outline-none" placeholder="e.g. MTU setting mismatch on core trunk" value={rootCause} onChange={e => setRootCause(e.target.value)} />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 font-bold">Resolution Notes</label>
                <textarea className="w-full h-16 p-2 border border-slate-200 rounded outline-none resize-none" placeholder="e.g. Adjusted trunk MTU to 1500, adjacency restored." value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)} />
              </div>

              <button type="submit" className="w-full py-2.5 bg-primary text-white font-bold rounded hover:bg-primary-hover shadow transition-all">
                Update Ticket Details
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
