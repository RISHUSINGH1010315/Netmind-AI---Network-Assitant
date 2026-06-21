import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  TrendingUp, 
  AlertTriangle, 
  Cpu, 
  HelpCircle, 
  Activity,
  ShieldAlert,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Legend
} from 'recharts';

export default function Analytics() {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/analytics/predict');
      setPredictions(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header info */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="text-xs">
          <p className="text-slate-500">Resource Saturation Forecasting</p>
          <p className="text-sm font-bold text-slate-800 mt-1">AI models estimate CPU/Memory resource exhaustion over the next 6 hours.</p>
        </div>
        <button
          onClick={fetchPredictions}
          className="p-2 border border-slate-200 text-slate-655 rounded-lg hover:bg-slate-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Running regression forecasts...</div>
      ) : (
        <div className="space-y-8">
          {/* Dashboard List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {predictions.map((p, idx) => {
              const hasAlert = p.riskLevel !== 'Low';
              
              // Formatting chart data
              const chartData = p.cpuForecast.map((f: any, index: number) => ({
                hour: f.hour,
                CPU: f.usage,
                Memory: p.memForecast[index]?.usage
              }));

              return (
                <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  {/* Title & Risk flag */}
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{p.deviceName}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Capacity prediction</p>
                    </div>
                    <span className={`text-[9px] font-black px-2.5 py-0.5 rounded uppercase ${
                      p.riskLevel === 'Critical' 
                        ? 'bg-red-50 text-red-600 animate-pulse' 
                        : p.riskLevel === 'Warning' 
                          ? 'bg-orange-50 text-orange-600' 
                          : 'bg-green-50 text-green-600'
                    }`}>
                      {p.riskLevel} Risk
                    </span>
                  </div>

                  {/* Recommendations */}
                  <div className={`p-3 rounded-lg text-xs flex items-start space-x-2 ${
                    p.riskLevel === 'Critical' 
                      ? 'bg-red-50 text-red-750' 
                      : p.riskLevel === 'Warning' 
                        ? 'bg-orange-50 text-orange-700' 
                        : 'bg-green-50 text-green-700'
                  }`}>
                    {hasAlert ? (
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p className="font-bold">{p.prediction}</p>
                      <p className="opacity-90 mt-0.5 leading-snug">{p.recommendation}</p>
                    </div>
                  </div>

                  {/* Recharts trend */}
                  <div className="h-48 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="hour" tick={{ fontSize: 9 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Line type="monotone" dataKey="CPU" name="CPU Usage (%)" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="Memory" name="Memory (GB)" stroke="#003d9b" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
