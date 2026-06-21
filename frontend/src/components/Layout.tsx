import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  LayoutDashboard, 
  Layers, 
  Cpu, 
  Network, 
  Route, 
  ToggleLeft, 
  ShieldCheck, 
  HelpCircle, 
  Terminal, 
  Settings, 
  Bell, 
  LogOut,
  User as UserIcon,
  Activity,
  History,
  Info,
  ChevronRight
} from 'lucide-react';
import axios from 'axios';

export default function Layout() {
  const { user, token, clearAuth, initAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadAlerts, setUnreadAlerts] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    } else {
      fetchUnreadAlerts();
    }
  }, [token]);

  const fetchUnreadAlerts = async () => {
    try {
      const res = await axios.get('/api/alerts?unreadOnly=true');
      setUnreadAlerts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      const refToken = localStorage.getItem('refreshToken');
      await axios.post('/api/auth/logout', { token: refToken });
    } catch (e) {
      console.error(e);
    }
    clearAuth();
    navigate('/login');
  };

  const markAllRead = async () => {
    try {
      await axios.post('/api/alerts/read-all');
      setUnreadAlerts([]);
    } catch (e) {
      console.error(e);
    }
  };

  if (!token || !user) return null;

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Inventory', path: '/inventory', icon: Layers },
    { name: 'Config Analyzer', path: '/config-analyzer', icon: Cpu },
    { name: 'VLANs & Routing', path: '/vlan-routing', icon: Route },
    { name: 'Interfaces', path: '/interfaces', icon: ToggleLeft },
    { name: 'ACLs & Security', path: '/security', icon: ShieldCheck },
    { name: 'DHCP / DNS', path: '/dhcp-dns', icon: HelpCircle },
    { name: 'Logs & Incidents', path: '/logs-incidents', icon: History },
    { name: 'AI Chat Assistant', path: '/ai-chat', icon: Terminal },
    { name: 'Topology Map', path: '/topology', icon: Network },
    { name: 'Predictive Analytics', path: '/analytics', icon: Activity }
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar Rail */}
      <aside className="w-64 flex flex-col bg-white border-r border-slate-200 shrink-0">
        <div className="p-6 border-b border-slate-100 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white shrink-0 shadow-sm">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-primary tracking-tight leading-none">NetMind AI</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Enterprise NOC</p>
          </div>
        </div>

        {/* Scrollable menu items */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-sky-50 text-primary font-bold border-r-4 border-primary shadow-sm'
                    : 'text-slate-600 hover:text-primary hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-primary'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-sky-100 border border-slate-200 flex items-center justify-center text-primary font-bold shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">{user.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-colors hover:bg-red-50"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main content viewport */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden relative">
        {/* Top Header Bar */}
        <header className="flex justify-between items-center px-8 py-4 w-full border-b border-slate-200 bg-white sticky top-0 z-40 shrink-0">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              {menuItems.find((m) => m.path === location.pathname)?.name || 'Operations Panel'}
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            {/* Notification system */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-full text-slate-500 hover:text-primary hover:bg-slate-100 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {unreadAlerts.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <span className="text-xs font-bold text-slate-700">Active Alerts ({unreadAlerts.length})</span>
                    {unreadAlerts.length > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[10px] text-primary font-bold hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {unreadAlerts.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">No active alerts. System healthy.</div>
                    ) : (
                      unreadAlerts.map((alert) => (
                        <div key={alert._id} className="p-3 hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-start">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                              alert.severity === 'Critical' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                            }`}>{alert.severity}</span>
                            <span className="text-[10px] text-slate-400">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-xs font-bold text-slate-800 mt-1">{alert.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{alert.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="w-px h-6 bg-slate-200"></div>

            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <span className="font-semibold">{user.name}</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">{user.role}</span>
            </div>
          </div>
        </header>

        {/* Viewport page mount */}
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
