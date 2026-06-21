import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Shield, CheckCircle } from 'lucide-react';
import axios from 'axios';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Viewer');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/auth/register', { name, email, password, role });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Check profile input details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white mb-3 shadow-md">
            <Activity className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-primary tracking-tight">Request Account</h2>
          <p className="text-slate-500 text-sm mt-1">Submit operator access credentials</p>
        </div>

        {success ? (
          <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-sm font-semibold rounded-lg text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto" />
            <p>Registration request logged successfully!</p>
            <p className="text-xs text-slate-500">Redirecting to console login portal...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-lg">{error}</div>}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="Alex Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="operator@netmind.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Operational Role</label>
              <select
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Viewer">Viewer (Read-only)</option>
                <option value="NOC Engineer">NOC Engineer (Tickets/Logs)</option>
                <option value="Security Analyst">Security Analyst (ACL/Audit)</option>
                <option value="Network Engineer">Network Engineer (Inventory/Configs)</option>
                <option value="Super Admin">Super Admin (Full Access)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-hover shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Submitting Registration...' : 'Register Operator'}
            </button>
          </form>
        )}

        <div className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="text-primary font-bold hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
