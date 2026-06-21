import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { 
  Terminal, 
  Send, 
  Plus, 
  Paperclip, 
  HelpCircle,
  MessageSquare,
  Bot,
  Zap,
  Info,
  ChevronRight,
  User
} from 'lucide-react';

export default function AiChat() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  
  // Configurations to link
  const [configs, setConfigs] = useState<any[]>([]);
  const [selectedConfigIds, setSelectedConfigIds] = useState<string[]>([]);
  
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sending, setSending] = useState(false);
  
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSessions();
    fetchConfigs();
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      fetchSessionDetails(selectedSessionId);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSessions = async () => {
    try {
      const res = await axios.get('/api/chat/sessions');
      setSessions(res.data);
      if (res.data.length > 0 && !selectedSessionId) {
        setSelectedSessionId(res.data[0]._id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchConfigs = async () => {
    try {
      const res = await axios.get('/api/config');
      setConfigs(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSessionDetails = async (id: string) => {
    setLoadingHistory(true);
    try {
      const res = await axios.get(`/api/chat/sessions/${id}`);
      setMessages(res.data.messages);
      setSelectedConfigIds(res.data.contextFiles?.map((c: any) => c._id) || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      const res = await axios.post('/api/chat/sessions', {
        title: `Debug Session - ${new Date().toLocaleTimeString()}`,
        contextFileIds: selectedConfigIds
      });
      setSessions([res.data, ...sessions]);
      setSelectedSessionId(res.data._id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || sending) return;

    const userMsg = messageText;
    setMessageText('');
    setSending(true);

    // Append message locally first for instant UI response
    setMessages(prev => [...prev, { sender: 'user', content: userMsg, timestamp: new Date() }]);

    try {
      const res = await axios.post(`/api/chat/sessions/${selectedSessionId}/message`, {
        message: userMsg
      });
      // Update full message history
      setMessages(res.data.messages);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        content: '### Service Outage\nFailed to establish link with RAG parser. Please confirm the python AI service is running at `http://localhost:8000`.', 
        timestamp: new Date() 
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleToggleConfigContext = async (configId: string) => {
    const isSelected = selectedConfigIds.includes(configId);
    let updated: string[];
    if (isSelected) {
      updated = selectedConfigIds.filter(id => id !== configId);
    } else {
      updated = [...selectedConfigIds, configId];
    }
    setSelectedConfigIds(updated);
    
    // Update context in existing session if active
    if (selectedSessionId) {
      try {
        // Simple update call or let backend handle dynamic context binding
        // For simplicity, we can log the config link updates
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-180px)]">
      {/* Session selector sidebar */}
      <div className="lg:col-span-3 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-full">
        <div className="space-y-4 overflow-hidden flex flex-col h-full">
          <div className="flex justify-between items-center shrink-0">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Active Channels</h3>
            <button
              onClick={handleCreateSession}
              className="p-1 text-primary hover:bg-slate-100 rounded-lg"
              title="New Channel"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5 overflow-y-auto flex-1 pr-1.5">
            {sessions.map((s) => (
              <button
                key={s._id}
                onClick={() => setSelectedSessionId(s._id)}
                className={`w-full text-left p-3 rounded-lg border text-xs flex items-center space-x-2 transition-colors ${
                  selectedSessionId === s._id 
                    ? 'border-primary bg-sky-50/50 font-bold text-primary shadow-sm' 
                    : 'border-slate-150 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{s.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Configuration Context binder */}
        <div className="border-t border-slate-100 pt-4 mt-4 shrink-0 space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">RAG Configuration Context</p>
          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {configs.map((c) => {
              const checked = selectedConfigIds.includes(c._id);
              return (
                <label key={c._id} className="flex items-center space-x-2 text-[11px] text-slate-600 hover:text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggleConfigContext(c._id)}
                    className="rounded border-slate-350 text-primary focus:ring-primary/20"
                  />
                  <span className="truncate">{c.fileName}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Chat Viewport */}
      <div className="lg:col-span-9 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-primary" />
            <div>
              <h4 className="text-xs font-bold text-slate-800">NetMind AI Troubleshooting Engine</h4>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Interactive Diagnostics Tunnel</p>
            </div>
          </div>
        </div>

        {/* Messages list */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50/30 space-y-4">
          {loadingHistory ? (
            <div className="text-center text-slate-400 text-xs py-8">Loading history logs...</div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center h-full max-w-md mx-auto space-y-3">
              <Bot className="w-12 h-12 text-slate-300 animate-bounce" />
              <h4 className="text-xs font-bold text-slate-800">Start NetMind AI Consultation</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Describe routing flaps, request VLAN access mappings, or audit security rules. Link a config file in the sidebar to run queries in context.
              </p>
              <div className="flex flex-wrap justify-center gap-1.5 text-[10px]">
                <button onClick={() => setMessageText('Why is OSPF neighbor state down?')} className="bg-white border border-slate-200 px-2 py-1 rounded hover:bg-slate-50 text-slate-600">"Why is OSPF down?"</button>
                <button onClick={() => setMessageText('Explain Native VLAN mismatch impacts')} className="bg-white border border-slate-200 px-2 py-1 rounded hover:bg-slate-50 text-slate-600">"VLAN mismatch impact?"</button>
                <button onClick={() => setMessageText('Analyze security issues in configuration')} className="bg-white border border-slate-200 px-2 py-1 rounded hover:bg-slate-50 text-slate-600">"Scan uploaded config"</button>
              </div>
            </div>
          ) : (
            messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex space-x-3 max-w-3xl ${
                  m.sender === 'user' ? 'ml-auto flex-row-reverse space-x-reverse' : ''
                }`}
              >
                {/* Profile Icon */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white ${
                  m.sender === 'user' ? 'bg-primary' : 'bg-slate-800'
                }`}>
                  {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className={`p-4 rounded-2xl text-xs space-y-2 leading-relaxed shadow-sm ${
                  m.sender === 'user' 
                    ? 'bg-primary text-white rounded-tr-none' 
                    : 'bg-white border border-slate-200 text-slate-750 rounded-tl-none'
                }`}>
                  <div className="whitespace-pre-wrap">{m.content}</div>
                  <span className="block text-[8px] text-slate-400 text-right mt-1">
                    {new Date(m.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
          {sending && (
            <div className="flex space-x-3 max-w-3xl">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 text-white">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-tl-none text-xs text-slate-400 flex items-center space-x-2">
                <div className="flex space-x-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
                <span>Consulting LLM models...</span>
              </div>
            </div>
          )}
          <div ref={messageEndRef} />
        </div>

        {/* Input Bar footer */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white flex items-center space-x-2 shrink-0">
          <input
            type="text"
            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white"
            placeholder="Ask AI assistant..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
          />
          <button
            type="submit"
            disabled={!messageText.trim() || sending}
            className="p-2 bg-primary text-white rounded-xl hover:bg-primary-hover active:scale-95 transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
