import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import ConfigAnalyzer from './pages/ConfigAnalyzer';
import VlanRouting from './pages/VlanRouting';
import Interfaces from './pages/Interfaces';
import AclSecurity from './pages/AclSecurity';
import DhcpDns from './pages/DhcpDns';
import LogsIncidents from './pages/LogsIncidents';
import AiChat from './pages/AiChat';
import Topology from './pages/Topology';
import Analytics from './pages/Analytics';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Dashboard Paths */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="config-analyzer" element={<ConfigAnalyzer />} />
          <Route path="vlan-routing" element={<VlanRouting />} />
          <Route path="interfaces" element={<Interfaces />} />
          <Route path="security" element={<AclSecurity />} />
          <Route path="dhcp-dns" element={<DhcpDns />} />
          <Route path="logs-incidents" element={<LogsIncidents />} />
          <Route path="ai-chat" element={<AiChat />} />
          <Route path="topology" element={<Topology />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
        
        {/* Wildcard redirect to Dashboard */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
}
