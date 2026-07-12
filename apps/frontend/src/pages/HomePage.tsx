import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Send, Paperclip, Braces, Zap, Code2, FileText,
  Database, Terminal, Layout, Cpu, Activity,
  Server, MessageSquare, History, ArrowUpRight,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { ChatSession, ChatMessage } from '@pandora/types';

const TEMPLATES = [
  { icon: Code2, label: 'Python FastAPI App', prompt: 'Write a complete Python FastAPI backend with standard directories, schemas, config.py and main.py.', type: 'Backend' },
  { icon: Layout, label: 'React Component', prompt: 'Create a reusable React TypeScript datatable component with sorting, searching, and pagination support.', type: 'Frontend' },
  { icon: Terminal, label: 'Docker Multi-stage', prompt: 'Write an optimized Dockerfile for a production Node.js Vite application using multi-stage builds.', type: 'DevOps' },
  { icon: Database, label: 'SQL Schema Design', prompt: 'Design a normalized PostgreSQL schema database for a SaaS platform with users, teams, subscriptions, and logs.', type: 'Database' },
];

const QUICK_ACTIONS = [
  { icon: Zap, label: 'Explain Quantum Computing', prompt: 'Explain quantum computing in simple terms with a real-world analogy.' },
  { icon: FileText, label: 'Summarize Document', prompt: 'I want you to summarize a document. Please attach it first using the file uploader.' },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const itemVariant = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function HomePage() {
  const navigate = useNavigate();
  const { chatSessions, user, addSession, addMessage, setActiveSessionId } = useAppStore();
  const [inputVal, setInputVal] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const username = user?.full_name || user?.email?.split('@')[0] || 'Developer';

  const handleSubmit = (prompt: string) => {
    if (!prompt.trim()) return;

    const session: ChatSession = {
      id: crypto.randomUUID(),
      title: prompt.trim().substring(0, 40),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addSession(session);
    setActiveSessionId(session.id);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt.trim(),
      created_at: new Date().toISOString(),
    };
    addMessage(session.id, userMsg);

    navigate('/dashboard/chat');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(inputVal);
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    navigate('/dashboard/chat');
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-neutral-900 text-neutral-100 gemini-bg-glow">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-700 pb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-100">
              Welcome, <span className="text-indigo-400">{username}</span>
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Pandora AI Workspace · Premium Integrated Workspace Environment
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-950 border border-neutral-700 rounded-lg text-[11px] text-neutral-400 font-mono">
              <Server size={11} className="text-emerald-400" />
              <span>Gateway: Online</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-950 border border-neutral-700 rounded-lg text-[11px] text-neutral-400 font-mono">
              <Activity size={11} className="text-indigo-400 animate-pulse" />
              <span>Inference: Active</span>
            </div>
          </div>
        </div>

        {/* Gemini Central AI Composer */}
        <div className="flex flex-col items-center py-6 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-3xl font-light text-neutral-200 tracking-tight">
              Where will we build today?
            </h2>
            <p className="text-xs text-neutral-600">
              Enter a prompt, choose a template, or ask questions to get started.
            </p>
          </div>

          <div className="w-full max-w-3xl">
            <div className="relative bg-neutral-950 border border-neutral-700 rounded-2xl shadow-sm focus-within:border-neutral-500 transition-colors overflow-hidden">
              <textarea
                ref={textareaRef}
                value={inputVal}
                onChange={e => { setInputVal(e.target.value); handleInput(); }}
                onKeyDown={handleKeyDown}
                placeholder="Ask Pandora anything, generate code, summarize, design..."
                rows={1}
                className="w-full resize-none bg-transparent px-5 pt-4 pb-14 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none leading-relaxed"
              />
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2.5 bg-neutral-950/90 border-t border-neutral-800/40">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => navigate('/dashboard/files')}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors cursor-pointer"
                    title="Upload File"
                  >
                    <Paperclip size={14} />
                  </button>
                  <button
                    onClick={() => navigate('/dashboard/playground')}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors cursor-pointer"
                    title="Open Playground"
                  >
                    <Braces size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-neutral-600 font-mono hidden sm:inline">
                    Enter to submit · Shift+Enter for newline
                  </span>
                  <button
                    onClick={() => handleSubmit(inputVal)}
                    disabled={!inputVal.trim()}
                    className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <Send size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Panels Grid (Replit Workspaces + Activity Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1 & 2: Quick Start Templates + Prompts */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Replit-style Quickstarts */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Quick Start Templates
                </h3>
                <span className="text-[10px] text-neutral-600 font-mono">Create in 1-Click</span>
              </div>

              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {TEMPLATES.map((tpl) => {
                  const Icon = tpl.icon;
                  return (
                    <motion.button
                      key={tpl.label}
                      variants={itemVariant}
                      onClick={() => handleSubmit(tpl.prompt)}
                      className="flex items-start gap-4 p-4 rounded-xl border border-neutral-700 bg-neutral-950 hover:bg-neutral-850 hover:border-neutral-600 text-left transition-all cursor-pointer group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-neutral-800 group-hover:bg-neutral-750 flex items-center justify-center text-neutral-400 shrink-0 transition-colors">
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-neutral-200 group-hover:text-neutral-100 transition-colors">
                            {tpl.label}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-neutral-800 text-neutral-500">
                            {tpl.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-600 line-clamp-2 mt-1">
                          {tpl.prompt}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            </div>

            {/* Quick Actions Suggestions */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Suggested Prompts
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      onClick={() => handleSubmit(action.prompt)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-neutral-700 bg-neutral-950 hover:bg-neutral-850 hover:border-neutral-600 text-left transition-all cursor-pointer group text-xs text-neutral-300 font-medium"
                    >
                      <Icon size={13} className="text-neutral-500" />
                      <span className="flex-1 truncate">{action.label}</span>
                      <ArrowUpRight size={13} className="text-neutral-600 group-hover:text-neutral-300 transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Column 3: Recent Repls/Chats list + Workspace Diagnostics */}
          <div className="space-y-6">
            
            {/* Recent active sessions */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <History size={12} />
                Recent Chats
              </h3>
              <div className="bg-neutral-950 border border-neutral-700 rounded-xl overflow-hidden divide-y divide-neutral-800">
                {chatSessions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-neutral-600">
                    No active sessions.
                  </div>
                ) : (
                  [...chatSessions].reverse().slice(0, 5).map((session) => (
                    <div
                      key={session.id}
                      onClick={() => handleSelectSession(session.id)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-900 transition-colors cursor-pointer group"
                    >
                      <MessageSquare size={13} className="text-neutral-500 group-hover:text-indigo-400 transition-colors" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-neutral-300 truncate group-hover:text-neutral-100">
                          {session.title}
                        </p>
                        <p className="text-[10px] text-neutral-600 mt-0.5">
                          {new Date(session.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <ArrowUpRight size={12} className="text-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Diagnostic system metrics panel */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <Cpu size={12} />
                Workspace Status
              </h3>
              <div className="bg-neutral-950 border border-neutral-700 rounded-xl p-4 space-y-3 font-mono text-[11px] text-neutral-400">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-800/80">
                  <span className="text-neutral-600">WORKSPACE_ID</span>
                  <span className="text-neutral-200">pandora-client-v1</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-neutral-800/80">
                  <span className="text-neutral-600">DATABASE</span>
                  <span className="text-emerald-500 font-semibold">Supabase OK</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-neutral-800/80">
                  <span className="text-neutral-600">TOTAL_CHATS</span>
                  <span className="text-neutral-200">{chatSessions.length} logs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">FIREWORKS_KEY</span>
                  <span className="text-indigo-400">Configured</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
