import { create } from 'zustand';
import { UserProfile, ChatSession, ChatMessage, Prompt } from '@pandora/types';

interface AppState {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  chatSessions: ChatSession[];
  setChatSessions: (sessions: ChatSession[]) => void;
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  authLoading: boolean;
  setAuthLoading: (loading: boolean) => void;
  // Model Settings
  temperature: number;
  setTemperature: (val: number) => void;
  topP: number;
  setTopP: (val: number) => void;
  maxTokens: number;
  setMaxTokens: (val: number) => void;
  systemPrompt: string;
  setSystemPrompt: (val: string) => void;
  // Chat History Tables
  messagesBySession: Record<string, ChatMessage[]>;
  addSession: (session: ChatSession) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
  addMessage: (sessionId: string, message: ChatMessage) => void;
  setMessages: (sessionId: string, messages: ChatMessage[]) => void;
  // Prompt Library
  prompts: Prompt[];
  addPrompt: (prompt: Prompt) => void;
  deletePrompt: (id: string) => void;
  toggleFavoritePrompt: (id: string) => void;
  updatePrompt: (id: string, updates: Partial<Prompt>) => void;
  // Dynamic Model Selector State
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  supportedModels: Array<{ id: string; label: string }>;
  setSupportedModels: (models: Array<{ id: string; label: string }>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  chatSessions: [],
  setChatSessions: (chatSessions) => set({ chatSessions }),
  activeSessionId: null,
  setActiveSessionId: (activeSessionId) => set({ activeSessionId }),
  sidebarOpen: true,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  authLoading: true,
  setAuthLoading: (authLoading) => set({ authLoading }),
  // Model defaults
  temperature: 0.7,
  setTemperature: (temperature) => set({ temperature }),
  topP: 0.9,
  setTopP: (topP) => set({ topP }),
  maxTokens: 2048,
  setMaxTokens: (maxTokens) => set({ maxTokens }),
  systemPrompt: 'You are Pandora, a helpful assistant powered by Fireworks AI.',
  setSystemPrompt: (systemPrompt) => set({ systemPrompt }),
  // Chat store logic
  messagesBySession: {},
  addSession: (session) =>
    set((state) => ({
      chatSessions: [session, ...state.chatSessions],
      messagesBySession: { ...state.messagesBySession, [session.id]: [] },
      activeSessionId: session.id,
    })),
  deleteSession: (id) =>
    set((state) => {
      const remainingSessions = state.chatSessions.filter((s) => s.id !== id);
      const updatedMessages = { ...state.messagesBySession };
      delete updatedMessages[id];
      const nextActive =
        state.activeSessionId === id
          ? remainingSessions[0]?.id || null
          : state.activeSessionId;
      return {
        chatSessions: remainingSessions,
        messagesBySession: updatedMessages,
        activeSessionId: nextActive,
      };
    }),
  renameSession: (id, title) =>
    set((state) => ({
      chatSessions: state.chatSessions.map((s) =>
        s.id === id ? { ...s, title } : s
      ),
    })),
  addMessage: (sessionId, message) =>
    set((state) => {
      const sessionMsgs = state.messagesBySession[sessionId] || [];
      return {
        messagesBySession: {
          ...state.messagesBySession,
          [sessionId]: [...sessionMsgs, message],
        },
      };
    }),
  setMessages: (sessionId, messages) =>
    set((state) => ({
      messagesBySession: {
        ...state.messagesBySession,
        [sessionId]: messages,
      },
    })),
  // Prompt Library seed data
  prompts: [
    {
      id: 'p1',
      title: 'Professional Email',
      content: 'Write a professional email to {{recipient}} about {{topic}}. Keep it concise, respectful, and end with a clear call to action.',
      category: 'Writing',
      tags: ['email', 'professional', 'communication'],
      isFavorite: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'p2',
      title: 'Code Review',
      content: 'Review the following code for bugs, performance issues, and best practices. Provide specific, actionable feedback with corrected examples where needed:\n\n```\n{{code}}\n```',
      category: 'Engineering',
      tags: ['code', 'review', 'debugging'],
      isFavorite: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'p3',
      title: 'Executive Summary',
      content: 'Summarize the following document into a concise executive summary (max 3 paragraphs) covering: key findings, implications, and recommended next steps.\n\nDocument:\n{{document}}',
      category: 'Analysis',
      tags: ['summary', 'business', 'document'],
      isFavorite: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'p4',
      title: 'Explain Like I\'m 5',
      content: 'Explain the concept of {{topic}} in simple terms a 5-year-old could understand. Use analogies and avoid technical jargon.',
      category: 'Education',
      tags: ['explain', 'simplify', 'learning'],
      isFavorite: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'p5',
      title: 'Product Requirements Doc',
      content: 'Write a detailed Product Requirements Document (PRD) for {{feature}}. Include: Overview, Goals, User Stories, Acceptance Criteria, Out of Scope, and Open Questions.',
      category: 'Product',
      tags: ['PRD', 'product', 'planning'],
      isFavorite: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'p6',
      title: 'SQL Query Builder',
      content: 'Write an optimized SQL query to {{task}}. Include comments explaining each section. Use proper indexing hints where applicable.',
      category: 'Engineering',
      tags: ['sql', 'database', 'query'],
      isFavorite: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'p7',
      title: 'Marketing Copy',
      content: 'Write compelling marketing copy for {{product}}. Target audience: {{audience}}. Tone: {{tone}}. Include: headline, subheadline, 3 benefit bullets, and a strong CTA.',
      category: 'Marketing',
      tags: ['copy', 'marketing', 'advertising'],
      isFavorite: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'p8',
      title: 'System Design Interview',
      content: 'Design a scalable system for {{system}}. Cover: Requirements, High-level Architecture, Core Components, Data Model, API Design, Scalability Considerations, and Trade-offs.',
      category: 'Engineering',
      tags: ['system design', 'architecture', 'interview'],
      isFavorite: true,
      created_at: new Date().toISOString(),
    },
  ],
  addPrompt: (prompt) =>
    set((state) => ({ prompts: [prompt, ...state.prompts] })),
  deletePrompt: (id) =>
    set((state) => ({ prompts: state.prompts.filter((p) => p.id !== id) })),
  toggleFavoritePrompt: (id) =>
    set((state) => ({
      prompts: state.prompts.map((p) =>
        p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
      ),
    })),
  updatePrompt: (id, updates) =>
    set((state) => ({
      prompts: state.prompts.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),
  // Dynamic Model Selector Implementation
  selectedModel: localStorage.getItem('pandora_selected_model') || 'accounts/fireworks/models/kimi-k2p6',
  setSelectedModel: (model) => {
    localStorage.setItem('pandora_selected_model', model);
    set({ selectedModel: model });
  },
  supportedModels: [
    { id: 'accounts/fireworks/models/flux-1-schnell-fp8', label: 'Flux 1 Schnell' },
    { id: 'accounts/fireworks/models/gpt-oss-120b', label: 'Gpt Oss 120B' },
    { id: 'accounts/fireworks/models/glm-5p1', label: 'GLM 5P1' },
    { id: 'accounts/fireworks/models/deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
    { id: 'accounts/fireworks/models/kimi-k2p6', label: 'Kimi K2.6' },
    { id: 'accounts/fireworks/models/glm-5p2', label: 'GLM 5P2' },
  ],
  setSupportedModels: (supportedModels) => set({ supportedModels }),
}));
