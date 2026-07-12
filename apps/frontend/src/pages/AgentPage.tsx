import { useState, useRef, useEffect } from 'react';
import {
  Cpu, Play, Square, Code2, Terminal, Eye, Plus, Trash2,
  Sliders, Music, RotateCcw, Copy,
  Sparkles, MousePointer, RefreshCw, FolderOpen, FileText,
  CheckCircle2, Loader2, Monitor, Smartphone, Tablet,
  ArrowUpRight, Send, Paperclip, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// SIMULATED SOURCE CODE ASSETS FOR THE CODE VIEW
// ============================================================================

const CODE_ASSETS: Record<string, Record<string, string>> = {
  ecommerce: {
    'package.json': `{
  "name": "ecommerce-dashboard",
  "version": "1.0.0",
  "dependencies": {
    "react": "^19.0.0",
    "lucide-react": "^0.400.0",
    "tailwindcss": "^4.0.0"
  }
}`,
    'src/App.tsx': `import React, { useState } from 'react';
import { ShoppingBag, ArrowUpRight, ArrowDownRight, Users, CreditCard } from 'lucide-react';

export default function App() {
  const [filterStatus, setFilterStatus] = useState('all');
  
  return (
    <div className="p-6 bg-neutral-900 text-neutral-100 min-h-screen">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold">Store Operations</h1>
          <p className="text-xs text-neutral-400">Real-time revenue metrics & logs</p>
        </div>
      </header>
      
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Metric Card */}
        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
          <span className="text-xs text-neutral-500">Total Revenue</span>
          <div className="flex justify-between items-center mt-2">
            <span className="text-lg font-semibold">$48,259.00</span>
            <span className="text-xs text-emerald-400 flex items-center">
              <ArrowUpRight size={12} /> +12.3%
            </span>
          </div>
        </div>
        {/* ... More Metric Cards */}
      </div>
    </div>
  );
}`,
    'src/index.css': `@import "tailwindcss";

body {
  background-color: #0a0a0a;
  font-family: 'Inter', sans-serif;
}`,
    'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>E-Commerce Dashboard</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
  },
  kanban: {
    'package.json': `{
  "name": "kanban-task-board",
  "version": "1.0.0",
  "dependencies": {
    "react": "^19.0.0",
    "lucide-react": "^0.400.0"
  }
}`,
    'src/App.tsx': `import React, { useState } from 'react';
import { Plus, Trash, CheckCircle } from 'lucide-react';

export default function KanbanBoard() {
  const [tasks, setTasks] = useState([
    { id: '1', title: 'Implement Auth Gate', column: 'todo', priority: 'High' },
    { id: '2', title: 'Optimize Bundle Sizes', column: 'progress', priority: 'Medium' }
  ]);
  
  return (
    <div className="p-6 bg-neutral-900 text-neutral-100 min-h-screen">
      <h1 className="text-xl font-bold mb-4">Sprint Backlog</h1>
      {/* Board Columns rendering */}
    </div>
  );
}`,
    'src/index.css': `@import "tailwindcss";

.kanban-col {
  background: #111;
  border-radius: 8px;
}`
  },
  soundboard: {
    'package.json': `{
  "name": "ambient-soundboard",
  "version": "1.0.0",
  "dependencies": {
    "react": "^19.0.0",
    "lucide-react": "^0.400.0"
  }
}`,
    'src/App.tsx': `import React, { useState } from 'react';
import { Volume2, Music, Sliders } from 'lucide-react';

export default function AmbientMixer() {
  const [playing, setPlaying] = useState<string | null>(null);
  
  return (
    <div className="p-6 bg-neutral-955 text-neutral-100 rounded-2xl">
      <h2 className="text-lg font-bold">Ambient Space Mixer</h2>
      {/* Waveform and sliders */}
    </div>
  );
}`
  },
  calculator: {
    'package.json': `{
  "name": "glassmorphism-calculator",
  "version": "1.0.0"
}`,
    'src/App.tsx': `import React, { useState } from 'react';

export default function App() {
  const [val, setVal] = useState('0');
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl">
        {/* Buttons and Display */}
      </div>
    </div>
  );
}`
  }
};

export default function AgentPage() {
  // ============================================================================
  // WORKSPACE STATES
  // ============================================================================
  const [agentStatus, setAgentStatus] = useState<'idle' | 'thinking' | 'building' | 'running'>('idle');
  const [activeTab, setActiveTab] = useState<'canvas' | 'code' | 'terminal'>('canvas');
  const [selectedApp, setSelectedApp] = useState<'ecommerce' | 'kanban' | 'soundboard' | 'calculator' | 'custom'>('ecommerce');
  const [canvasMode, setCanvasMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [elementSelectorActive, setElementSelectorActive] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [customAppContent, setCustomAppContent] = useState<{title: string, desc: string, code: string} | null>(null);

  // Input state
  const [inputVal, setInputVal] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant' | 'system', content: string, id: string, thoughts?: string[] }>>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "👋 Hello! I am the Pandora Agent. I can build, compile, and run complete web applications for you from natural language. \n\nSelect a template below or prompt me to start!",
    }
  ]);

  // File tree states
  const [selectedFile, setSelectedFile] = useState('src/App.tsx');
  
  // Terminal logs state
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    ' [38;5;244m[system] [0m Environment initialised.',
    ' [38;5;81m[gateway] [0m Connected to backend API endpoint',
    ' [38;5;121m[vite] [0m Dev server ready: http://localhost:3000/',
    ' [38;5;244m[system] [0m Idle. Awaiting instruction...'
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // MOCK DATA FOR SIMULATED MINI-APPS
  // ============================================================================

  // 1. Kanban Board State
  const [kanbanTasks, setKanbanTasks] = useState([
    { id: '1', title: 'Implement Auth Flow', desc: 'Secure APIs with token validation', col: 'todo', priority: 'High', date: '2 days ago' },
    { id: '2', title: 'Write unit tests for Gateway', desc: 'Cover test_main.py coverage', col: 'todo', priority: 'Medium', date: '1 day ago' },
    { id: '3', title: 'Create sandbox playground layout', desc: 'Develop controls and parameters sliders', col: 'progress', priority: 'High', date: '5 hrs ago' },
    { id: '4', title: 'File summarization schema', desc: 'Configure CSV and PDF parsing', col: 'done', priority: 'Low', date: 'Yesterday' }
  ]);
  const [kanbanModalOpen, setKanbanModalOpen] = useState(false);
  const [newKanbanTitle, setNewKanbanTitle] = useState('');
  const [newKanbanDesc, setNewKanbanDesc] = useState('');
  const [newKanbanCol, setNewKanbanCol] = useState('todo');
  const [newKanbanPriority, setNewKanbanPriority] = useState('Medium');

  // 2. Soundboard State
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [synthVolume, setSynthVolume] = useState(70);
  const [bassLevel, setBassLevel] = useState(45);
  const [reverbLevel, setReverbLevel] = useState(30);
  const [waveSpeed, setWaveSpeed] = useState(0);

  // 3. Calculator State
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcHistory, setCalcHistory] = useState<string[]>([]);
  const [calcTheme, setCalcTheme] = useState<'glass-dark' | 'glass-light'>('glass-dark');

  // 4. E-commerce dashboard stats filter
  const [ecommerceFilter, setEcommerceFilter] = useState('all');

  // ============================================================================
  // AUTO SCROLL EFFECTS
  // ============================================================================
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Simulated soundboard oscillation
  useEffect(() => {
    if (activeSound) {
      setWaveSpeed(4);
    } else {
      setWaveSpeed(0);
    }
  }, [activeSound]);

  // ============================================================================
  // SIMULATED PIPELINE EXECUTION FOR APPS
  // ============================================================================
  const runAgentPipeline = (appKey: typeof selectedApp, promptMessage: string, customPayload?: {title: string, desc: string, code: string}) => {
    setAgentStatus('thinking');
    setActiveTab('terminal');
    
    // Add user message
    const userId = crypto.randomUUID();
    setChatMessages(prev => [...prev, { id: userId, role: 'user', content: promptMessage }]);
    
    // Create assistant message with loading thoughts
    const assistId = crypto.randomUUID();
    setChatMessages(prev => [...prev, {
      id: assistId,
      role: 'assistant',
      content: '',
      thoughts: ['Analyzing prompt requirements...', 'Designing app component architecture...']
    }]);

    setTerminalLogs(prev => [
      ...prev,
      `\n [38;5;208m[agent] [0m Triggered Agent build pipeline for: "${promptMessage}"`,
      ' [38;5;244m[agent] [0m Phase 1: Planning and dependency resolution...'
    ]);

    // Step 1: Thinking -> Building (1.5 seconds)
    setTimeout(() => {
      setAgentStatus('building');
      setChatMessages(prev => prev.map(m => m.id === assistId ? {
        ...m,
        thoughts: [...(m.thoughts || []), 'Creating folder tree & configuration files...', 'Injecting required styled-tokens and icons...']
      } : m));

      setTerminalLogs(prev => [
        ...prev,
        ' [38;5;244m[agent] [0m Phase 2: Generating component trees and styles...',
        ' [38;5;81m[npm] [0m Installing packages: lucide-react, clsx, tailwind-merge...',
        ' [38;5;121m[vite] [0m HMR server hot-reload triggered...'
      ]);
    }, 1800);

    // Step 2: Building -> Running (3.5 seconds)
    setTimeout(() => {
      setAgentStatus('running');
      setSelectedApp(appKey);
      if (appKey === 'custom' && customPayload) {
        setCustomAppContent(customPayload);
      }
      setSelectedFile('src/App.tsx');
      setActiveTab('canvas');

      const appTitle = appKey === 'ecommerce' ? 'E-Commerce Dashboard' :
                       appKey === 'kanban' ? 'Kanban Task Board' :
                       appKey === 'soundboard' ? 'Ambient Soundboard' :
                       appKey === 'calculator' ? 'Glassmorphism Calculator' :
                       customPayload?.title || 'Custom App';

      setChatMessages(prev => prev.map(m => m.id === assistId ? {
        ...m,
        content: `🎉 I have successfully built and deployed your requested application: **${appTitle}**!\n\nYou can now interact with it live on the **Canvas** tab, inspect its syntax-highlighted source code in the **Code** tab, or view runtime messages in the **Terminal** tab.`,
        thoughts: [...(m.thoughts || []), 'Compilation successful. Dev server bound on http://localhost:3000/']
      } : m));

      setTerminalLogs(prev => [
        ...prev,
        ' [38;5;121m[vite] [0m Build complete in 420ms.',
        ' [38;5;121m[vite] [0m HMR connection re-established.',
        ` [38;5;81m[vite] [0m Server running at: http://localhost:3000/`,
        ` [38;5;121m[vite] [0m hot module replacement active`
      ]);
    }, 4000);
  };

  // ============================================================================
  // FORM / COMPOSER HANDLERS
  // ============================================================================
  const handleComposerSubmit = async () => {
    if (!inputVal.trim()) return;
    const prompt = inputVal.trim();
    setInputVal('');

    // Match keywords for templates
    const lowercase = prompt.toLowerCase();
    if (lowercase.includes('e-commerce') || lowercase.includes('shop') || lowercase.includes('store') || lowercase.includes('sales')) {
      runAgentPipeline('ecommerce', prompt);
    } else if (lowercase.includes('kanban') || lowercase.includes('task') || lowercase.includes('board') || lowercase.includes('sprint')) {
      runAgentPipeline('kanban', prompt);
    } else if (lowercase.includes('sound') || lowercase.includes('ambient') || lowercase.includes('music') || lowercase.includes('soundboard')) {
      runAgentPipeline('soundboard', prompt);
    } else if (lowercase.includes('calculator') || lowercase.includes('calc') || lowercase.includes('math')) {
      runAgentPipeline('calculator', prompt);
    } else {
      // Direct call to LLM via Backend chat gateway endpoint
      setAgentStatus('thinking');
      
      // User message
      const userMsgId = crypto.randomUUID();
      setChatMessages(prev => [...prev, { id: userMsgId, role: 'user', content: prompt }]);
      
      // Assist message
      const assistMsgId = crypto.randomUUID();
      setChatMessages(prev => [...prev, {
        id: assistMsgId,
        role: 'assistant',
        content: '',
        thoughts: ['Resolving API gateway request...', 'Streaming custom assistant thought parameters...']
      }]);

      setTerminalLogs(prev => [
        ...prev,
        `\n [38;5;208m[agent] [0m Forwarding instruction context to Fireworks LLM...`,
      ]);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: `The user wants you to create an app with prompt: "${prompt}". Write a short description and complete JSX/React code for it. Return it in JSON format containing "title", "description", and "code" fields. Do not add markdown backticks outside JSON.` }]
          })
        });
        
        if (res.ok) {
          const data = await res.json();
          const contentText = data.choices?.[0]?.message?.content || '';
          
          let parsedData = { title: 'Custom React App', description: 'Generated custom app.', code: '' };
          try {
            // Clean up backticks if any
            const cleaned = contentText.replace(/^```json/, '').replace(/```$/, '').trim();
            parsedData = JSON.parse(cleaned);
          } catch {
            // Fallback parsing
            parsedData = {
              title: prompt.substring(0, 30),
              description: 'Your custom AI-generated web app component.',
              code: contentText || 'export default function App() { return <div className="p-8">Custom View</div>; }'
            };
          }

          runAgentPipeline('custom', prompt, {
            title: parsedData.title,
            desc: parsedData.description,
            code: parsedData.code
          });
        } else {
          throw new Error();
        }
      } catch {
        // Fallback simulated build
        setTimeout(() => {
          runAgentPipeline('custom', prompt, {
            title: 'Visual Web Panel',
            desc: 'Custom UI configured by your prompt.',
            code: `export default function CustomApp() {
  return (
    <div className="p-8 bg-neutral-900 text-neutral-100 rounded-2xl border border-neutral-800">
      <h1 className="text-xl font-bold text-indigo-400">Custom Generated App</h1>
      <p className="text-sm text-neutral-400 mt-2">Instruction: "${prompt}"</p>
      <div className="mt-6 p-4 bg-neutral-950 border border-neutral-800 rounded-lg">
        <span className="text-xs text-neutral-500 font-mono">Running sandbox dev environment successfully.</span>
      </div>
    </div>
  );
}`
          });
        }, 1500);
      }
    }
  };

  // Element Selector click event handler
  const handleCanvasElementClick = (elementName: string) => {
    if (!elementSelectorActive) return;
    setInputVal(`Edit the ${elementName} element to `);
    setElementSelectorActive(false);
    setHoveredElement(null);
  };

  // ============================================================================
  // MOCK KANBAN HANDLERS
  // ============================================================================
  const handleAddKanbanTask = () => {
    if (!newKanbanTitle.trim()) return;
    const newTask = {
      id: crypto.randomUUID(),
      title: newKanbanTitle.trim(),
      desc: newKanbanDesc.trim() || 'No description provided.',
      col: newKanbanCol,
      priority: newKanbanPriority,
      date: 'Just now'
    };
    setKanbanTasks(prev => [...prev, newTask]);
    setNewKanbanTitle('');
    setNewKanbanDesc('');
    setKanbanModalOpen(false);
    
    // Add logs
    setTerminalLogs(prev => [
      ...prev,
      ` [38;5;121m[vite] [0m HMR local state updated: Task "${newTask.title}" added.`
    ]);
  };

  const handleMoveKanban = (id: string, dir: 'left' | 'right') => {
    const cols = ['todo', 'progress', 'done'];
    setKanbanTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const curIdx = cols.indexOf(t.col);
      let newIdx = curIdx + (dir === 'right' ? 1 : -1);
      if (newIdx < 0 || newIdx >= cols.length) return t;
      return { ...t, col: cols[newIdx] };
    }));
  };

  const handleDeleteKanban = (id: string) => {
    setKanbanTasks(prev => prev.filter(t => t.id !== id));
  };

  // ============================================================================
  // MOCK CALCULATOR HANDLERS
  // ============================================================================
  const handleCalcClick = (btn: string) => {
    if (btn === 'C') {
      setCalcDisplay('0');
    } else if (btn === '=') {
      try {
        // Safe evaluation
        const clean = calcDisplay.replace(/x/g, '*').replace(/÷/g, '/');
        const res = Function(`"use strict"; return (${clean})`)();
        setCalcDisplay(String(res));
        setCalcHistory(prev => [...prev.slice(-4), `${calcDisplay} = ${res}`]);
      } catch {
        setCalcDisplay('Error');
      }
    } else {
      if (calcDisplay === '0' || calcDisplay === 'Error') {
        setCalcDisplay(btn);
      } else {
        setCalcDisplay(prev => prev + btn);
      }
    }
  };

  // ============================================================================
  // HELPER FOR SYNTAX HIGHLIGHTING RENDER
  // ============================================================================
  const getFileContent = () => {
    const appKey = selectedApp === 'custom' ? 'ecommerce' : selectedApp;
    const projectFiles = CODE_ASSETS[appKey];
    if (selectedApp === 'custom' && selectedFile === 'src/App.tsx' && customAppContent) {
      return customAppContent.code;
    }
    if (projectFiles && projectFiles[selectedFile]) {
      return projectFiles[selectedFile];
    }
    // Fallback default codes
    if (selectedFile === 'package.json') {
      return `{
  "name": "pandora-custom-agent-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^19.0.0",
    "lucide-react": "^0.400.0"
  }
}`;
    }
    return `// Empty or unconfigured file path: ${selectedFile}`;
  };

  return (
    <div className="h-full w-full bg-neutral-900 text-neutral-100 flex flex-col lg:flex-row overflow-hidden select-none">
      
      {/* =======================================================================
          LEFT PANEL: COMPOSER & AGENT CONVERSATION
          ======================================================================= */}
      <div className="w-full lg:w-[380px] xl:w-[420px] bg-neutral-955 border-r border-neutral-700 flex flex-col shrink-0">
        
        {/* Agent Header */}
        <div className="px-4 py-3 border-b border-neutral-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Cpu size={16} className="text-indigo-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs text-neutral-100 tracking-tight">Agent 4 Workspace</span>
                <span className="text-[9px] bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-mono px-1.5 py-0.5 rounded-full">v4.0.2</span>
              </div>
              <p className="text-[10px] text-neutral-500">Plan-while-build environment</p>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded-full">
            <span className={`w-1.5 h-1.5 rounded-full ${
              agentStatus === 'idle' ? 'bg-neutral-600' :
              agentStatus === 'thinking' ? 'bg-amber-400 animate-ping' :
              agentStatus === 'building' ? 'bg-indigo-400 animate-pulse' :
              'bg-emerald-400 animate-pulse'
            }`} />
            <span className="text-[9px] uppercase tracking-wider font-mono text-neutral-405">
              {agentStatus}
            </span>
          </div>
        </div>

        {/* Messaging Logs */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {chatMessages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id} className={`flex gap-3 ${isUser ? 'justify-end' : ''}`}>
                {!isUser && (
                  <div className="w-7 h-7 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Cpu size={12} className="text-indigo-400" />
                  </div>
                )}
                
                <div className={`max-w-[85%] space-y-1.5`}>
                  {/* Accordion thoughts for assistant */}
                  {!isUser && msg.thoughts && msg.thoughts.length > 0 && (
                    <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-2.5 space-y-1 font-mono text-[10px] text-neutral-400">
                      <div className="flex items-center gap-1.5 text-neutral-500 font-semibold mb-1 uppercase tracking-wider">
                        <Loader2 size={10} className="animate-spin" />
                        <span>Execution log ({msg.thoughts.length})</span>
                      </div>
                      {msg.thoughts.map((th, index) => (
                        <div key={index} className="flex gap-1.5">
                          <span className="text-neutral-600">&gt;</span>
                          <span className="truncate">{th}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                    isUser
                      ? 'bg-neutral-850 border border-neutral-700 rounded-tr-sm text-neutral-200'
                      : 'bg-neutral-900/40 border border-neutral-850 rounded-tl-sm text-neutral-350'
                  }`}>
                    {msg.content ? (
                      <div className="whitespace-pre-line">{msg.content}</div>
                    ) : (
                      <div className="flex gap-1 py-1">
                        <span className="dot-bounce" />
                        <span className="dot-bounce" />
                        <span className="dot-bounce" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 py-2 border-t border-neutral-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-semibold text-neutral-500 font-mono">Ready Templates</span>
            <span className="text-[9px] text-neutral-600">Click to deploy</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => runAgentPipeline('ecommerce', 'Build E-commerce Sales Dashboard')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-lg text-left text-[10px] text-neutral-400 transition-all cursor-pointer"
            >
              <span>📊 Sales Dashboard</span>
            </button>
            <button
              onClick={() => runAgentPipeline('kanban', 'Create Kanban Scrum Board')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-lg text-left text-[10px] text-neutral-400 transition-all cursor-pointer"
            >
              <span>📋 Kanban Board</span>
            </button>
            <button
              onClick={() => runAgentPipeline('soundboard', 'Deploy Ambient Mixerboard')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-lg text-left text-[10px] text-neutral-400 transition-all cursor-pointer"
            >
              <span>🎛️ Ambient Mixer</span>
            </button>
            <button
              onClick={() => runAgentPipeline('calculator', 'Build Glassmorphism Calculator')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-lg text-left text-[10px] text-neutral-400 transition-all cursor-pointer"
            >
              <span>🧮 Glass Calculator</span>
            </button>
          </div>
        </div>

        {/* Input Form Composer */}
        <div className="p-4 border-t border-neutral-700 bg-neutral-950 shrink-0">
          <div className="relative bg-neutral-905 border border-neutral-700 rounded-xl focus-within:border-neutral-500 transition-all">
            <textarea
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleComposerSubmit();
                }
              }}
              placeholder="Deploy app template or custom component prompt..."
              rows={2}
              className="w-full resize-none bg-transparent px-3.5 pt-3 pb-11 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none leading-relaxed"
            />
            
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button className="p-1 rounded text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800 transition-colors" title="Attach assets">
                  <Paperclip size={12} />
                </button>
                <button
                  onClick={() => setElementSelectorActive(!elementSelectorActive)}
                  className={`p-1 rounded transition-colors ${
                    elementSelectorActive
                      ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20'
                      : 'text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800'
                  }`}
                  title="Element Selector (Inspect Canvas)"
                >
                  <MousePointer size={12} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                {elementSelectorActive && (
                  <span className="text-[9px] text-indigo-400 font-mono animate-pulse">Inspect Active</span>
                )}
                <button
                  onClick={handleComposerSubmit}
                  disabled={!inputVal.trim()}
                  className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  <Send size={11} />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* =======================================================================
          RIGHT PANEL: THE MULTI-TAB WORKSPACE (CANVAS, CODE, TERMINAL)
          ======================================================================= */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-neutral-900">
        
        {/* Workspace Tab Header */}
        <div className="h-11 border-b border-neutral-700 bg-neutral-950/80 px-4 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('canvas')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                activeTab === 'canvas' ? 'bg-neutral-850 text-neutral-100 font-semibold' : 'text-neutral-500 hover:text-neutral-200'
              }`}
            >
              <Eye size={12} />
              <span>Canvas</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                activeTab === 'code' ? 'bg-neutral-850 text-neutral-100 font-semibold' : 'text-neutral-500 hover:text-neutral-200'
              }`}
            >
              <Code2 size={12} />
              <span>Code Editor</span>
            </button>
            <button
              onClick={() => setActiveTab('terminal')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                activeTab === 'terminal' ? 'bg-neutral-855 text-neutral-100 font-semibold' : 'text-neutral-500 hover:text-neutral-200'
              }`}
            >
              <Terminal size={12} />
              <span>Console Logs</span>
            </button>
          </div>

          {/* Right alignment items */}
          <div className="flex items-center gap-3">
            {activeTab === 'canvas' && (
              <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 shrink-0">
                <button
                  onClick={() => setCanvasMode('desktop')}
                  className={`p-1 rounded text-neutral-500 hover:text-neutral-200 ${canvasMode === 'desktop' ? 'bg-neutral-800 text-indigo-400' : ''}`}
                  title="Desktop Preview"
                >
                  <Monitor size={11} />
                </button>
                <button
                  onClick={() => setCanvasMode('tablet')}
                  className={`p-1 rounded text-neutral-500 hover:text-neutral-200 ${canvasMode === 'tablet' ? 'bg-neutral-800 text-indigo-400' : ''}`}
                  title="Tablet Preview"
                >
                  <Tablet size={11} />
                </button>
                <button
                  onClick={() => setCanvasMode('mobile')}
                  className={`p-1 rounded text-neutral-500 hover:text-neutral-200 ${canvasMode === 'mobile' ? 'bg-neutral-800 text-indigo-400' : ''}`}
                  title="Mobile Preview"
                >
                  <Smartphone size={11} />
                </button>
              </div>
            )}
            
            {/* Live Reload indicator */}
            <div className="flex items-center gap-1 text-[10px] text-neutral-550 font-mono">
              <RefreshCw size={9} className="animate-spin text-indigo-400" />
              <span>HMR Connected</span>
            </div>
          </div>
        </div>

        {/* Tab Contents Frame */}
        <div className="flex-1 overflow-hidden relative">
          
          {/* ===================================================================
              TAB 1: VISUAL CANVAS
              =================================================================== */}
          <AnimatePresence mode="wait">
            {activeTab === 'canvas' && (
              <motion.div
                key="canvas"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full w-full p-4 flex flex-col items-center justify-start overflow-y-auto"
              >
                
                {/* Simulated browser wrapper */}
                <div className={`border border-neutral-700 bg-neutral-950 rounded-2xl flex flex-col shadow-xl transition-all duration-300 ${
                  canvasMode === 'desktop' ? 'w-full h-full' :
                  canvasMode === 'tablet' ? 'w-[700px] h-[550px]' :
                  'w-[360px] h-[600px]'
                }`}>
                  
                  {/* Browser Address Bar */}
                  <div className="h-9 bg-neutral-905 border-b border-neutral-800 px-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                    </div>
                    
                    <div className="w-[60%] sm:w-[45%] h-5.5 bg-neutral-950 border border-neutral-800 rounded-md px-3 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-neutral-500 select-none">
                        http://localhost:3000/
                      </span>
                      <RotateCcw size={8} className="text-neutral-600 cursor-pointer hover:text-neutral-400" />
                    </div>

                    <div className="w-4" /> {/* Spacer */}
                  </div>

                  {/* Browser Canvas Content Frame */}
                  <div className="flex-1 overflow-auto relative bg-neutral-900 text-neutral-200">
                    
                    {/* Elements selection hover layers overlay */}
                    {elementSelectorActive && (
                      <div className="absolute inset-0 bg-indigo-500/5 z-20 pointer-events-none border border-indigo-500/20" />
                    )}

                    {/* App state switcher */}
                    {agentStatus === 'building' ? (
                      /* Compiling loading frame */
                      <div className="absolute inset-0 bg-neutral-955 flex flex-col items-center justify-center space-y-4">
                        <Loader2 size={32} className="text-indigo-500 animate-spin" />
                        <div className="text-center space-y-1">
                          <p className="text-xs font-semibold text-neutral-350">Compiling Workspace Assets...</p>
                          <p className="text-[10px] text-neutral-600 font-mono">vite v6.0.5 building client</p>
                        </div>
                      </div>
                    ) : selectedApp === 'ecommerce' ? (
                      // --------------------------------------------------------
                      // VIEW A: E-COMMERCE DASHBOARD
                      // --------------------------------------------------------
                      <div className="p-6 space-y-6">
                        
                        {/* Selector Area: Header */}
                        <div
                          onMouseEnter={() => setHoveredElement('Store Operations Header')}
                          onMouseLeave={() => setHoveredElement(null)}
                          onClick={() => handleCanvasElementClick('Store Operations Header')}
                          className={`relative transition-all ${
                            elementSelectorActive ? 'cursor-crosshair border border-dashed border-indigo-500/60 bg-indigo-500/5 p-2 rounded-lg' : ''
                          }`}
                        >
                          {elementSelectorActive && hoveredElement === 'Store Operations Header' && (
                            <span className="absolute top-0 right-0 text-[8px] bg-indigo-600 text-white font-mono px-1 rounded">Header</span>
                          )}
                          <div className="flex justify-between items-start">
                            <div>
                              <h1 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                                <Sparkles size={16} className="text-indigo-400" />
                                Apex Store Dashboard
                              </h1>
                              <p className="text-xs text-neutral-505">Live operational & conversion intelligence</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={ecommerceFilter}
                                onChange={e => setEcommerceFilter(e.target.value)}
                                className="bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-[10px] text-neutral-450 focus:outline-none"
                              >
                                <option value="all">All Channels</option>
                                <option value="direct">Direct Traffic</option>
                                <option value="referral">Referrals</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Selector Area: Stats Cards Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { name: 'Revenue Metrics', label: 'Gross Revenue', value: '$48,259.00', change: '+12.3%', up: true },
                            { name: 'Order Metrics', label: 'Completed Orders', value: '1,840', change: '-3.1%', up: false },
                            { name: 'Conversion Rate Card', label: 'Conversion Rate', value: '2.48%', change: '+0.8%', up: true },
                            { name: 'Visitor Metrics', label: 'Active Sessions', value: '142', change: '+15.2%', up: true }
                          ].map((card, idx) => (
                            <div
                              key={idx}
                              onMouseEnter={() => setHoveredElement(card.name)}
                              onMouseLeave={() => setHoveredElement(null)}
                              onClick={() => handleCanvasElementClick(card.name)}
                              className={`relative p-4 bg-neutral-955 border border-neutral-800 rounded-xl space-y-1.5 transition-all ${
                                elementSelectorActive ? 'cursor-crosshair border-dashed border-indigo-500/60 bg-indigo-500/5 hover:scale-[1.01]' : ''
                              }`}
                            >
                              {elementSelectorActive && hoveredElement === card.name && (
                                <span className="absolute top-0 right-0 text-[8px] bg-indigo-600 text-white font-mono px-1 rounded">{card.name}</span>
                              )}
                              <span className="text-[10px] uppercase font-semibold tracking-wider text-neutral-500 font-mono">{card.label}</span>
                              <div className="flex justify-between items-baseline">
                                <span className="text-base font-bold text-neutral-100">{card.value}</span>
                                <span className={`text-[9px] font-mono ${card.up ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {card.change}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Chart and Activity details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          
                          {/* Selector Area: SVG Chart */}
                          <div
                            onMouseEnter={() => setHoveredElement('Revenue Charts')}
                            onMouseLeave={() => setHoveredElement(null)}
                            onClick={() => handleCanvasElementClick('Revenue Charts')}
                            className={`md:col-span-2 relative p-4 bg-neutral-955 border border-neutral-800 rounded-xl space-y-3 transition-all ${
                              elementSelectorActive ? 'cursor-crosshair border border-dashed border-indigo-500/60 bg-indigo-500/5' : ''
                            }`}
                          >
                            {elementSelectorActive && hoveredElement === 'Revenue Charts' && (
                              <span className="absolute top-0 right-0 text-[8px] bg-indigo-600 text-white font-mono px-1 rounded">Chart Card</span>
                            )}
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-semibold text-neutral-200">Revenue Performance</span>
                              <span className="text-[9px] text-neutral-550 font-mono">Jan - Jun (H1)</span>
                            </div>
                            
                            {/* Simulated SVG Bar chart */}
                            <div className="h-32 flex items-end justify-between px-2 pt-6">
                              {[35, 55, 45, 75, 65, 88].map((val, i) => (
                                <div key={i} className="flex flex-col items-center gap-1.5 w-[12%]">
                                  <div className="w-full bg-neutral-800/80 rounded-t-md h-24 flex items-end">
                                    <div
                                      className="w-full bg-indigo-600 rounded-t-md hover:bg-indigo-500 transition-all duration-305"
                                      style={{ height: `${val}%` }}
                                    />
                                  </div>
                                  <span className="text-[9px] font-mono text-neutral-600">
                                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i]}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Selector Area: Recent Logs / Table */}
                          <div
                            onMouseEnter={() => setHoveredElement('Orders Feed')}
                            onMouseLeave={() => setHoveredElement(null)}
                            onClick={() => handleCanvasElementClick('Orders Feed')}
                            className={`relative p-4 bg-neutral-955 border border-neutral-800 rounded-xl space-y-3 transition-all ${
                              elementSelectorActive ? 'cursor-crosshair border border-dashed border-indigo-500/60 bg-indigo-500/5' : ''
                            }`}
                          >
                            {elementSelectorActive && hoveredElement === 'Orders Feed' && (
                              <span className="absolute top-0 right-0 text-[8px] bg-indigo-600 text-white font-mono px-1 rounded">Feed</span>
                            )}
                            <span className="text-xs font-semibold text-neutral-200">Recent Orders</span>
                            <div className="space-y-2 text-[11px]">
                              {[
                                { user: 'Alice Vance', item: 'DeepSeek API', price: '$29.00', status: 'Success' },
                                { user: 'Kev Miller', item: 'Pandora Pro', price: '$49.00', status: 'Pending' },
                                { user: 'Sarah Bell', item: 'Llama 3.1 70B', price: '$12.50', status: 'Success' }
                              ].map((order, i) => (
                                <div key={i} className="flex justify-between items-center py-1.5 border-b border-neutral-850">
                                  <div>
                                    <p className="font-medium text-neutral-300">{order.user}</p>
                                    <p className="text-[9px] text-neutral-650">{order.item}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-neutral-350">{order.price}</p>
                                    <span className={`text-[8px] font-mono ${order.status === 'Success' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                      {order.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>

                      </div>
                    ) : selectedApp === 'kanban' ? (
                      // --------------------------------------------------------
                      // VIEW B: KANBAN BOARD
                      // --------------------------------------------------------
                      <div className="p-6 space-y-6 h-full flex flex-col">
                        
                        {/* Board Header */}
                        <div className="flex justify-between items-center shrink-0">
                          <div>
                            <h1 className="text-lg font-bold text-neutral-101">Project Planner</h1>
                            <p className="text-xs text-neutral-500">Add tasks and click arrows to simulate pipeline states</p>
                          </div>
                          
                          <button
                            onClick={() => setKanbanModalOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <Plus size={13} />
                            <span>Add Task</span>
                          </button>
                        </div>

                        {/* Kanban Columns Grid */}
                        <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
                          {['todo', 'progress', 'done'].map((columnKey) => {
                            const columnTasks = kanbanTasks.filter(t => t.col === columnKey);
                            const columnTitle = columnKey === 'todo' ? 'To Do' :
                                                 columnKey === 'progress' ? 'In Progress' : 'Completed';
                            const badgeColor = columnKey === 'todo' ? 'bg-neutral-800 text-neutral-400' :
                                               columnKey === 'progress' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20' :
                                               'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20';

                            return (
                              <div
                                key={columnKey}
                                onMouseEnter={() => setHoveredElement(`${columnTitle} Column`)}
                                onMouseLeave={() => setHoveredElement(null)}
                                onClick={() => handleCanvasElementClick(`${columnTitle} Column`)}
                                className={`relative bg-neutral-955 border border-neutral-800 rounded-xl p-3 flex flex-col space-y-3 transition-all ${
                                  elementSelectorActive ? 'cursor-crosshair border border-dashed border-indigo-500/60 bg-indigo-500/5' : ''
                                }`}
                              >
                                {elementSelectorActive && hoveredElement === `${columnTitle} Column` && (
                                  <span className="absolute top-0 right-0 text-[8px] bg-indigo-600 text-white font-mono px-1 rounded">Column</span>
                                )}
                                
                                <div className="flex justify-between items-center shrink-0">
                                  <span className="text-xs font-semibold text-neutral-250">{columnTitle}</span>
                                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${badgeColor}`}>
                                    {columnTasks.length}
                                  </span>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-2 min-h-[250px]">
                                  {columnTasks.map((task) => (
                                    <div key={task.id} className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg space-y-2 group/task relative">
                                      <div className="flex justify-between items-start">
                                        <span className={`text-[8px] font-mono font-semibold px-1 rounded ${
                                          task.priority === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/25' :
                                          task.priority === 'Medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/25' :
                                          'bg-blue-500/20 text-blue-400 border border-blue-500/25'
                                        }`}>{task.priority}</span>
                                        <button
                                          onClick={() => handleDeleteKanban(task.id)}
                                          className="opacity-0 group-hover/task:opacity-100 text-neutral-500 hover:text-red-400 transition-opacity p-0.5"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      </div>
                                      
                                      <div className="space-y-1">
                                        <h4 className="text-xs font-medium text-neutral-200">{task.title}</h4>
                                        <p className="text-[10px] text-neutral-550 line-clamp-2">{task.desc}</p>
                                      </div>

                                      {/* Simulating Kanban Shift arrows */}
                                      <div className="flex justify-end gap-1 pt-1.5 border-t border-neutral-850">
                                        {columnKey !== 'todo' && (
                                          <button
                                            onClick={() => handleMoveKanban(task.id, 'left')}
                                            className="p-1 bg-neutral-950 hover:bg-neutral-800 rounded text-neutral-400 hover:text-neutral-200 cursor-pointer"
                                          >
                                            &larr;
                                          </button>
                                        )}
                                        {columnKey !== 'done' && (
                                          <button
                                            onClick={() => handleMoveKanban(task.id, 'right')}
                                            className="p-1 bg-neutral-950 hover:bg-neutral-800 rounded text-neutral-400 hover:text-neutral-200 cursor-pointer"
                                          >
                                            &rarr;
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                      </div>
                    ) : selectedApp === 'soundboard' ? (
                      // --------------------------------------------------------
                      // VIEW C: AMBIENT SOUNDBOARD
                      // --------------------------------------------------------
                      <div className="p-6 space-y-6 h-full flex flex-col justify-between">
                        
                        <div>
                          <h1 className="text-lg font-bold text-neutral-101 flex items-center gap-2">
                            <Music size={18} className="text-indigo-400 animate-pulse" />
                            Ambient Studio Mixer
                          </h1>
                          <p className="text-xs text-neutral-500">Synthesize loops and verify volume output signals</p>
                        </div>

                        {/* Interactive mixer panels */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
                          {[
                            { id: 'lofi', label: 'Lo-Fi Lounge Beats', desc: 'Chill hiphop chords and percussion' },
                            { id: 'synth', label: 'Cyberpunk Synthwave', desc: 'Retro-futuristic analog baseline' },
                            { id: 'rain', label: 'Storm & Heavy Rain', desc: 'Relaxing environmental white noise' },
                            { id: 'club', label: 'Club Electro Bass', desc: 'High energy electronic house synthesizer' }
                          ].map((track) => (
                            <div
                              key={track.id}
                              onMouseEnter={() => setHoveredElement(track.label)}
                              onMouseLeave={() => setHoveredElement(null)}
                              onClick={() => handleCanvasElementClick(track.label)}
                              className={`relative p-4 bg-neutral-955 border border-neutral-850 rounded-2xl flex items-center justify-between gap-4 transition-all ${
                                elementSelectorActive ? 'cursor-crosshair border border-dashed border-indigo-500/60 bg-indigo-500/5' : ''
                              } ${activeSound === track.id ? 'border-indigo-500/40 bg-indigo-500/2' : ''}`}
                            >
                              {elementSelectorActive && hoveredElement === track.label && (
                                <span className="absolute top-0 right-0 text-[8px] bg-indigo-600 text-white font-mono px-1 rounded">Sound Card</span>
                              )}
                              
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-semibold text-neutral-200 block truncate">{track.label}</span>
                                <span className="text-[10px] text-neutral-600 truncate block mt-0.5">{track.desc}</span>
                              </div>

                              <button
                                onClick={() => setActiveSound(activeSound === track.id ? null : track.id)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                                  activeSound === track.id ? 'bg-indigo-600 text-white scale-[1.05]' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                                }`}
                              >
                                {activeSound === track.id ? <Square size={11} fill="white" /> : <Play size={11} className="translate-x-0.5" />}
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Glow Oscillations waveforms */}
                        <div
                          onMouseEnter={() => setHoveredElement('Mixer Sliders')}
                          onMouseLeave={() => setHoveredElement(null)}
                          onClick={() => handleCanvasElementClick('Mixer Sliders')}
                          className={`relative p-4 bg-neutral-955 border border-neutral-800 rounded-xl space-y-4 transition-all ${
                            elementSelectorActive ? 'cursor-crosshair border border-dashed border-indigo-500/60 bg-indigo-500/5' : ''
                          }`}
                        >
                          {elementSelectorActive && hoveredElement === 'Mixer Sliders' && (
                            <span className="absolute top-0 right-0 text-[8px] bg-indigo-600 text-white font-mono px-1 rounded">Sliders Panel</span>
                          )}
                          <div className="flex justify-between items-center shrink-0">
                            <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1">
                              <Sliders size={12} />
                              Mixing Console
                            </span>
                            {activeSound && (
                              <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                Oscillators active
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-[10px] text-neutral-500 font-mono">
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span>Master</span>
                                <span>{synthVolume}%</span>
                              </div>
                              <input
                                type="range"
                                min="0" max="100"
                                value={synthVolume}
                                onChange={e => setSynthVolume(Number(e.target.value))}
                                className="w-full accent-indigo-500 cursor-pointer"
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span>Bass Boost</span>
                                <span>{bassLevel}%</span>
                              </div>
                              <input
                                type="range"
                                min="0" max="100"
                                value={bassLevel}
                                onChange={e => setBassLevel(Number(e.target.value))}
                                className="w-full accent-indigo-500 cursor-pointer"
                              />
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span>Reverb Space</span>
                                <span>{reverbLevel}%</span>
                              </div>
                              <input
                                type="range"
                                min="0" max="100"
                                value={reverbLevel}
                                onChange={e => setReverbLevel(Number(e.target.value))}
                                className="w-full accent-indigo-500 cursor-pointer"
                              />
                            </div>
                          </div>

                          {/* Sound wave diagram visualizer */}
                          <div className="h-10 bg-neutral-950 border border-neutral-900 rounded-lg flex items-center justify-center overflow-hidden gap-0.5 px-3">
                            {Array.from({ length: 30 }).map((_, i) => {
                              const heightVal = activeSound ? Math.sin((i + waveSpeed) * 0.8) * 16 + 18 : 3;
                              return (
                                <div
                                  key={i}
                                  className="w-1 bg-indigo-500/80 rounded transition-all duration-150"
                                  style={{ height: `${Math.max(3, heightVal)}px` }}
                                />
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    ) : selectedApp === 'calculator' ? (
                      // --------------------------------------------------------
                      // VIEW D: GLASSMORPHISM CALCULATOR
                      // --------------------------------------------------------
                      <div className="p-6 h-full flex flex-col justify-between">
                        
                        <div className="shrink-0 flex justify-between items-center">
                          <div>
                            <h1 className="text-lg font-bold text-neutral-101">Micro Calculator</h1>
                            <p className="text-[10px] text-neutral-500">Translucent glass widgets with layout memory</p>
                          </div>
                          
                          {/* Theme buttons */}
                          <div className="flex bg-neutral-955 border border-neutral-850 p-0.5 rounded-lg text-[9px] font-mono">
                            <button
                              onClick={() => setCalcTheme('glass-dark')}
                              className={`px-2 py-1 rounded cursor-pointer ${calcTheme === 'glass-dark' ? 'bg-neutral-800 text-indigo-400' : 'text-neutral-500'}`}
                            >
                              Dark
                            </button>
                            <button
                              onClick={() => setCalcTheme('glass-light')}
                              className={`px-2 py-1 rounded cursor-pointer ${calcTheme === 'glass-light' ? 'bg-neutral-800 text-indigo-400' : 'text-neutral-500'}`}
                            >
                              Light
                            </button>
                          </div>
                        </div>

                        <div className="flex-1 flex gap-6 items-center justify-center py-4">
                          
                          {/* Calculator Body Frame */}
                          <div
                            onMouseEnter={() => setHoveredElement('Calculator Body')}
                            onMouseLeave={() => setHoveredElement(null)}
                            onClick={() => handleCanvasElementClick('Calculator Body')}
                            className={`w-64 relative rounded-3xl p-5 backdrop-blur-md shadow-2xl transition-all border ${
                              calcTheme === 'glass-dark' ? 'bg-neutral-955/95 border-neutral-800/80 text-white' : 'bg-white/90 border-neutral-200 text-neutral-900 shadow-neutral-200/50'
                            } ${
                              elementSelectorActive ? 'cursor-crosshair border border-dashed border-indigo-500/80 bg-indigo-500/5' : ''
                            }`}
                          >
                            {elementSelectorActive && hoveredElement === 'Calculator Body' && (
                              <span className="absolute top-0 right-0 text-[8px] bg-indigo-600 text-white font-mono px-1 rounded">Widget Card</span>
                            )}

                            {/* Display Screen */}
                            <div className="h-14 flex items-end justify-end px-3 py-2 bg-neutral-900/10 rounded-xl mb-4 border border-neutral-500/5 text-right font-mono">
                              <span className="text-xl font-semibold select-all tracking-tight truncate">{calcDisplay}</span>
                            </div>

                            {/* Keypad Grid */}
                            <div className="grid grid-cols-4 gap-2 text-xs font-mono">
                              {['7', '8', '9', '÷', '4', '5', '6', 'x', '1', '2', '3', '-', 'C', '0', '=', '+'].map((btn) => {
                                const isOp = ['÷', 'x', '-', '+', '='].includes(btn);
                                const isC = btn === 'C';
                                
                                return (
                                  <button
                                    key={btn}
                                    onClick={() => handleCalcClick(btn)}
                                    className={`h-10 rounded-xl font-bold transition-all cursor-pointer ${
                                      isC ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' :
                                      isOp ? 'bg-indigo-600 text-white hover:bg-indigo-700' :
                                      calcTheme === 'glass-dark' ? 'bg-neutral-900/60 hover:bg-neutral-800/60 text-neutral-200' : 'bg-neutral-105 hover:bg-neutral-200 text-neutral-800'
                                    }`}
                                  >
                                    {btn}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Calculations history */}
                          <div className="hidden sm:block w-48 space-y-3 font-mono text-[10px] text-neutral-550 self-stretch">
                            <span className="font-semibold uppercase tracking-wider block border-b border-neutral-850 pb-1.5">Tape History</span>
                            {calcHistory.length === 0 ? (
                              <div className="py-4 text-center text-neutral-600">Tape clear.</div>
                            ) : (
                              <div className="space-y-1.5 font-medium">
                                {calcHistory.map((item, index) => (
                                  <div key={index} className="flex justify-between items-center py-1 border-b border-neutral-850/50">
                                    <span className="text-neutral-650">&gt;</span>
                                    <span>{item}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                        </div>

                      </div>
                    ) : (
                      // --------------------------------------------------------
                      // VIEW E: CUSTOM AI GENERATED APP PREVIEW
                      // --------------------------------------------------------
                      <div className="p-8 h-full flex flex-col justify-between">
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                              <Sparkles size={13} className="text-indigo-400 animate-pulse" />
                            </div>
                            <h1 className="text-base font-bold text-neutral-101">
                              {customAppContent?.title || 'Custom Application'}
                            </h1>
                          </div>
                          
                          <p className="text-xs text-neutral-450 leading-relaxed max-w-2xl bg-neutral-950 p-4 border border-neutral-850 rounded-xl">
                            {customAppContent?.desc || 'Simulating build processes...'}
                          </p>
                        </div>

                        {/* Mock element inspector details */}
                        <div
                          onMouseEnter={() => setHoveredElement('Custom Code Element')}
                          onMouseLeave={() => setHoveredElement(null)}
                          onClick={() => handleCanvasElementClick('Custom Code Element')}
                          className={`relative p-8 bg-neutral-955 border border-neutral-800 rounded-2xl flex flex-col items-center justify-center space-y-4 text-center my-6 flex-1 min-h-[180px] transition-all ${
                            elementSelectorActive ? 'cursor-crosshair border border-dashed border-indigo-500/60 bg-indigo-500/5' : ''
                          }`}
                        >
                          {elementSelectorActive && hoveredElement === 'Custom Code Element' && (
                            <span className="absolute top-0 right-0 text-[8px] bg-indigo-600 text-white font-mono px-1 rounded">Component Container</span>
                          )}
                          <Code2 size={24} className="text-neutral-600" />
                          <div className="space-y-1">
                            <h4 className="text-xs font-semibold text-neutral-300">Custom Component sandbox</h4>
                            <p className="text-[11px] text-neutral-600">The LLM successfully compiled your custom UI parameters.</p>
                          </div>
                          <button
                            onClick={() => setActiveTab('code')}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-semibold underline"
                          >
                            Inspect generated JSX code <ArrowUpRight size={10} />
                          </button>
                        </div>

                        <div className="shrink-0 flex items-center justify-between border-t border-neutral-800/80 pt-4">
                          <span className="text-[10px] text-neutral-550 font-mono">Dev server port: 3000</span>
                          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                            <CheckCircle2 size={11} /> Running OK
                          </span>
                        </div>

                      </div>
                    )}

                  </div>

                </div>

              </motion.div>
            )}
          </AnimatePresence>

          {/* ===================================================================
              TAB 2: SYNTAX CODE EDITOR
              =================================================================== */}
          <AnimatePresence mode="wait">
            {activeTab === 'code' && (
              <motion.div
                key="code"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full w-full flex overflow-hidden border-t border-neutral-800"
              >
                
                {/* File Tree Sidebar */}
                <div className="w-48 bg-neutral-950 border-r border-neutral-800 flex flex-col select-none text-[11px]">
                  <div className="p-3 border-b border-neutral-800 flex items-center gap-1.5 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                    <FolderOpen size={11} />
                    <span>Workspace File Tree</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-2 space-y-0.5 text-xs">
                    {[
                      { path: 'package.json', icon: FileText },
                      { path: 'index.html', icon: FileText },
                      { path: 'src/main.tsx', icon: Code2 },
                      { path: 'src/App.tsx', icon: Code2 },
                      { path: 'src/index.css', icon: FileText }
                    ].map((file) => {
                      const Icon = file.icon;
                      const isSelected = selectedFile === file.path;
                      
                      return (
                        <button
                          key={file.path}
                          onClick={() => setSelectedFile(file.path)}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                            isSelected ? 'bg-neutral-800 text-indigo-400 font-medium' : 'text-neutral-500 hover:text-neutral-350 hover:bg-neutral-900/60'
                          }`}
                        >
                          <Icon size={12} />
                          <span className="truncate">{file.path}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Editor code panels */}
                <div className="flex-1 flex flex-col overflow-hidden bg-[#0f172a]">
                  
                  {/* File title controls */}
                  <div className="h-8 bg-neutral-950 border-b border-neutral-800 px-4 flex items-center justify-between shrink-0 select-none text-[10px] font-mono text-neutral-500">
                    <span>{selectedFile}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(getFileContent());
                        // Add temporary logs
                        setTerminalLogs(prev => [...prev, ` [38;5;244m[system] [0m Copied file context: ${selectedFile}`]);
                      }}
                      className="flex items-center gap-1 hover:text-neutral-200 transition-colors"
                    >
                      <Copy size={10} /> Copy Code
                    </button>
                  </div>

                  {/* Code viewport */}
                  <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-350">
                    <pre className="flex">
                      <code className="text-slate-650 pr-4 select-none text-right border-r border-slate-800/80 mr-4 shrink-0 font-medium">
                        {Array.from({ length: getFileContent().split('\n').length }).map((_, i) => (
                          <div key={i}>{i + 1}</div>
                        ))}
                      </code>
                      <code className="flex-1 select-text overflow-x-auto whitespace-pre font-medium">
                        {getFileContent()}
                      </code>
                    </pre>
                  </div>

                </div>

              </motion.div>
            )}
          </AnimatePresence>

          {/* ===================================================================
              TAB 3: TERMINAL LOGS
              =================================================================== */}
          <AnimatePresence mode="wait">
            {activeTab === 'terminal' && (
              <motion.div
                key="terminal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full w-full bg-neutral-950 p-4 font-mono text-xs overflow-y-auto space-y-1 text-neutral-300 flex flex-col justify-start"
              >
                
                <div className="flex-1 space-y-1 select-text">
                  {terminalLogs.map((log, index) => {
                    // Simple replacement of ANSI escape colors for custom web formatting
                    let cleanedLog = log
                      .replace(/ \[38;5;244m/g, '<span class="text-neutral-500">')
                      .replace(/ \[38;5;81m/g, '<span class="text-sky-400">')
                      .replace(/ \[38;5;121m/g, '<span class="text-emerald-400">')
                      .replace(/ \[38;5;208m/g, '<span class="text-orange-400">')
                      .replace(/ \[0m/g, '</span>');

                    return (
                      <div
                        key={index}
                        className="leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: cleanedLog }}
                      />
                    );
                  })}
                  <div ref={terminalEndRef} />
                </div>

                <div className="h-6 shrink-0 border-t border-neutral-900 pt-2 flex items-center justify-between text-[10px] text-neutral-550 select-none">
                  <span>Terminal buffer active</span>
                  <button
                    onClick={() => setTerminalLogs([' [38;5;244m[system] [0m Console logs cleared.'])}
                    className="hover:text-neutral-350 transition-colors"
                  >
                    Clear Terminal
                  </button>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

      {/* =======================================================================
          MODAL COMPONENT: ADD KANBAN TASK
          ======================================================================= */}
      <AnimatePresence>
        {kanbanModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-955 border border-neutral-700 w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-neutral-100">Add Board Task</span>
                <button
                  onClick={() => setKanbanModalOpen(false)}
                  className="p-1 rounded hover:bg-neutral-900 text-neutral-500 hover:text-neutral-350 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-550 font-mono">Task Title</label>
                  <input
                    type="text"
                    value={newKanbanTitle}
                    onChange={e => setNewKanbanTitle(e.target.value)}
                    placeholder="Enter short title..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-550 font-mono">Description</label>
                  <textarea
                    value={newKanbanDesc}
                    onChange={e => setNewKanbanDesc(e.target.value)}
                    placeholder="Provide details..."
                    rows={2}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-650 focus:outline-none focus:border-neutral-600 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-neutral-550 font-mono">Column</label>
                    <select
                      value={newKanbanCol}
                      onChange={e => setNewKanbanCol(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none"
                    >
                      <option value="todo">To Do</option>
                      <option value="progress">In Progress</option>
                      <option value="done">Completed</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-neutral-550 font-mono">Priority</label>
                    <select
                      value={newKanbanPriority}
                      onChange={e => setNewKanbanPriority(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs font-semibold">
                <button
                  onClick={() => setKanbanModalOpen(false)}
                  className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddKanbanTask}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer"
                >
                  Add Task
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
