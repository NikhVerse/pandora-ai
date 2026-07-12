import { useState, useRef } from 'react';
import { Play, Square, RotateCcw, Copy, Check, Braces, Sliders, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../utils/supabaseClient';
import { useAppStore } from '../store/useAppStore';

function Slider({ label, value, min, max, step, hint, onChange }: {
  label: string; value: number; min: number; max: number; step: number; hint: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-neutral-300">{label}</p>
          <p className="text-[10px] text-neutral-600 mt-0.5">{hint}</p>
        </div>
        <span className="text-xs font-mono text-neutral-200 bg-neutral-800 px-2 py-0.5 rounded-md border border-neutral-700 min-w-[3rem] text-center">
          {step < 1 ? value.toFixed(2) : value}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-neutral-700 accent-indigo-600 cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-neutral-600 font-mono">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

export default function PlaygroundPage() {
  const { supportedModels } = useAppStore();
  const [model, setModel] = useState(supportedModels[0]?.id || 'accounts/fireworks/models/llama-v3p1-70b-instruct');
  const [modelOpen, setModelOpen] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant.');
  const [userPrompt, setUserPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [jsonMode, setJsonMode] = useState(false);
  const [streaming, setStreaming] = useState(true);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [tokens, setTokens] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const handleRun = async () => {
    if (!userPrompt.trim() || isRunning) return;
    setOutput('');
    setIsRunning(true);
    setLatency(null);
    setTokens(null);
    const start = performance.now();

    let token = 'mock-session-token';
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) token = session.access_token;
    } catch { /* no-op */ }

    const controller = new AbortController();
    abortRef.current = controller;

    const messages = [
      ...(systemPrompt.trim() ? [{ role: 'system', content: systemPrompt }] : []),
      { role: 'user', content: userPrompt },
    ];

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages, temperature, top_p: topP, max_tokens: maxTokens, json_mode: jsonMode, model }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error('API error');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No reader');

      let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setOutput(acc);
      }
      setLatency(Math.round(performance.now() - start));
      setTokens(acc.split(/\s+/).length);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') { setIsRunning(false); return; }
      // Offline mock
      const mock = jsonMode
        ? `{\n  "status": "offline_mock",\n  "model": "${supportedModels.find(m => m.id === model)?.label || 'Unknown Model'}",\n  "message": "Backend offline — this is a simulated response"\n}`
        : `This is a simulated Playground response.\n\nThe backend at **http://localhost:8000** appears to be offline.\n\n**Start it with:**\n\`\`\`bash\ncd apps/backend && uvicorn main:app --reload\n\`\`\``;
      setOutput(mock);
      setLatency(Math.round(performance.now() - start));
      setTokens(mock.split(/\s+/).length);
    }
    setIsRunning(false);
    abortRef.current = null;
  };

  const handleStop = () => { abortRef.current?.abort(); setIsRunning(false); };
  const handleClear = () => { setOutput(''); setLatency(null); setTokens(null); };
  const handleCopy = () => { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="h-full w-full flex overflow-hidden bg-neutral-900">
      {/* Left: Parameters */}
      <aside className="w-72 shrink-0 border-r border-neutral-700 bg-neutral-950 flex flex-col overflow-y-auto">
        <div className="px-4 py-4 border-b border-neutral-700 flex items-center gap-2">
          <Sliders size={14} className="text-neutral-500" />
          <h2 className="text-sm font-semibold text-neutral-200">Parameters</h2>
        </div>

        <div className="flex-1 px-4 py-4 space-y-6">
          {/* Model */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-neutral-300">Model</p>
            <div className="relative">
              <button
                onClick={() => setModelOpen(!modelOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-neutral-700 bg-neutral-900 text-xs text-neutral-300 hover:border-neutral-600 transition-colors cursor-pointer"
              >
                <span className="truncate">{supportedModels.find(m => m.id === model)?.label || 'Select Model'}</span>
                <ChevronDown size={12} className={`transition-transform shrink-0 ${modelOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {modelOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-neutral-900 border border-neutral-700 rounded-lg overflow-hidden z-20 shadow-lg"
                  >
                    {supportedModels.map(m => (
                      <button
                        key={m.id}
                        onClick={() => { setModel(m.id); setModelOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer ${
                          model === m.id ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-500 hover:bg-neutral-800/60 hover:text-neutral-200'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Sliders */}
          <Slider label="Temperature" value={temperature} min={0} max={2} step={0.05} hint="Randomness of output" onChange={setTemperature} />
          <Slider label="Top P" value={topP} min={0} max={1} step={0.05} hint="Nucleus sampling threshold" onChange={setTopP} />
          <Slider label="Max Tokens" value={maxTokens} min={128} max={8192} step={128} hint="Maximum tokens to generate" onChange={setMaxTokens} />

          {/* Toggles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-neutral-300">JSON Mode</p>
                <p className="text-[10px] text-neutral-600">Force structured output</p>
              </div>
              <button
                onClick={() => setJsonMode(!jsonMode)}
                className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${jsonMode ? 'bg-indigo-600' : 'bg-neutral-700'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${jsonMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-neutral-300">Streaming</p>
                <p className="text-[10px] text-neutral-600">Stream tokens as generated</p>
              </div>
              <button
                onClick={() => setStreaming(!streaming)}
                className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${streaming ? 'bg-indigo-600' : 'bg-neutral-700'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${streaming ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>

          {/* System prompt */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-neutral-300">System Prompt</p>
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-300 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 resize-none font-mono leading-relaxed"
            />
          </div>
        </div>
      </aside>

      {/* Right: Prompt + Output */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Prompt input */}
        <div className="shrink-0 border-b border-neutral-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Prompt</p>
            <div className="flex items-center gap-2">
              {isRunning ? (
                <button
                  onClick={handleStop}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 text-xs text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-colors cursor-pointer"
                >
                  <Square size={10} className="fill-current" /> Stop
                </button>
              ) : (
                <button
                  onClick={handleRun}
                  disabled={!userPrompt.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  <Play size={11} /> Run
                  <span className="hidden sm:inline text-indigo-300 ml-1">Ctrl+Enter</span>
                </button>
              )}
            </div>
          </div>
          <textarea
            value={userPrompt}
            onChange={e => setUserPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleRun(); }}
            placeholder="Enter your prompt here..."
            rows={5}
            className="w-full px-3 py-2.5 text-sm bg-neutral-950 border border-neutral-700 rounded-xl text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 resize-none font-mono leading-relaxed transition-colors"
          />
        </div>

        {/* Output */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-neutral-700">
            <div className="flex items-center gap-3">
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Output</p>
              {latency !== null && (
                <span className="text-[10px] font-mono text-neutral-600">{latency}ms · ~{tokens} tokens</span>
              )}
              {isRunning && (
                <span className="flex items-center gap-1 text-[10px] text-indigo-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  Generating...
                </span>
              )}
            </div>
            {output && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleClear}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <RotateCcw size={11} /> Clear
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {output ? (
              jsonMode ? (
                <pre className="text-xs font-mono text-neutral-300 leading-relaxed whitespace-pre-wrap break-words">
                  {output}
                  {isRunning && <span className="streaming-cursor" />}
                </pre>
              ) : (
                <div className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap break-words">
                  {output}
                  {isRunning && <span className="streaming-cursor" />}
                </div>
              )
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center mx-auto">
                    <Braces size={14} className="text-neutral-600" />
                  </div>
                  <p className="text-xs text-neutral-600">Output will appear here after running</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
