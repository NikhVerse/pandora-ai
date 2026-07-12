import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Cpu,
  Layers,
  ArrowRight,
  Terminal,
  FileText,
  Braces,
  Code2,
  ChevronDown,
} from 'lucide-react';
import { Card, Badge } from '@pandora/ui';

export default function LandingPage() {
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const staggerContainer = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-900 text-neutral-100 relative overflow-hidden font-sans">
      
      {/* Light background grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f3f4f6_1px,transparent_1px),linear-gradient(to_bottom,#f3f4f6_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-80" />
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[300px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 p-4 lg:px-8 flex justify-between items-center bg-neutral-900/80 backdrop-blur-md border-b border-neutral-700 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 cursor-pointer">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L14.7 9.3L22 12L14.7 14.7L12 22L9.3 14.7L2 12L9.3 9.3L12 2Z" fill="url(#replitLogo)" />
              <defs>
                <linearGradient id="replitLogo" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
            <span className="font-semibold text-sm tracking-tight text-neutral-100 uppercase tracking-widest">
              Pandora
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-neutral-500">
            {/* Products Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 hover:text-neutral-100 transition-colors py-1 cursor-pointer bg-neutral-800/60 hover:bg-neutral-800 px-3 py-1.5 rounded-lg border border-neutral-700 text-neutral-300">
                Products <ChevronDown size={12} className="transition-transform duration-200 group-hover:rotate-180" />
              </button>
              
              {/* Dropdown panel */}
              <div className="absolute top-full left-0 mt-1.5 w-44 rounded-xl border border-neutral-700 bg-neutral-950 p-1.5 shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50">
                <Link to="/auth" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-neutral-900 text-neutral-450 hover:text-neutral-200 transition-colors font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Agent
                </Link>
                <Link to="/auth" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-neutral-900 text-neutral-450 hover:text-neutral-200 transition-colors font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Design
                </Link>
                <Link to="/auth" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-neutral-900 text-neutral-450 hover:text-neutral-200 transition-colors font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Database
                </Link>
                <Link to="/auth" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-neutral-900 text-neutral-450 hover:text-neutral-200 transition-colors font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Publish
                </Link>
                <Link to="/auth" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-neutral-900 text-neutral-450 hover:text-neutral-200 transition-colors font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Integrations
                </Link>
                <Link to="/auth" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-neutral-900 text-neutral-450 hover:text-neutral-200 transition-colors font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Mobile
                </Link>
              </div>
            </div>

            <a href="#features" className="hover:text-neutral-100 transition-colors">Features</a>
            <a href="#workspace-preview" className="hover:text-neutral-100 transition-colors">Workspace</a>
            <a href="#architecture" className="hover:text-neutral-100 transition-colors">Architecture</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/auth" className="text-xs font-medium text-neutral-500 hover:text-neutral-100 transition-colors">
            Log in
          </Link>
          <Link to="/auth">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors cursor-pointer">
              Start building <ArrowRight size={12} />
            </button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="space-y-6 max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-700 bg-neutral-800 text-[11px] font-mono text-neutral-300">
            <Sparkles size={11} className="text-indigo-600 animate-pulse" />
            <span>Integrated Workspace + Fireworks AI</span>
          </div>

          <h1 className="text-4xl sm:text-7xl font-bold tracking-tight text-neutral-200 leading-[1.1] max-w-3xl mx-auto">
            Build software <span className="bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent">faster.</span>
          </h1>

          <p className="text-neutral-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Pandora is a developer workspace that turns prompt outlines, schemas, and multi-modal documents into functional templates using custom API routes.
          </p>

          <div className="flex justify-center gap-3 pt-2">
            <Link to="/auth">
              <button className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold tracking-wide transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10">
                Get Started Free <ArrowRight size={14} />
              </button>
            </Link>
            <a href="#workspace-preview">
              <button className="px-5 py-2.5 rounded-xl border border-neutral-700 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 text-xs font-semibold transition-colors cursor-pointer">
                View Workspace
              </button>
            </a>
          </div>
        </motion.div>

        {/* Replit-style 3-Pane Workspace Preview in Light Mode */}
        <motion.div
          id="workspace-preview"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="w-full max-w-5xl mt-16 rounded-2xl border border-neutral-700 bg-neutral-900 p-1.5 shadow-xl relative overflow-hidden text-left"
        >
          {/* Header toolbar */}
          <div className="flex items-center justify-between px-4 py-2 bg-neutral-800 border-b border-neutral-700 rounded-t-xl">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
              <span className="text-[10px] font-mono text-neutral-500 ml-3">workspace-diagnostics-v1.0</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>All Services Connected</span>
            </div>
          </div>

          {/* Three-Pane Workspace layout */}
          <div className="grid grid-cols-1 md:grid-cols-4 min-h-[380px] bg-neutral-900 divide-y md:divide-y-0 md:divide-x divide-neutral-700 text-xs">
            
            {/* Panel 1: File Tree */}
            <div className="md:col-span-1 p-3 space-y-3 bg-neutral-950">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 select-none">Workspace Files</p>
              <div className="space-y-1 font-mono text-[11px] text-neutral-400">
                <div className="flex items-center gap-2 p-1.5 rounded hover:bg-neutral-800 cursor-pointer">
                  <Code2 size={12} className="text-indigo-600" /> <span>main.py</span>
                </div>
                <div className="flex items-center gap-2 p-1.5 rounded hover:bg-neutral-800 cursor-pointer bg-neutral-800 text-neutral-200">
                  <Code2 size={12} className="text-indigo-600" /> <span>config.py</span>
                </div>
                <div className="flex items-center gap-2 p-1.5 rounded hover:bg-neutral-800 cursor-pointer">
                  <FileText size={12} className="text-neutral-500" /> <span>requirements.txt</span>
                </div>
                <div className="flex items-center gap-2 p-1.5 rounded hover:bg-neutral-800 cursor-pointer">
                  <Braces size={12} className="text-amber-600" /> <span>package.json</span>
                </div>
              </div>
            </div>

            {/* Panel 2: Code Editor (Dark mode editor matches Replit) */}
            <div className="md:col-span-2 p-4 font-mono space-y-3 bg-[#0f172a] text-neutral-300 relative">
              <div className="flex items-center gap-2 text-[10px] text-neutral-500 border-b border-neutral-800 pb-2">
                <span className="text-neutral-200 font-semibold border-b border-indigo-500 pb-1.5 -mb-2">config.py</span>
                <span>main.py</span>
              </div>
              <pre className="text-[11px] text-[#e2e8f0] leading-relaxed overflow-x-auto pt-2">
{`from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    SUPABASE_URL: Optional[str] = None
    FIREWORKS_API_KEY: Optional[str] = None
    DEFAULT_MODEL: str = "llama-v3p1-70b-instruct"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()`}
              </pre>
            </div>

            {/* Panel 3: Live Output Terminal */}
            <div className="md:col-span-1 p-3 bg-neutral-950 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] text-neutral-500 uppercase font-mono pb-1 border-b border-neutral-700">
                  <span>Console Logs</span>
                  <span className="text-emerald-500 animate-pulse font-semibold">Running</span>
                </div>
                <div className="space-y-1.5 font-mono text-[10px] text-neutral-400">
                  <p className="text-neutral-500">// initializing gateway...</p>
                  <p>GET /api/me <span className="text-emerald-500">200</span></p>
                  <p>GET /api/models <span className="text-emerald-500">200</span></p>
                  <p className="text-indigo-600">stream_started: model_70b</p>
                </div>
              </div>
              <div className="p-2.5 rounded-lg border border-neutral-700 bg-neutral-900 space-y-1.5 mt-4">
                <p className="text-[9px] uppercase tracking-wider text-neutral-500 font-semibold">Active Model</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-neutral-200">Llama 3.1 70B</span>
                  <span className="text-[9px] px-1 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-600 font-mono">70B</span>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 lg:px-8 max-w-7xl mx-auto z-10 relative">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-2">
          <Badge variant="blue">Core Workspace Tools</Badge>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-neutral-200">Powerful developer features</h2>
          <p className="text-neutral-400 text-xs sm:text-sm">
            Everything you need to build custom AI templates and test models dynamically.
          </p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <motion.div variants={fadeInUp}>
            <Card variant="glass" hoverEffect className="p-5 h-full flex flex-col justify-between space-y-6 bg-neutral-950 border-neutral-700 text-neutral-100">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600">
                  <Sparkles size={16} />
                </div>
                <h3 className="font-semibold text-sm text-neutral-200">AI Chat Console</h3>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Fast token streaming with custom system prompts, markdown syntax, and code block formatting.
                </p>
              </div>
              <span className="text-[9px] font-mono text-neutral-500">Module 6</span>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card variant="glass" hoverEffect className="p-5 h-full flex flex-col justify-between space-y-6 bg-neutral-950 border-neutral-700 text-neutral-100">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600">
                  <Terminal size={16} />
                </div>
                <h3 className="font-semibold text-sm text-neutral-200">JSON Mode Compliance</h3>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Strict schema parameter parsing using direct JSON mode templates to guarantee clean output structure.
                </p>
              </div>
              <span className="text-[9px] font-mono text-neutral-500">Module 7</span>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card variant="glass" hoverEffect className="p-5 h-full flex flex-col justify-between space-y-6 bg-neutral-950 border-neutral-700 text-neutral-100">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600">
                  <Cpu size={16} />
                </div>
                <h3 className="font-semibold text-sm text-neutral-200">Fireworks Inference</h3>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Dynamic Fireworks AI Llama model integration with robust auto-retry and failover.
                </p>
              </div>
              <span className="text-[9px] font-mono text-neutral-500">Module 7</span>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card variant="glass" hoverEffect className="p-5 h-full flex flex-col justify-between space-y-6 bg-neutral-950 border-neutral-700 text-neutral-100">
              <div className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600">
                  <Layers size={16} />
                </div>
                <h3 className="font-semibold text-sm text-neutral-200">Production Ready</h3>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Fully containerized environment via Docker with built-in readiness checks and automated pipelines.
                </p>
              </div>
              <span className="text-[9px] font-mono text-neutral-500">Module 9</span>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* Technical Spec / Architecture */}
      <section id="architecture" className="py-20 px-6 lg:px-8 border-t border-neutral-700 bg-neutral-900 relative z-10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <Badge variant="purple">Architecture Specs</Badge>
            <h2 className="text-2xl sm:text-4xl font-bold text-neutral-200">FastAPI + Supabase infrastructure</h2>
            <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed">
              Pandora handles backend processes using a lightning-fast Python asyncio server running FastAPI, synced with Supabase authentication and session states.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-700">
                <div className="text-indigo-600 font-bold text-lg mb-0.5">99.9%</div>
                <div className="text-neutral-500 text-[10px] uppercase tracking-wide">Uptime Target</div>
              </div>
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-700">
                <div className="text-indigo-600 font-bold text-lg mb-0.5">&lt;50ms</div>
                <div className="text-neutral-500 text-[10px] uppercase tracking-wide">JSON Response Latency</div>
              </div>
            </div>
          </div>

          <div className="w-full md:w-[400px] shrink-0 p-5 rounded-2xl border border-neutral-700 bg-neutral-950 relative overflow-hidden">
            <h4 className="text-xs font-semibold mb-4 flex items-center gap-2 text-neutral-300">
              <Terminal size={12} className="text-indigo-600" />
              Service Topology
            </h4>
            <div className="space-y-3 font-mono text-[11px]">
              <div className="flex items-center justify-between p-2 rounded bg-neutral-900 border border-neutral-700">
                <span className="text-neutral-500">auth_service</span>
                <span className="text-emerald-500 font-semibold">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-neutral-900 border border-neutral-700">
                <span className="text-neutral-500">inference_gateway</span>
                <span className="text-emerald-400 font-semibold">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-neutral-900 border border-neutral-700">
                <span className="text-neutral-500">evaluation_engine</span>
                <span className="text-emerald-400 font-semibold">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-neutral-900 border border-neutral-700">
                <span className="text-neutral-500">supabase_db</span>
                <span className="text-emerald-400 font-semibold">CONNECTED</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-700 bg-neutral-950 p-6 text-neutral-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L14.7 9.3L22 12L14.7 14.7L12 22L9.3 14.7L2 12L9.3 9.3L12 2Z" fill="url(#footLogo)" />
              <defs>
                <linearGradient id="footLogo" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
            <span className="font-semibold text-neutral-200 tracking-tight uppercase tracking-wider text-[10px]">Pandora Workspace</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-neutral-200 transition-colors">Features</a>
            <span className="text-neutral-800">|</span>
            <span>© 2026 Pandora Inc. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
