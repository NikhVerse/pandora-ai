import { useState, useRef, useCallback } from 'react';
import {
  Upload, FileText, File, X, MessageSquare,
  Loader2, ChevronRight, FolderOpen, Braces,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { ChatSession, ChatMessage } from '@pandora/types';
import { supabase } from '../utils/supabaseClient';

interface UploadedFile {
  id: string;
  filename: string;
  size: number;
  type: string;
  summary: string;
  content: string;
  uploadedAt: string;
  previewUrl?: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  pdf: FileText,
  json: Braces,
  csv: File,
  txt: File,
  md: FileText,
  docx: FileText,
  png: File,
  jpg: File,
  jpeg: File,
  gif: File,
  webp: File,
  bmp: File,
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function FilesPage() {
  const navigate = useNavigate();
  const { addSession, addMessage, setActiveSessionId } = useAppStore();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [question, setQuestion] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getToken = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? 'mock-session-token';
    } catch { return 'mock-session-token'; }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    const token = await getToken();
    const fd = new FormData();
    fd.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          const ext = file.name.split('.').pop()?.toLowerCase() ?? 'txt';
          const isImg = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(ext);
          const uploaded: UploadedFile = {
            id: crypto.randomUUID(),
            filename: data.filename,
            size: data.size,
            type: ext,
            summary: data.summary,
            content: data.content ?? '',
            uploadedAt: new Date().toISOString(),
            previewUrl: isImg ? URL.createObjectURL(file) : undefined,
          };
          setFiles(prev => [uploaded, ...prev]);
          setSelectedFile(uploaded);
        } catch {
          alert('Upload failed: Invalid response format');
        }
      } else {
        alert(`Upload failed: Status ${xhr.status}`);
      }
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    xhr.onerror = () => {
      alert('Upload failed: Connection error');
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    xhr.send(fd);
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) await uploadFile(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const handleAskInChat = (file: UploadedFile, prompt?: string) => {
    const session: ChatSession = {
      id: crypto.randomUUID(),
      title: `Ask about ${file.filename}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addSession(session);
    setActiveSessionId(session.id);

    const systemMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'system',
      content: `[Document: ${file.filename}]\n${file.content.slice(0, 10000)}\n\nAnswer questions using this document when relevant.`,
      created_at: new Date().toISOString(),
    };
    addMessage(session.id, systemMsg);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt || `Please summarize the key points from "${file.filename}".`,
      created_at: new Date().toISOString(),
    };
    addMessage(session.id, userMsg);
    navigate('/dashboard/chat');
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    if (selectedFile?.id === id) setSelectedFile(null);
  };

  const Icon = selectedFile ? (TYPE_ICONS[selectedFile.type] ?? File) : File;

  return (
    <div className="h-full w-full flex overflow-hidden bg-neutral-900">
      {/* Left: Upload + File list */}
      <div className="w-72 shrink-0 border-r border-neutral-700 bg-neutral-950 flex flex-col overflow-hidden">
        <div className="px-4 py-4 border-b border-neutral-700 flex items-center gap-2">
          <FolderOpen size={14} className="text-neutral-500" />
          <h2 className="text-sm font-semibold text-neutral-200">Files</h2>
          <span className="ml-auto text-[10px] text-neutral-600">{files.length} uploaded</span>
        </div>

        {/* Drop zone */}
        <div className="px-3 py-3 shrink-0">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl py-6 flex flex-col items-center gap-2 cursor-pointer transition-all ${
              dragging
                ? 'border-indigo-500 bg-indigo-500/5'
                : 'border-neutral-700 hover:border-neutral-600 hover:bg-neutral-800/40'
            }`}
          >
            {uploading ? (
              <div className="w-full px-4 text-center space-y-2">
                <Loader2 size={20} className="text-indigo-400 animate-spin mx-auto" />
                <p className="text-xs text-neutral-400">Uploading... {uploadProgress}%</p>
                <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-indigo-600 h-full transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            ) : (
              <>
                <Upload size={18} className="text-neutral-600" />
                <div className="text-center">
                  <p className="text-xs font-medium text-neutral-400">Drop file or click to upload</p>
                  <p className="text-[10px] text-neutral-600 mt-0.5">PDF, DOCX, TXT, CSV, JSON, MD, Images</p>
                </div>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.txt,.csv,.json,.md,.png,.jpg,.jpeg,.gif,.webp,.bmp"
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}
          />
        </div>

        {/* File list */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          {files.length === 0 ? (
            <p className="text-center text-xs text-neutral-600 py-6">No files uploaded yet</p>
          ) : (
            files.map(f => {
              const FIcon = TYPE_ICONS[f.type] ?? File;
              return (
                <div
                  key={f.id}
                  onClick={() => setSelectedFile(f)}
                  className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    selectedFile?.id === f.id ? 'bg-neutral-800 text-neutral-200' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/60'
                  }`}
                >
                  <FIcon size={14} className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{f.filename}</p>
                    <p className="text-[10px] text-neutral-600">{formatSize(f.size)}</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); removeFile(f.id); }} className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-neutral-600 hover:text-red-400 transition-all cursor-pointer">
                    <X size={11} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right: File detail */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedFile ? (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center mx-auto">
                <FolderOpen size={20} className="text-neutral-600" />
              </div>
              <p className="text-sm font-medium text-neutral-400">No file selected</p>
              <p className="text-xs text-neutral-600 max-w-xs">Upload a file and select it to see the AI-generated summary and ask questions about it.</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* File header */}
            <div className="shrink-0 px-6 py-4 border-b border-neutral-700 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-neutral-800 flex items-center justify-center">
                <Icon size={16} className="text-neutral-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-neutral-200 truncate">{selectedFile.filename}</h2>
                <p className="text-xs text-neutral-600">{formatSize(selectedFile.size)} · {selectedFile.type.toUpperCase()} · {new Date(selectedFile.uploadedAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAskInChat(selectedFile)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  <MessageSquare size={12} /> Ask AI
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">AI Summary</h3>
                <div className="bg-neutral-950 border border-neutral-700 rounded-xl px-5 py-4">
                  <p className="text-sm text-neutral-300 leading-relaxed">{selectedFile.summary || 'No summary available.'}</p>
                </div>
              </div>

              {selectedFile.previewUrl && (
                <div>
                  <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Image Preview</h3>
                  <div className="bg-neutral-950 border border-neutral-700 rounded-xl p-3 flex justify-center max-h-96 overflow-hidden">
                    <img src={selectedFile.previewUrl} alt="uploaded preview" className="max-h-80 object-contain rounded-lg shadow-sm" />
                  </div>
                </div>
              )}

              {/* Quick questions */}
              <div>
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Ask a Question</h3>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={question}
                      onChange={e => setQuestion(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && question.trim()) { handleAskInChat(selectedFile, question); setQuestion(''); }}}
                      placeholder="Ask anything about this document..."
                      className="flex-1 px-4 py-2.5 text-sm bg-neutral-950 border border-neutral-700 rounded-xl text-neutral-300 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
                    />
                    <button
                      onClick={() => { if (question.trim()) { handleAskInChat(selectedFile, question); setQuestion(''); }}}
                      disabled={!question.trim()}
                      className="px-4 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Summarize the key points', 'What are the main conclusions?', 'Explain this in simple terms', 'What actions are recommended?'].map(q => (
                      <button
                        key={q}
                        onClick={() => handleAskInChat(selectedFile, q)}
                        className="text-[11px] px-3 py-1.5 rounded-full border border-neutral-700 text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 transition-colors cursor-pointer"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Content preview */}
              {selectedFile.content && (
                <div>
                  <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Content Preview</h3>
                  <div className="bg-neutral-950 border border-neutral-700 rounded-xl px-5 py-4 max-h-48 overflow-y-auto">
                    <pre className="text-xs text-neutral-500 font-mono leading-relaxed whitespace-pre-wrap">{selectedFile.content.slice(0, 2000)}{selectedFile.content.length > 2000 && '...'}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
