import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Server, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Zap, 
  ShieldAlert, 
  TrendingUp, 
  ExternalLink 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/analytics/dashboard');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Availability trend chart mock data (24h)
  const availabilityData = [
    { time: '00:00', value: 99.2 },
    { time: '04:00', value: 99.4 },
    { time: '08:00', value: 99.1 },
    { time: '12:00', value: 99.8 },
    { time: '16:00', value: 98.6 },
    { time: '20:00', value: 99.9 },
    { time: 'Now', value: stats.healthScore }
  ];

  // Pie chart representations for status
  const pieData = [
    { name: 'Online', value: stats.onlineDevices, color: '#22c55e' },
    { name: 'Offline', value: stats.offlineDevices, color: '#ef4444' }
  ];

  return (
    <div className="space-y-8">
      {/* Overview stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="p-2 rounded-lg bg-sky-50 text-primary"><Server className="w-5 h-5" /></span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TOTAL</span>
          </div>
          <div className="mt-4">
            <h4 className="text-3xl font-black text-slate-800">{stats.totalDevices}</h4>
            <p className="text-xs text-slate-400 mt-1">Network Assets</p>
          </div>
        </div>

        {/* Online */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="p-2 rounded-lg bg-green-50 text-green-600"><CheckCircle2 className="w-5 h-5" /></span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ONLINE</span>
          </div>
          <div className="mt-4">
            <h4 className="text-3xl font-black text-green-600">{stats.onlineDevices}</h4>
            <p className="text-xs text-slate-400 mt-1">Active nodes</p>
          </div>
        </div>

        {/* Offline */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="p-2 rounded-lg bg-red-50 text-red-600"><XCircle className="w-5 h-5" /></span>
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">OFFLINE</span>
          </div>
          <div className="mt-4">
            <h4 className="text-3xl font-black text-red-600">{stats.offlineDevices}</h4>
            <p className="text-xs text-red-500 font-bold mt-1">Attention Required</p>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="p-2 rounded-lg bg-orange-50 text-orange-600"><AlertCircle className="w-5 h-5" /></span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ALERTS</span>
          </div>
          <div className="mt-4">
            <h4 className="text-3xl font-black text-slate-800">{stats.totalAlerts}</h4>
            <p className="text-xs text-slate-400 mt-1">{stats.warningAlerts} Warning status</p>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-red-500 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="p-2 rounded-lg bg-red-50 text-red-600"><ShieldAlert className="w-5 h-5" /></span>
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">CRITICAL</span>
          </div>
          <div className="mt-4">
            <h4 className="text-3xl font-black text-red-600">{stats.criticalAlerts}</h4>
            <p className="text-xs text-red-600 font-bold mt-1">Immediate Action</p>
          </div>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Network Health pie */}
        <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center relative">
          <h3 className="text-sm font-bold text-slate-800 self-start mb-4">Core Network State</h3>
          <div className="relative w-full h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-black text-slate-800">{stats.healthScore}%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">HEALTH SCORE</span>
            </div>
          </div>
          <div className="w-full mt-4 flex justify-around text-xs text-slate-500 border-t border-slate-100 pt-4">
            <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2"></span>Online ({stats.onlineDevices})</div>
            <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2"></span>Offline ({stats.offlineDevices})</div>
          </div>
        </div>

        {/* Security Integrity Gauge */}
        <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-bold text-slate-800">Security Integrity</h3>
            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-700">{stats.securityScore} / 100</span>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-red-50 border-l-4 border-l-red-500 rounded-r-lg text-xs">
              <p className="font-bold text-slate-800">Insecure Telnet Sessions</p>
              <p className="text-slate-500 mt-0.5">Core switches allow cleartext admin logins.</p>
            </div>
            <div className="p-3 bg-orange-50 border-l-4 border-l-orange-500 rounded-r-lg text-xs">
              <p className="font-bold text-slate-800">Plaintext Enable Passwords</p>
              <p className="text-slate-500 mt-0.5">Weak configuration ciphers found in Cisco routers.</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">Security audits scan configs for Telnet, SNMP v1/v2, & weak secrets.</p>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="lg:col-span-4 bg-primary text-white p-6 rounded-xl shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="w-5 h-5 text-sky-300 fill-sky-300" />
              <h3 className="font-bold text-base">AI Operations Insights</h3>
            </div>

            <div className="space-y-4">
              {stats.recommendations && stats.recommendations.length > 0 ? (
                stats.recommendations.map((rec: any, idx: number) => (
                  <div key={idx} className="flex items-start space-x-3 text-xs leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-300 mt-1.5 shrink-0"></span>
                    <p className="text-sky-100">
                      <span className="font-bold text-white underline decoration-sky-300 decoration-2">{rec.type} Alert:</span> {rec.message}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-sky-200">No anomalies found. Operations running under baseline targets.</p>
              )}
            </div>
          </div>

          <div className="relative z-10 mt-6 pt-4 border-t border-sky-600/30">
            <p className="text-[10px] text-sky-300 uppercase tracking-widest font-bold">RAG Engine status: active</p>
          </div>
        </div>
      </div>

      {/* Incidents Table & Availability chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Incidents */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800">Recent Operational Incidents</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="px-6 py-3">Severity</th>
                  <th className="px-6 py-3">Incident</th>
                  <th className="px-6 py-3">Assigned Device</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {stats.recentIncidents && stats.recentIncidents.length > 0 ? (
                  stats.recentIncidents.map((inc: any) => (
                    <tr key={inc._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          inc.severity === 'Critical' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                        }`}>{inc.severity}</span>
                      </td>
                      <td className="px-6 py-4 font-bold">{inc.title}</td>
                      <td className="px-6 py-4 text-primary font-semibold">{inc.device?.name || 'Network Core'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inc.status === 'Resolved' ? 'bg-green-50 text-green-700' : 'bg-sky-50 text-sky-700'
                        }`}>{inc.status}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{new Date(inc.createdAt).toLocaleTimeString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-slate-400">No active incidents logged.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Availability Line Graph */}
        <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Global Service Availability</h3>
            <p className="text-xs text-green-600 font-bold flex items-center mt-1">
              <TrendingUp className="w-3.5 h-3.5 mr-1" /> +0.4% SLA target achievement
            </p>
          </div>

          <div className="h-32 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={availabilityData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                <defs>
                  <linearGradient id="availGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#003d9b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#003d9b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fontSize: 9 }} />
                <YAxis domain={[95, 100]} tick={{ fontSize: 9 }} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#003d9b" strokeWidth={2} fillOpacity={1} fill="url(#availGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-4 mt-2">
            <div>
              <p className="text-slate-400">SLA baseline</p>
              <p className="font-bold text-slate-800">99.90%</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400">Current average</p>
              <p className="font-bold text-green-600">99.94%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
