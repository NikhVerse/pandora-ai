import { useState } from 'react';
import {
  Plus, Play, Download, Trash2, Check, X, Clock,
  BarChart2, ChevronDown, ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../utils/supabaseClient';

type Category = 'json' | 'accuracy' | 'efficiency' | 'custom';
type Status = 'idle' | 'running' | 'pass' | 'fail';

interface TestCase {
  id: string;
  name: string;
  category: Category;
  prompt: string;
  description: string;
  custom_validator?: string;
}

interface TestResult {
  status: Status;
  output: string;
  latency_ms: number;
  token_count: number;
  error_msg?: string;
}

const SEED_TESTS: TestCase[] = [
  { id: '1', name: 'JSON Schema Output', category: 'json', prompt: 'Return a JSON object with keys: name (string), age (number), active (boolean).', description: 'Validates parseable JSON' },
  { id: '2', name: 'Factual Accuracy', category: 'accuracy', prompt: 'What is the capital of France?', description: 'Must contain "Paris"', custom_validator: 'Paris' },
  { id: '3', name: 'Token Efficiency', category: 'efficiency', prompt: 'Define Python in 3 words.', description: 'Output must be under 60 chars' },
  { id: '4', name: 'Instruction Following', category: 'custom', prompt: 'Say only the word "acknowledged" and nothing else.', description: 'Must contain "acknowledged"', custom_validator: 'acknowledged' },
  { id: '5', name: 'Code Generation', category: 'accuracy', prompt: 'Write a Python function that returns the sum of two numbers.', description: 'Must contain "def"', custom_validator: 'def' },
];

const CATEGORY_COLORS: Record<Category, string> = {
  json: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  accuracy: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  efficiency: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  custom: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function EvaluationPage() {
  const [tests, setTests] = useState<TestCase[]>(SEED_TESTS);
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [running, setRunning] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newTest, setNewTest] = useState<Partial<TestCase>>({ category: 'custom' });

  const getToken = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? 'mock-session-token';
    } catch { return 'mock-session-token'; }
  };

  const runSingle = async (test: TestCase): Promise<TestResult> => {
    const token = await getToken();
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          prompt: test.prompt,
          category: test.category,
          custom_validator: test.custom_validator,
          max_tokens: 256,
          temperature: 0.3,
        }),
      });
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch {
      return {
        status: 'fail',
        output: 'Backend offline — unable to evaluate',
        latency_ms: 0,
        token_count: 0,
        error_msg: 'Backend offline',
      };
    }
  };

  const handleRunAll = async () => {
    setRunning(true);
    for (const test of tests) {
      setResults(prev => ({ ...prev, [test.id]: { status: 'running', output: '', latency_ms: 0, token_count: 0 } }));
      const result = await runSingle(test);
      setResults(prev => ({ ...prev, [test.id]: result }));
    }
    setRunning(false);
  };

  const handleReset = () => setResults({});

  const handleExport = () => {
    const rows = [['Name', 'Category', 'Status', 'Latency (ms)', 'Tokens', 'Output', 'Error']];
    tests.forEach(t => {
      const r = results[t.id];
      rows.push([t.name, t.category, r?.status ?? 'idle', String(r?.latency_ms ?? ''), String(r?.token_count ?? ''), r?.output ?? '', r?.error_msg ?? '']);
    });
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'pandora-evaluation.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddTest = () => {
    if (!newTest.name || !newTest.prompt) return;
    const t: TestCase = {
      id: crypto.randomUUID(),
      name: newTest.name!,
      category: (newTest.category as Category) || 'custom',
      prompt: newTest.prompt!,
      description: newTest.description || '',
      custom_validator: newTest.custom_validator,
    };
    setTests(prev => [...prev, t]);
    setNewTest({ category: 'custom' });
    setShowAdd(false);
  };

  const passed = Object.values(results).filter(r => r.status === 'pass').length;
  const failed = Object.values(results).filter(r => r.status === 'fail').length;
  const ran = passed + failed;
  const accuracy = ran > 0 ? Math.round((passed / ran) * 100) : null;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-neutral-900">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-neutral-700 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-neutral-200">Evaluation Suite</h2>
          <p className="text-xs text-neutral-600 mt-0.5">{tests.length} test cases</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset} className="px-3 py-1.5 rounded-lg text-xs text-neutral-500 hover:text-neutral-200 border border-neutral-700 hover:border-neutral-600 transition-colors cursor-pointer">
            Reset
          </button>
          {ran > 0 && (
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-neutral-200 border border-neutral-700 hover:border-neutral-600 transition-colors cursor-pointer">
              <Download size={12} /> Export CSV
            </button>
          )}
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-neutral-200 border border-neutral-700 hover:border-neutral-600 transition-colors cursor-pointer">
            <Plus size={12} /> Add Test
          </button>
          <button
            onClick={handleRunAll}
            disabled={running}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Play size={11} /> {running ? 'Running...' : 'Run All'}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {ran > 0 && (
        <div className="shrink-0 grid grid-cols-4 divide-x divide-neutral-700 border-b border-neutral-700">
          {[
            { label: 'Total', value: tests.length, color: 'text-neutral-200' },
            { label: 'Passed', value: passed, color: 'text-emerald-400' },
            { label: 'Failed', value: failed, color: 'text-red-400' },
            { label: 'Accuracy', value: `${accuracy}%`, color: accuracy! >= 80 ? 'text-emerald-400' : 'text-amber-400' },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center py-3">
              <span className={`text-lg font-bold ${s.color}`}>{s.value}</span>
              <span className="text-[10px] text-neutral-600 uppercase tracking-wider">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Test list */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        {tests.map(test => {
          const r = results[test.id];
          const isExpanded = expandedId === test.id;
          const StatusIcon = r?.status === 'pass' ? Check : r?.status === 'fail' ? X : r?.status === 'running' ? Clock : BarChart2;
          const statusColor = r?.status === 'pass' ? 'text-emerald-400' : r?.status === 'fail' ? 'text-red-400' : r?.status === 'running' ? 'text-indigo-400' : 'text-neutral-600';

          return (
            <div key={test.id} className="bg-neutral-950 border border-neutral-700 rounded-xl overflow-hidden">
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-neutral-800/30 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : test.id)}
              >
                <StatusIcon size={14} className={`${statusColor} shrink-0 ${r?.status === 'running' ? 'animate-spin' : ''}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-200">{test.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${CATEGORY_COLORS[test.category]}`}>
                      {test.category}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 mt-0.5 truncate">{test.description}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {r?.latency_ms > 0 && (
                    <span className="text-[10px] font-mono text-neutral-600">{r.latency_ms}ms</span>
                  )}
                  <button onClick={e => { e.stopPropagation(); setTests(prev => prev.filter(t => t.id !== test.id)); }} className="p-1 rounded text-neutral-700 hover:text-red-400 transition-colors cursor-pointer">
                    <Trash2 size={12} />
                  </button>
                  {isExpanded ? <ChevronDown size={13} className="text-neutral-600" /> : <ChevronRight size={13} className="text-neutral-600" />}
                </div>
              </div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="border-t border-neutral-700 overflow-hidden"
                  >
                    <div className="px-4 py-3 space-y-2">
                      <div>
                        <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-1">Prompt</p>
                        <p className="text-xs text-neutral-400 font-mono bg-neutral-900 rounded-lg px-3 py-2 border border-neutral-700">{test.prompt}</p>
                      </div>
                      {r?.output && (
                        <div>
                          <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-1">Output</p>
                          <p className="text-xs text-neutral-400 font-mono bg-neutral-900 rounded-lg px-3 py-2 border border-neutral-700 max-h-32 overflow-y-auto whitespace-pre-wrap">{r.output}</p>
                        </div>
                      )}
                      {r?.error_msg && (
                        <p className="text-xs text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">{r.error_msg}</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Add Test Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-neutral-950 border border-neutral-700 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-200">Add Test Case</h3>
                <button onClick={() => setShowAdd(false)} className="text-neutral-600 hover:text-neutral-300 cursor-pointer"><X size={15} /></button>
              </div>

              {[
                { label: 'Name', key: 'name', type: 'input', placeholder: 'Test case name' },
                { label: 'Prompt', key: 'prompt', type: 'textarea', placeholder: 'Enter prompt...' },
                { label: 'Description', key: 'description', type: 'input', placeholder: 'Validation rule description' },
                { label: 'Expected substring (optional)', key: 'custom_validator', type: 'input', placeholder: 'e.g. "hello"' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key} className="space-y-1">
                  <p className="text-xs font-medium text-neutral-400">{label}</p>
                  {type === 'textarea' ? (
                    <textarea rows={3} placeholder={placeholder} value={(newTest as Record<string, string>)[key] ?? ''} onChange={e => setNewTest(p => ({ ...p, [key]: e.target.value }))} className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-300 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 resize-none" />
                  ) : (
                    <input type="text" placeholder={placeholder} value={(newTest as Record<string, string>)[key] ?? ''} onChange={e => setNewTest(p => ({ ...p, [key]: e.target.value }))} className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-300 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600" />
                  )}
                </div>
              ))}

              <div className="space-y-1">
                <p className="text-xs font-medium text-neutral-400">Category</p>
                <div className="flex gap-2 flex-wrap">
                  {(['json', 'accuracy', 'efficiency', 'custom'] as Category[]).map(c => (
                    <button key={c} onClick={() => setNewTest(p => ({ ...p, category: c }))} className={`px-2.5 py-1 rounded-full text-[11px] border font-medium transition-colors cursor-pointer ${newTest.category === c ? CATEGORY_COLORS[c] : 'text-neutral-600 border-neutral-700 hover:border-neutral-600'}`}>{c}</button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-lg border border-neutral-700 text-xs text-neutral-500 hover:text-neutral-200 hover:border-neutral-600 transition-colors cursor-pointer">Cancel</button>
                <button onClick={handleAddTest} disabled={!newTest.name || !newTest.prompt} className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors disabled:opacity-30 cursor-pointer">Add Test</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
