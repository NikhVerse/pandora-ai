import { useState } from 'react';
import {
  Sliders,
  User,
  Save,
  RotateCcw,
  CheckCircle2,
  Cpu,
  Braces,
  Shield,
  Keyboard,
  ChevronRight,
  AlertCircle,
  LogOut,
  Info,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';

type Tab = 'model' | 'profile' | 'shortcuts' | 'about';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'model', label: 'Model', icon: <Sliders size={15} /> },
  { id: 'profile', label: 'Profile', icon: <User size={15} /> },
  { id: 'shortcuts', label: 'Shortcuts', icon: <Keyboard size={15} /> },
  { id: 'about', label: 'About', icon: <Info size={15} /> },
];

const MODELS = [
  { id: 'accounts/fireworks/models/llama-v3p1-70b-instruct', label: 'Llama 3.1 70B', provider: 'Fireworks AI', recommended: true },
  { id: 'accounts/fireworks/models/llama-v3p1-8b-instruct', label: 'Llama 3.1 8B', provider: 'Fireworks AI', recommended: false },
  { id: 'accounts/fireworks/models/deepseek-v3', label: 'DeepSeek V3', provider: 'Fireworks AI', recommended: false },
  { id: 'accounts/fireworks/models/mixtral-8x7b-instruct', label: 'Mixtral 8x7B', provider: 'Fireworks AI', recommended: false },
  { id: 'accounts/fireworks/models/qwen2p5-72b-instruct', label: 'Qwen 2.5 72B', provider: 'Fireworks AI', recommended: false },
];


function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center px-2 py-1 rounded-md border border-neutral-700 bg-neutral-900 text-[10px] font-mono text-neutral-400 shadow-sm">
      {children}
    </kbd>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[10px] uppercase tracking-widest font-semibold text-neutral-500 mb-4">
      {children}
    </h2>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-neutral-800 last:border-b-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-200">{label}</p>
        {description && <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const {
    user,
    temperature, setTemperature,
    topP, setTopP,
    maxTokens, setMaxTokens,
    systemPrompt, setSystemPrompt,
  } = useAppStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('model');

  // Local draft state — uncommitted until Save is clicked
  const [localTemp, setLocalTemp] = useState(temperature);
  const [localTopP, setLocalTopP] = useState(topP);
  const [localMaxTokens, setLocalMaxTokens] = useState(maxTokens);
  const [localPrompt, setLocalPrompt] = useState(systemPrompt);
  const [localModel, setLocalModel] = useState(MODELS[0].id);
  const [localJsonMode, setLocalJsonMode] = useState(false);

  const [saved, setSaved] = useState(false);

  const isDirty =
    localTemp !== temperature ||
    localTopP !== topP ||
    localMaxTokens !== maxTokens ||
    localPrompt !== systemPrompt;

  const handleSave = () => {
    setTemperature(localTemp);
    setTopP(localTopP);
    setMaxTokens(localMaxTokens);
    setSystemPrompt(localPrompt);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    const defaults = {
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 2048,
      systemPrompt: 'You are Pandora, a helpful assistant powered by Fireworks AI.',
    };
    setLocalTemp(defaults.temperature);
    setLocalTopP(defaults.topP);
    setLocalMaxTokens(defaults.maxTokens);
    setLocalPrompt(defaults.systemPrompt);
    setTemperature(defaults.temperature);
    setTopP(defaults.topP);
    setMaxTokens(defaults.maxTokens);
    setSystemPrompt(defaults.systemPrompt);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleLogout = () => navigate('/auth');

  return (
    <div className="flex flex-col h-full bg-neutral-900 text-neutral-100 overflow-hidden">
      {/* Header */}
      <header className="shrink-0 px-8 pt-8 pb-0 border-b border-neutral-800">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold text-neutral-100 tracking-tight">Settings</h1>
              <p className="text-sm text-neutral-500 mt-0.5">Configure your Pandora workspace</p>
            </div>
            {(isDirty || saved) && (
              <div className="flex items-center gap-2">
                {saved ? (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <CheckCircle2 size={14} />
                    Saved
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                    <AlertCircle size={14} />
                    Unsaved changes
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors rounded-t-lg cursor-pointer border-b-2 ${
                  activeTab === tab.id
                    ? 'text-neutral-100 border-neutral-100'
                    : 'text-neutral-500 border-transparent hover:text-neutral-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-3xl mx-auto">

          {/* ── MODEL TAB ─────────────────────────── */}
          {activeTab === 'model' && (
            <div className="space-y-8">
              <div>
                <SectionTitle>Active Model</SectionTitle>
                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden">
                  {MODELS.map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => setLocalModel(model.id)}
                      className={`w-full flex items-center justify-between px-5 py-4 text-left border-b border-neutral-800 last:border-b-0 transition-colors cursor-pointer ${
                        localModel === model.id ? 'bg-neutral-900' : 'hover:bg-neutral-900/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 transition-colors ${
                          localModel === model.id
                            ? 'border-white bg-white'
                            : 'border-neutral-600'
                        }`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-neutral-100">{model.label}</span>
                            {model.recommended && (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-600 font-mono mt-0.5">{model.id}</p>
                        </div>
                      </div>
                      <span className="text-xs text-neutral-600">{model.provider}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <SectionTitle>Inference Parameters</SectionTitle>
                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl px-5 divide-y divide-neutral-800">

                  <SettingRow
                    label="Temperature"
                    description="Controls output randomness. Lower = more deterministic. Higher = more creative."
                  >
                    <div className="flex items-center gap-3 w-52">
                      <input
                        type="range"
                        min={0} max={2} step={0.05}
                        value={localTemp}
                        onChange={(e) => setLocalTemp(parseFloat(e.target.value))}
                        className="flex-1 h-1.5 appearance-none bg-neutral-700 rounded-full accent-white cursor-pointer"
                      />
                      <span className="text-xs font-mono text-neutral-200 w-8 text-right">{localTemp.toFixed(2)}</span>
                    </div>
                  </SettingRow>

                  <SettingRow
                    label="Top-P"
                    description="Nucleus sampling. Lower values make output more focused and predictable."
                  >
                    <div className="flex items-center gap-3 w-52">
                      <input
                        type="range"
                        min={0} max={1} step={0.05}
                        value={localTopP}
                        onChange={(e) => setLocalTopP(parseFloat(e.target.value))}
                        className="flex-1 h-1.5 appearance-none bg-neutral-700 rounded-full accent-white cursor-pointer"
                      />
                      <span className="text-xs font-mono text-neutral-200 w-8 text-right">{localTopP.toFixed(2)}</span>
                    </div>
                  </SettingRow>

                  <SettingRow
                    label="Max Tokens"
                    description="Maximum number of tokens generated per response."
                  >
                    <div className="flex items-center gap-3 w-52">
                      <input
                        type="range"
                        min={128} max={8192} step={128}
                        value={localMaxTokens}
                        onChange={(e) => setLocalMaxTokens(parseInt(e.target.value))}
                        className="flex-1 h-1.5 appearance-none bg-neutral-700 rounded-full accent-white cursor-pointer"
                      />
                      <span className="text-xs font-mono text-neutral-200 w-10 text-right">{localMaxTokens}</span>
                    </div>
                  </SettingRow>

                  <SettingRow
                    label="JSON Mode"
                    description="Force the model to output valid JSON on every completion."
                  >
                    <button
                      type="button"
                      onClick={() => setLocalJsonMode(!localJsonMode)}
                      className={`relative w-10 rounded-full transition-colors cursor-pointer ${localJsonMode ? 'bg-white' : 'bg-neutral-700'}`}
                      style={{ height: '22px' }}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-neutral-900 transition-transform ${localJsonMode ? 'translate-x-5' : 'translate-x-0.5'}`}
                      />
                    </button>
                  </SettingRow>
                </div>
              </div>

              <div>
                <SectionTitle>System Prompt</SectionTitle>
                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5">
                  <p className="text-xs text-neutral-500 mb-3">
                    Default instructions sent as the system message on every conversation.
                  </p>
                  <textarea
                    value={localPrompt}
                    onChange={(e) => setLocalPrompt(e.target.value)}
                    rows={5}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-200 placeholder:text-neutral-700 focus:outline-none focus:border-neutral-700 transition-colors resize-none font-mono leading-relaxed"
                    placeholder="You are a helpful AI assistant..."
                  />
                </div>
              </div>

              {/* Save / Reset */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm text-neutral-500 hover:text-neutral-100 border border-neutral-700 hover:border-neutral-600 transition-colors cursor-pointer"
                >
                  <RotateCcw size={13} />
                  Reset to defaults
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!isDirty}
                  className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium bg-white text-black hover:opacity-90 transition-opacity disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  <Save size={13} />
                  Save changes
                </button>
              </div>
            </div>
          )}

          {/* ── PROFILE TAB ───────────────────────── */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <SectionTitle>Account</SectionTitle>
                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden">

                  <div className="flex items-center gap-5 px-6 py-6 border-b border-neutral-800">
                    <div className="w-16 h-16 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden shrink-0">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User size={24} className="text-neutral-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-neutral-100">{user?.full_name || 'Pandora User'}</p>
                      <p className="text-sm text-neutral-500 mt-0.5">{user?.email || 'No email configured'}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Shield size={11} className="text-emerald-400" />
                        <span className="text-[11px] text-emerald-400 font-medium">
                          {user?.id ? 'Authenticated' : 'Guest / Evaluation Mode'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-neutral-800">
                    {[
                      { label: 'User ID', value: user?.id ? `${user.id.substring(0, 16)}...` : '—' },
                      { label: 'Auth Provider', value: 'Supabase' },
                      { label: 'Environment', value: import.meta.env.DEV ? 'Development' : 'Production' },
                      { label: 'API Gateway', value: 'Fireworks AI' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-center px-6 py-3.5">
                        <span className="text-sm text-neutral-400">{label}</span>
                        <span className="text-xs font-mono text-neutral-500">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <SectionTitle>Session</SectionTitle>
                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between px-6 py-4 text-sm text-red-400 hover:bg-red-500/5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <LogOut size={15} />
                      <div className="text-left">
                        <p className="font-medium">Sign out</p>
                        <p className="text-xs text-neutral-600 mt-0.5">End your current session</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-neutral-700" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── SHORTCUTS TAB ─────────────────────── */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-6">
              <SectionTitle>Keyboard Shortcuts</SectionTitle>
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden divide-y divide-neutral-800">
                {[
                  { keys: ['Ctrl', 'Enter'], description: 'Run prompt (Playground)', scope: 'Playground' },
                  { keys: ['Enter'], description: 'Submit message', scope: 'Chat' },
                  { keys: ['Shift', 'Enter'], description: 'Insert new line in composer', scope: 'Chat' },
                  { keys: ['Esc'], description: 'Close modal or dropdown', scope: 'Global' },
                  { keys: ['Ctrl', 'K'], description: 'Open command palette (coming soon)', scope: 'Global' },
                ].map(({ keys, description, scope }) => (
                  <div key={description} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="text-sm text-neutral-200">{description}</p>
                      <p className="text-[11px] text-neutral-600 mt-0.5">{scope}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {keys.map((k, i) => (
                        <span key={k} className="flex items-center gap-1">
                          <Kbd>{k}</Kbd>
                          {i < keys.length - 1 && <span className="text-neutral-700 text-xs">+</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ABOUT TAB ─────────────────────────── */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <SectionTitle>Platform</SectionTitle>
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden divide-y divide-neutral-800">
                {[
                  { label: 'Product', value: 'Pandora AI Platform' },
                  { label: 'Version', value: '1.0.0' },
                  { label: 'Frontend', value: 'React 19 + Vite + TypeScript' },
                  { label: 'Backend', value: 'FastAPI + Python 3.12' },
                  { label: 'AI Provider', value: 'Fireworks AI' },
                  { label: 'Database', value: 'Supabase PostgreSQL' },
                  { label: 'Auth', value: 'Supabase Auth' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center px-6 py-3.5">
                    <span className="text-sm text-neutral-400">{label}</span>
                    <span className="text-xs font-mono text-neutral-400">{value}</span>
                  </div>
                ))}
              </div>

              <div>
                <SectionTitle>Features</SectionTitle>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: <Cpu size={14} />, label: 'AI Chat', desc: 'Streaming inference' },
                    { icon: <Braces size={14} />, label: 'JSON Mode', desc: 'Structured output' },
                    { icon: <Sliders size={14} />, label: 'Playground', desc: 'Parameter testing' },
                    { icon: <Shield size={14} />, label: 'Evaluation', desc: 'Automated tests' },
                  ].map(({ icon, label, desc }) => (
                    <div key={label} className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 flex items-center gap-3">
                      <span className="text-neutral-500">{icon}</span>
                      <div>
                        <p className="text-xs font-medium text-neutral-300">{label}</p>
                        <p className="text-[10px] text-neutral-600">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
