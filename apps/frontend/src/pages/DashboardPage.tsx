import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Settings, LogOut, BarChart2, Library,
  FlaskConical, Plus, Search, Home, FolderOpen,
  ChevronLeft, ChevronRight, Bell, User, Menu, X,
  MoreHorizontal, Trash2, Cpu,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const NAV_ITEMS = [
  { to: '/dashboard/home', icon: Home, label: 'Home' },
  { to: '/dashboard/agent', icon: Cpu, label: 'Agent 4' },
  { to: '/dashboard/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/dashboard/playground', icon: FlaskConical, label: 'Playground' },
  { to: '/dashboard/evaluation', icon: BarChart2, label: 'Evaluation' },
  { to: '/dashboard/files', icon: FolderOpen, label: 'Files' },
  { to: '/dashboard/prompts', icon: Library, label: 'Prompt Library' },
];


const PAGE_TITLES: Record<string, string> = {
  '/dashboard/home': 'Home',
  '/dashboard/agent': 'Agent 4',
  '/dashboard/chat': 'Chat',
  '/dashboard/playground': 'Playground',
  '/dashboard/evaluation': 'Evaluation',
  '/dashboard/files': 'Files',
  '/dashboard/prompts': 'Prompt Library',
  '/dashboard/settings': 'Settings',
};

function PandoraLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none shrink-0" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L14.7 9.3L22 12L14.7 14.7L12 22L9.3 14.7L2 12L9.3 9.3L12 2Z" fill="url(#pLogo)" />
      <defs>
        <linearGradient id="pLogo" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="60%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    chatSessions,
    user,
    deleteSession,
    selectedModel,
    setSelectedModel,
    supportedModels,
    setSupportedModels
  } = useAppStore();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [modelOpen, setModelOpen] = useState(false);

  useEffect(() => {
    fetch('/api/models')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setSupportedModels(data);
        }
      })
      .catch(() => {
        // Fallback to static values already in store
      });
  }, [setSupportedModels]);

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Pandora';
  const recentChats = [...chatSessions].reverse().slice(0, 8).filter(
    s => !searchVal || s.title.toLowerCase().includes(searchVal.toLowerCase())
  );

  const handleNewChat = () => {
    useAppStore.getState().setActiveSessionId(null as unknown as string);
    navigate('/dashboard/chat');
    setMobileOpen(false);
  };

  const handleSelectSession = (id: string) => {
    useAppStore.getState().setActiveSessionId(id);
    navigate('/dashboard/chat');
    setMobileOpen(false);
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) => (
    <NavLink
      to={to}
      onClick={() => setMobileOpen(false)}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 cursor-pointer ${
          collapsed ? 'justify-center' : ''
        } ${isActive ? 'bg-neutral-800 text-neutral-100 font-medium' : 'text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800/60'}`
      }
    >
      <Icon size={16} className="shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Header: Logo + Title + Collapse */}
      <div className="flex items-center justify-between px-3 h-14 border-b border-neutral-700 shrink-0">
        <div
          className="flex items-center gap-2.5 cursor-pointer min-w-0"
          onClick={() => navigate('/')}
        >
          <PandoraLogo />
          {(!collapsed || isMobile) && (
            <span className="font-semibold text-sm text-neutral-100 tracking-tight">Pandora</span>
          )}
        </div>
        {(!collapsed || isMobile) && !isMobile && (
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 rounded-md text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <ChevronLeft size={14} />
          </button>
        )}
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-md text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* New Chat + Search */}
      <div className="px-2 pt-3 pb-2 space-y-2 shrink-0">
        <button
          onClick={handleNewChat}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer ${(!collapsed || isMobile) ? '' : 'justify-center px-0'}`}
        >
          <Plus size={15} className="shrink-0" />
          {(!collapsed || isMobile) && <span>New Chat</span>}
        </button>
        {(!collapsed || isMobile) && (
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-300 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="px-2 pb-2 space-y-0.5 shrink-0">
        {(!collapsed || isMobile) && (
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-600 select-none">
            Navigation
          </p>
        )}
        {NAV_ITEMS.map(item => <NavItem key={item.to} {...item} />)}
      </nav>

      {/* Divider */}
      <div className="mx-3 border-t border-neutral-700 shrink-0" />

      {/* Recent Chats */}
      <div className="flex-1 overflow-y-auto px-2 py-2 min-h-0">
        {(!collapsed || isMobile) && recentChats.length > 0 && (
          <>
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-600 select-none">
              Recent Chats
            </p>
            {recentChats.map(session => (
              <div
                key={session.id}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800/60 transition-colors cursor-pointer"
                onClick={() => handleSelectSession(session.id)}
              >
                <MessageSquare size={11} className="shrink-0 opacity-60" />
                <span className="truncate flex-1">{session.title}</span>
                <button
                  onClick={e => { e.stopPropagation(); deleteSession(session.id); }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-neutral-600 hover:text-red-400 transition-all cursor-pointer"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Divider */}
      <div className="mx-3 border-t border-neutral-700 shrink-0" />

      {/* Bottom: Settings + Profile + Logout */}
      <div className="px-2 py-2 space-y-0.5 shrink-0">
        <NavItem to="/dashboard/settings" icon={Settings} label="Settings" />
        {(!collapsed || isMobile) ? (
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2 min-w-0 cursor-pointer" onClick={() => navigate('/dashboard/settings')}>
              <div className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden shrink-0">
                {user?.avatar_url
                  ? <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  : <User size={11} className="text-neutral-500" />}
              </div>
              <span className="text-xs text-neutral-400 truncate">
                {user?.full_name || user?.email?.split('@')[0] || 'User'}
              </span>
            </div>
            <button
              onClick={() => navigate('/auth')}
              title="Sign out"
              className="p-1 rounded-md text-neutral-600 hover:text-red-400 hover:bg-red-50/20 transition-colors cursor-pointer"
            >
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/auth')}
            title="Sign out"
            className="w-full flex items-center justify-center py-2 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-50/20 transition-colors cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-900 text-neutral-100">

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/20 z-30 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            key="mobile-sidebar"
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="lg:hidden fixed left-0 top-0 bottom-0 w-[240px] bg-neutral-950 border-r border-neutral-700 z-40 flex flex-col"
          >
            <SidebarContent isMobile />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="hidden lg:flex flex-col bg-neutral-950 border-r border-neutral-700 shrink-0 z-20 overflow-hidden"
      >
        {collapsed ? (
          /* Collapsed icon-only sidebar */
          <div className="flex flex-col h-full">
            <div className="h-14 flex items-center justify-center border-b border-neutral-700">
              <div onClick={() => navigate('/')} className="cursor-pointer">
                <PandoraLogo />
              </div>
            </div>
            <div className="px-2 pt-3 pb-2 shrink-0">
              <button
                onClick={handleNewChat}
                title="New Chat"
                className="w-full flex items-center justify-center py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                <Plus size={15} />
              </button>
            </div>
            <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
              {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  title={label}
                  className={({ isActive }) =>
                    `flex items-center justify-center py-2 rounded-lg transition-colors cursor-pointer ${
                      isActive ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800/60'
                    }`
                  }
                >
                  <Icon size={16} />
                </NavLink>
              ))}
            </nav>
            <div className="px-2 py-2 border-t border-neutral-700 space-y-0.5">
              <button
                onClick={() => setCollapsed(false)}
                title="Expand sidebar"
                className="w-full flex items-center justify-center py-2 rounded-lg text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
              <NavLink
                to="/dashboard/settings"
                title="Settings"
                className={({ isActive }) =>
                  `flex items-center justify-center py-2 rounded-lg transition-colors cursor-pointer ${
                    isActive ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800/60'
                  }`
                }
              >
                <Settings size={16} />
              </NavLink>
              <button
                onClick={() => navigate('/auth')}
                title="Sign out"
                className="w-full flex items-center justify-center py-2 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-50/20 transition-colors cursor-pointer"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        ) : (
          <SidebarContent />
        )}
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Nav */}
        <header className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-neutral-700 bg-neutral-900 z-10">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <Menu size={17} />
            </button>
            <h1 className="text-sm font-semibold text-neutral-200">{pageTitle}</h1>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Model Selector */}
            <div className="relative">
              <button
                onClick={() => setModelOpen(!modelOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-700 bg-neutral-950 text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-colors cursor-pointer"
              >
                <span className="hidden sm:block max-w-[110px] truncate">
                  {supportedModels.find(m => m.id === selectedModel)?.label ?? 'Select model'}
                </span>
                <MoreHorizontal size={12} className="sm:hidden" />
                <ChevronRight
                  size={11}
                  className={`hidden sm:block transition-transform duration-150 ${modelOpen ? 'rotate-90' : ''}`}
                />
              </button>
              <AnimatePresence>
                {modelOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 top-full mt-1.5 w-56 bg-neutral-900 border border-neutral-700 rounded-xl shadow-lg py-1 z-50"
                  >
                    {supportedModels.map(m => (
                      <button
                        key={m.id}
                        onClick={() => { setSelectedModel(m.id); setModelOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer ${
                          selectedModel === m.id
                            ? 'bg-neutral-800 text-neutral-100 font-medium'
                            : 'text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800/60'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notifications */}
            <button className="p-2 rounded-full text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer">
              <Bell size={15} />
            </button>

            {/* Profile avatar */}
            <button
              onClick={() => navigate('/dashboard/settings')}
              className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden hover:border-neutral-600 transition-colors cursor-pointer"
            >
              {user?.avatar_url
                ? <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                : <User size={13} className="text-neutral-500" />}
            </button>
          </div>
        </header>

        {/* Page outlet */}
        <main className="flex-1 overflow-hidden relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
