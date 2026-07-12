import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Square, Paperclip, Copy, RefreshCw,
  FileText, X, Check, ChevronDown, Braces,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { ChatMessage, ChatSession } from '@pandora/types';
import { supabase } from '../utils/supabaseClient';

// ── Markdown renderer ──────────────────────────────────────────────────────

function parseInline(text: string): React.ReactNode[] {
  const segments = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return segments.map((seg, i) => {
    if (seg.startsWith('**') && seg.endsWith('**'))
      return <strong key={i} className="font-semibold text-neutral-100">{seg.slice(2, -2)}</strong>;
    if (seg.startsWith('*') && seg.endsWith('*'))
      return <em key={i} className="italic">{seg.slice(1, -1)}</em>;
    if (seg.startsWith('`') && seg.endsWith('`'))
      return <code key={i} className="bg-neutral-800 border border-neutral-700 rounded px-1 py-0.5 font-mono text-[0.8em] text-neutral-200">{seg.slice(1, -1)}</code>;
    return seg;
  });
}

function MarkdownContent({ content, streaming }: { content: string; streaming?: boolean }) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  const renderBlock = (text: string, key: number): React.ReactNode => {
    if (!text.trim()) return null;
    const lines = text.split('\n');
    const nodes: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Heading
      if (/^#{1,3} /.test(trimmed)) {
        const level = trimmed.match(/^(#+) /)?.[1].length ?? 1;
        const txt = trimmed.replace(/^#+\s/, '');
        const cls = level === 1 ? 'text-lg font-bold text-neutral-100 mt-4 mb-1'
          : level === 2 ? 'text-base font-semibold text-neutral-100 mt-3 mb-1'
          : 'text-sm font-semibold text-neutral-200 mt-2 mb-0.5';
        nodes.push(<p key={`h-${key}-${i}`} className={cls}>{txt}</p>);
        i++; continue;
      }

      // List items — collect consecutive
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\. /.test(trimmed)) {
        const items: string[] = [];
        const ordered = /^\d+\. /.test(trimmed);
        while (i < lines.length) {
          const t = lines[i].trim();
          if (t.startsWith('- ') || t.startsWith('* ')) { items.push(t.slice(2)); i++; }
          else if (/^\d+\. /.test(t)) { items.push(t.replace(/^\d+\. /, '')); i++; }
          else break;
        }
        const Tag = ordered ? 'ol' : 'ul';
        nodes.push(
          <Tag key={`l-${key}-${i}`} className={`${ordered ? 'list-decimal' : 'list-disc'} pl-5 space-y-0.5 my-1.5`}>
            {items.map((it, j) => <li key={j} className="text-neutral-300 text-sm">{parseInline(it)}</li>)}
          </Tag>
        );
        continue;
      }

      // Blockquote
      if (trimmed.startsWith('> ')) {
        nodes.push(
          <blockquote key={`bq-${key}-${i}`} className="border-l-2 border-neutral-600 pl-3 my-2 text-neutral-500 italic text-sm">
            {parseInline(trimmed.slice(2))}
          </blockquote>
        );
        i++; continue;
      }

      // Horizontal rule
      if (/^---+$/.test(trimmed)) {
        nodes.push(<hr key={`hr-${key}-${i}`} className="border-neutral-700 my-3" />);
        i++; continue;
      }

      // Empty line → spacing
      if (!trimmed) {
        nodes.push(<div key={`sp-${key}-${i}`} className="h-2" />);
        i++; continue;
      }

      // Regular paragraph
      nodes.push(
        <p key={`p-${key}-${i}`} className="text-neutral-300 text-sm leading-relaxed">
          {parseInline(line)}
        </p>
      );
      i++;
    }
    return <>{nodes}</>;
  };

  return (
    <div className="space-y-0.5">
      {parts.map((part, idx) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const inner = part.slice(3, -3);
          const newline = inner.indexOf('\n');
          const lang = newline !== -1 ? inner.slice(0, newline).trim() : '';
          const code = newline !== -1 ? inner.slice(newline + 1).trimEnd() : inner;
          return <CodeBlock key={idx} language={lang || 'code'} code={code} />;
        }
        return <React.Fragment key={idx}>{renderBlock(part, idx)}</React.Fragment>;
      })}
      {streaming && <span className="streaming-cursor" />}
    </div>
  );
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="code-block my-3 border border-neutral-700">
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-700 bg-neutral-800/40">
        <span className="text-[10px] uppercase tracking-widest font-mono text-neutral-500">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer"
        >
          {copied ? <><Check size={11} className="text-emerald-400" /> Copied</> : <><Copy size={11} /> Copy</>}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed text-neutral-200 font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ── Message bubble ─────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  isLast,
  isGenerating,
  onRegenerate,
}: {
  msg: ChatMessage;
  isLast: boolean;
  isGenerating: boolean;
  onRegenerate: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === 'user';
  const isEmpty = msg.content === '' && isGenerating;

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[75%] space-y-1">
          <div className="bg-neutral-800 border border-neutral-700 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-neutral-200 leading-relaxed">
            {msg.content}
          </div>
          <p className="text-right text-[10px] text-neutral-600 pr-1">{time}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 group"
    >
      {/* AI avatar */}
      <div className="w-7 h-7 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none">
          <path d="M12 2L14.7 9.3L22 12L14.7 14.7L12 22L9.3 14.7L2 12L9.3 9.3L12 2Z" fill="url(#msgGrad)" />
          <defs>
            <linearGradient id="msgGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-neutral-300">Pandora</span>
          <span className="text-[10px] text-neutral-600">{time}</span>
        </div>

        {isEmpty ? (
          <div className="flex items-center gap-1.5 py-2">
            <span className="dot-bounce" />
            <span className="dot-bounce" />
            <span className="dot-bounce" />
          </div>
        ) : (
          <MarkdownContent content={msg.content} streaming={isLast && isGenerating} />
        )}

        {/* Action bar — shown on hover or when it's the last complete AI message */}
        {!isEmpty && !isGenerating && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-0.5">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            {isLast && (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <RefreshCw size={11} />
                Regenerate
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main chat component ────────────────────────────────────────────────────

export default function ChatPage() {
  const {
    activeSessionId,
    messagesBySession,
    addSession,
    addMessage,
    setMessages,
    temperature,
    topP,
    maxTokens,
    systemPrompt,
    selectedModel,
  } = useAppStore();

  const [inputVal, setInputVal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [jsonMode, setJsonMode] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{
    filename: string; size: number; content: string; summary: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeMessages = activeSessionId ? (messagesBySession[activeSessionId] ?? []) : [];

  // Auto-scroll
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages.length, scrollToBottom]);

  // Show scroll-to-bottom button
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setShowScrollBtn(!atBottom);
  };

  // Auto-resize textarea
  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  };

  // Get bearer token
  const getToken = async (): Promise<string> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? 'mock-session-token';
    } catch {
      return 'mock-session-token';
    }
  };

  // File upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const token = await getToken();
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setAttachedFile({ filename: data.filename, size: data.size, content: data.content, summary: data.summary });
    } catch {
      alert('File upload failed. Ensure the backend is running.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Stream from API
  const streamFromAPI = async (
    messages: { role: string; content: string }[],
    assistantMsg: ChatMessage,
    sessionId: string,
    previousMsgs: ChatMessage[],
    controller: AbortController
  ) => {
    const token = await getToken();
    const res = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        messages,
        temperature,
        top_p: topP,
        max_tokens: maxTokens,
        system_prompt: systemPrompt,
        json_mode: jsonMode,
        model: selectedModel
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || 'API error');
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) throw new Error('Stream reader failed');

    let accumulated = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      accumulated += decoder.decode(value, { stream: true });
      setMessages(sessionId, [...previousMsgs, { ...assistantMsg, content: accumulated }]);
    }
    setMessages(sessionId, [...previousMsgs, { ...assistantMsg, content: accumulated }]);
  };

  // Connection error fallback
  const runMockStream = (
    assistantMsg: ChatMessage,
    sessionId: string,
    previousMsgs: ChatMessage[],
    controller: AbortController
  ) => {
    const reply = `Error: Connection to Pandora backend gateway failed. Ensure the server container is active at http://localhost:8000.`;

    let idx = 0;
    const timer = setInterval(() => {
      if (controller.signal.aborted) { clearInterval(timer); setIsGenerating(false); return; }
      idx = Math.min(idx + 6, reply.length);
      setMessages(sessionId, [...previousMsgs, { ...assistantMsg, content: reply.slice(0, idx) }]);
      if (idx >= reply.length) { clearInterval(timer); setIsGenerating(false); }
    }, 20);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = inputVal.trim();
    if (!text || isGenerating) return;

    // Create session if none
    let sessionId = activeSessionId;
    if (!sessionId) {
      const s: ChatSession = {
        id: crypto.randomUUID(),
        title: text.substring(0, 40),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      addSession(s);
      sessionId = s.id;
    }

    setInputVal('');
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text, created_at: new Date().toISOString() };
    addMessage(sessionId, userMsg);

    const assistantMsg: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: '', created_at: new Date().toISOString() };
    addMessage(sessionId, assistantMsg);

    setIsGenerating(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Build message payload
    const prior = messagesBySession[sessionId] ?? [];
    const payloadMsgs = prior
      .filter(m => m.id !== assistantMsg.id)
      .map(m => ({ role: m.role, content: m.content }));

    if (attachedFile) {
      payloadMsgs.unshift({
        role: 'system',
        content: `[Document: ${attachedFile.filename}]\n${attachedFile.content.slice(0, 8000)}\nAnswer questions using this document when relevant.`,
      });
    }

    payloadMsgs.push({ role: 'user', content: text });

    const prevMsgs = [...(messagesBySession[sessionId] ?? []).filter(m => m.id !== assistantMsg.id), userMsg];

    try {
      await streamFromAPI(payloadMsgs, assistantMsg, sessionId, prevMsgs, controller);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') { setIsGenerating(false); return; }
      runMockStream(assistantMsg, sessionId, prevMsgs, controller);
      return;
    }
    setIsGenerating(false);
    abortControllerRef.current = null;
  };

  const handleRegenerate = async () => {
    if (!activeSessionId || isGenerating || activeMessages.length < 2) return;
    const lastUserIdx = [...activeMessages].reverse().findIndex(m => m.role === 'user');
    if (lastUserIdx === -1) return;
    const realIdx = activeMessages.length - 1 - lastUserIdx;
    const truncated = activeMessages.slice(0, realIdx + 1);
    setMessages(activeSessionId, truncated);

    const assistantMsg: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: '', created_at: new Date().toISOString() };
    addMessage(activeSessionId, assistantMsg);

    setIsGenerating(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const payloadMsgs = truncated.map(m => ({ role: m.role, content: m.content }));

    try {
      await streamFromAPI(payloadMsgs, assistantMsg, activeSessionId, truncated, controller);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') { setIsGenerating(false); return; }
      runMockStream(assistantMsg, activeSessionId, truncated, controller);
      return;
    }
    setIsGenerating(false);
    abortControllerRef.current = null;
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };



  return (
    <div className="flex flex-col h-full bg-neutral-900 overflow-hidden relative">
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.docx,.txt,.csv,.json,.md" onChange={handleFileChange} />

      {/* Empty state */}
      {activeMessages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-none">
              <path d="M12 2L14.7 9.3L22 12L14.7 14.7L12 22L9.3 14.7L2 12L9.3 9.3L12 2Z" fill="url(#emptyGrad)" />
              <defs>
                <linearGradient id="emptyGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-neutral-200 mb-1">Start a conversation</h2>
          <p className="text-sm text-neutral-500 max-w-xs">
            Ask a question, upload a document, or pick a prompt from the library.
          </p>
        </div>
      )}

      {/* Message list */}
      {activeMessages.length > 0 && (
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto"
        >
          <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
            {activeMessages.map((msg, idx) => {
              const isLast = idx === activeMessages.length - 1;
              return (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isLast={isLast && msg.role === 'assistant'}
                  isGenerating={isGenerating}
                  onRegenerate={handleRegenerate}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Scroll-to-bottom button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-28 right-6 w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-neutral-200 flex items-center justify-center shadow-md transition-colors cursor-pointer"
          >
            <ChevronDown size={14} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Composer */}
      <div className="shrink-0 px-4 pb-5 pt-2">
        <div className="max-w-3xl mx-auto space-y-2">

          {/* Stop generation pill */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="flex justify-center"
              >
                <button
                  onClick={handleStop}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-neutral-700 bg-neutral-900 text-xs text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-colors cursor-pointer"
                >
                  <Square size={10} className="fill-current" />
                  Stop generating
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Attached file chip */}
          {(attachedFile || isUploading) && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-neutral-700 bg-neutral-950 text-xs text-neutral-400">
                {isUploading ? (
                  <><span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" /> Processing file...</>
                ) : (
                  <>
                    <FileText size={11} className="text-indigo-400" />
                    <span className="truncate max-w-[180px]">{attachedFile?.filename}</span>
                    <span className="text-neutral-600">·</span>
                    <span className="text-neutral-600">{((attachedFile?.size ?? 0) / 1024).toFixed(1)} KB</span>
                    <button onClick={() => setAttachedFile(null)} className="ml-1 text-neutral-600 hover:text-red-400 transition-colors cursor-pointer">
                      <X size={11} />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Textarea composer */}
          <form onSubmit={handleSend}>
            <div className="relative bg-white border border-neutral-700 rounded-2xl shadow-sm composer-ring overflow-hidden">
              <textarea
                ref={textareaRef}
                value={inputVal}
                disabled={isGenerating}
                onChange={e => { setInputVal(e.target.value); resizeTextarea(); }}
                onKeyDown={handleKeyDown}
                placeholder="Ask Pandora..."
                rows={1}
                className="w-full resize-none bg-transparent px-5 pt-3.5 pb-12 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none leading-relaxed disabled:opacity-50"
              />
              {/* Bottom action bar */}
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-40"
                    title="Attach file"
                  >
                    <Paperclip size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setJsonMode(!jsonMode)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-mono transition-colors cursor-pointer ${
                      jsonMode
                        ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                        : 'text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800'
                    }`}
                    title="JSON mode"
                  >
                    <Braces size={12} />
                    {jsonMode && <span>JSON</span>}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!inputVal.trim() || isGenerating}
                  className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
            <p className="text-center text-[10px] text-neutral-600 mt-1.5">
              Enter to send · Shift+Enter for new line
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
