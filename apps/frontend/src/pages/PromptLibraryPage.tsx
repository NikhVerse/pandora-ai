import { useState, useMemo } from 'react';
import { Search, Star, StarOff, Copy, Check, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { ChatSession, ChatMessage } from '@pandora/types';

type Category = 'All' | 'Code' | 'Writing' | 'Analysis' | 'Data' | 'DevOps' | 'Business';

const CATEGORIES: Category[] = ['All', 'Code', 'Writing', 'Analysis', 'Data', 'DevOps', 'Business'];

interface Prompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: Exclude<Category, 'All'>;
  tags: string[];
}

const PROMPTS: Prompt[] = [
  { id: '1', title: 'Code Review Expert', category: 'Code', description: 'Deep analysis for bugs, performance, and style', tags: ['review', 'bugs'], prompt: 'Please perform a thorough code review of the following code. Check for:\n\n1. **Bugs and logic errors**\n2. **Performance bottlenecks**\n3. **Security vulnerabilities**\n4. **Code style and readability**\n5. **Suggested improvements**\n\nProvide specific line-by-line feedback where applicable.\n\n```\n[paste your code here]\n```' },
  { id: '2', title: 'FastAPI REST API Generator', category: 'Code', description: 'Generate a complete FastAPI endpoint with models', tags: ['fastapi', 'python', 'api'], prompt: 'Create a complete FastAPI REST API for a [resource] with:\n\n- Pydantic v2 models (Create, Update, Response schemas)\n- Async CRUD endpoints (GET, POST, PUT, DELETE)\n- Proper HTTP status codes\n- Error handling with HTTPException\n- Docstrings for each endpoint\n- SQLAlchemy 2.0 async model\n\nResource: [describe your resource]' },
  { id: '3', title: 'React Component Generator', category: 'Code', description: 'Generate typed React components with hooks', tags: ['react', 'typescript', 'hooks'], prompt: 'Generate a production-ready React TypeScript component for:\n\n**Component:** [describe component]\n\nRequirements:\n- Proper TypeScript interfaces for props\n- Hooks for state management\n- Error boundary handling\n- Accessibility (ARIA attributes)\n- Clean, readable JSX\n- Export as named and default export' },
  { id: '4', title: 'Technical Blog Post Writer', category: 'Writing', description: 'Write an SEO-optimized technical article', tags: ['blog', 'seo', 'writing'], prompt: 'Write a comprehensive technical blog post about **[topic]**.\n\nStructure:\n1. Hook / Introduction (why this matters)\n2. Background and context\n3. Step-by-step explanation with code examples\n4. Common pitfalls and how to avoid them\n5. Best practices\n6. Conclusion with key takeaways\n\nTarget audience: [beginner/intermediate/advanced] developers\nApproximate length: [500/1000/2000] words' },
  { id: '5', title: 'Data Analysis Assistant', category: 'Analysis', description: 'Analyze datasets and identify patterns', tags: ['data', 'analysis', 'statistics'], prompt: 'Analyze the following dataset and provide:\n\n1. **Summary statistics** (mean, median, distribution)\n2. **Key patterns and trends**\n3. **Anomalies or outliers**\n4. **Correlations between variables**\n5. **Actionable insights**\n6. **Visualization recommendations** (which charts to use)\n\nDataset:\n```\n[paste your data here]\n```' },
  { id: '6', title: 'SQL Query Optimizer', category: 'Data', description: 'Optimize slow SQL queries with explanations', tags: ['sql', 'performance', 'database'], prompt: 'Optimize the following SQL query for maximum performance:\n\n```sql\n[paste your query here]\n```\n\nPlease:\n1. Identify performance bottlenecks\n2. Suggest index strategies\n3. Rewrite with optimizations\n4. Explain each optimization\n5. Estimate performance improvement' },
  { id: '7', title: 'Dockerfile Generator', category: 'DevOps', description: 'Multi-stage optimized Dockerfile creation', tags: ['docker', 'devops', 'containers'], prompt: 'Create an optimized production-ready Dockerfile for:\n\n**Application type:** [Python/Node.js/Go/etc.]\n**Framework:** [FastAPI/Express/Gin/etc.]\n**Requirements:**\n- Multi-stage build (builder + runtime)\n- Non-root user for security\n- Proper layer caching\n- Minimal final image size\n- Health check instruction\n- Environment variable handling' },
  { id: '8', title: 'Business Email Composer', category: 'Business', description: 'Professional business communication drafts', tags: ['email', 'communication', 'professional'], prompt: 'Draft a professional business email for the following scenario:\n\n**Situation:** [describe the situation]\n**From:** [your role]\n**To:** [recipient role]\n**Goal:** [what you want to achieve]\n**Tone:** [formal/friendly/urgent]\n\nInclude:\n- Clear subject line\n- Professional greeting\n- Concise body (3-4 short paragraphs)\n- Clear call to action\n- Appropriate sign-off' },
  { id: '9', title: 'CI/CD Pipeline Designer', category: 'DevOps', description: 'GitHub Actions workflow generation', tags: ['ci/cd', 'github-actions', 'automation'], prompt: 'Create a complete GitHub Actions CI/CD pipeline for:\n\n**Project type:** [Python/Node/etc.]\n**Triggers:** [push to main, PR]\n**Required stages:**\n1. Lint and type check\n2. Unit tests with coverage\n3. Build Docker image\n4. Push to registry\n5. Deploy to [staging/production]\n\nInclude caching, secrets handling, and notification on failure.' },
  { id: '10', title: 'API Documentation Writer', category: 'Writing', description: 'Generate OpenAPI-style endpoint documentation', tags: ['docs', 'api', 'openapi'], prompt: 'Write comprehensive API documentation for the following endpoint:\n\n```\n[paste your endpoint code/spec here]\n```\n\nInclude:\n- Endpoint description and purpose\n- Request parameters (path, query, body)\n- Request/response examples (JSON)\n- Error codes and meanings\n- Authentication requirements\n- Rate limiting notes\n- Code examples in Python and JavaScript' },
  { id: '11', title: 'Data Schema Designer', category: 'Data', description: 'Design normalized database schemas', tags: ['schema', 'database', 'design'], prompt: 'Design a normalized database schema for:\n\n**System:** [describe your system]\n**Scale:** [expected number of records]\n**Database:** [PostgreSQL/MySQL/SQLite]\n\nProvide:\n1. Entity-Relationship diagram (text format)\n2. CREATE TABLE statements with constraints\n3. Index recommendations\n4. Foreign key relationships\n5. Justification for design decisions' },
  { id: '12', title: 'Competitive Analysis', category: 'Business', description: 'Market and competitor analysis framework', tags: ['strategy', 'market', 'analysis'], prompt: 'Conduct a competitive analysis for:\n\n**Product/Service:** [your product]\n**Market:** [target market]\n**Competitors:** [list main competitors]\n\nAnalyze:\n1. Feature comparison matrix\n2. Pricing strategies\n3. Target customer segments\n4. Strengths and weaknesses (SWOT)\n5. Market positioning opportunities\n6. Differentiation recommendations' },
];

export default function PromptLibraryPage() {
  const navigate = useNavigate();
  const { addSession, addMessage, setActiveSessionId } = useAppStore();
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showFavOnly, setShowFavOnly] = useState(false);

  const filtered = useMemo(() => PROMPTS.filter(p => {
    if (showFavOnly && !favorites.has(p.id)) return false;
    if (activeCategory !== 'All' && p.category !== activeCategory) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.description.toLowerCase().includes(search.toLowerCase()) && !p.tags.some(t => t.includes(search.toLowerCase()))) return false;
    return true;
  }), [activeCategory, search, favorites, showFavOnly]);

  const handleFav = (id: string) => {
    setFavorites(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUseInChat = (prompt: Prompt) => {
    const session: ChatSession = {
      id: crypto.randomUUID(),
      title: prompt.title,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addSession(session);
    setActiveSessionId(session.id);
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt.prompt,
      created_at: new Date().toISOString(),
    };
    addMessage(session.id, msg);
    navigate('/dashboard/chat');
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-neutral-900">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-neutral-700 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-neutral-200">Prompt Library</h2>
            <p className="text-xs text-neutral-600 mt-0.5">{filtered.length} prompts</p>
          </div>
          <button
            onClick={() => setShowFavOnly(!showFavOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
              showFavOnly
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                : 'border-neutral-700 text-neutral-500 hover:text-neutral-300 hover:border-neutral-600'
            }`}
          >
            <Star size={12} /> Favorites {favorites.size > 0 && `(${favorites.size})`}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search prompts, tags..."
            className="w-full pl-8 pr-4 py-2 text-sm bg-neutral-950 border border-neutral-700 rounded-xl text-neutral-300 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'text-neutral-500 hover:text-neutral-200 bg-neutral-800/60 hover:bg-neutral-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <BookOpen size={28} className="text-neutral-700 mb-3" />
            <p className="text-sm text-neutral-500">No prompts found</p>
            <p className="text-xs text-neutral-600 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map(prompt => (
                <motion.div
                  key={prompt.id}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="group bg-neutral-950 border border-neutral-700 rounded-xl p-4 flex flex-col gap-3 hover:border-neutral-600 transition-colors"
                >
                  {/* Title + fav */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-neutral-200 leading-snug truncate">{prompt.title}</h3>
                      <p className="text-xs text-neutral-600 mt-0.5 line-clamp-2">{prompt.description}</p>
                    </div>
                    <button
                      onClick={() => handleFav(prompt.id)}
                      className="shrink-0 p-1 rounded-md text-neutral-700 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      {favorites.has(prompt.id)
                        ? <Star size={13} className="text-amber-400 fill-amber-400" />
                        : <StarOff size={13} />}
                    </button>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-500 border border-neutral-700">
                      {prompt.category}
                    </span>
                    {prompt.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-600 border border-neutral-700">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto pt-1 border-t border-neutral-800">
                    <button
                      onClick={() => handleCopy(prompt.id, prompt.prompt)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      {copiedId === prompt.id ? <><Check size={11} className="text-emerald-400" /> Copied</> : <><Copy size={11} /> Copy</>}
                    </button>
                    <button
                      onClick={() => handleUseInChat(prompt)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 text-[11px] hover:bg-indigo-600/20 transition-colors cursor-pointer"
                    >
                      Use in Chat
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
