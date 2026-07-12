# Pandora — AI Platform

<p align="center">
  <strong>A production-grade AI workspace powered by Fireworks AI</strong><br/>
  Built with React 19 · FastAPI · Supabase · Docker · Tailwind CSS v4
</p>

---

## Overview

Pandora is a modern AI platform that goes far beyond a simple chatbot. It provides a complete intelligent workspace including streaming AI chat, a model parameter playground, document analysis, a reusable prompt library, an automated evaluation suite, and full Docker deployment.

### Core Features

| Feature | Description |
|---|---|
| **AI Chat** | Streaming chat with Fireworks AI, markdown rendering, file context injection |
| **Playground** | Model parameter sandbox (temperature, Top-P, max tokens, JSON mode) |
| **File Analysis** | Upload PDF, DOCX, TXT, CSV, JSON — AI summarization + Q&A |
| **Prompt Library** | Categorized prompt collection with search, favorites, and "Use in Chat" |
| **Evaluation Mode** | Automated test suite for JSON validity, accuracy, and efficiency |
| **Authentication** | Supabase email + social login, protected routes |
| **Settings** | Per-session model config, system prompt, keyboard shortcuts reference |
| **Docker** | Multi-stage frontend (nginx) + backend (uvicorn) containers |
| **CI/CD** | GitHub Actions: build → test → Docker push to GHCR |

---

## Tech Stack

### Frontend
- **React 19** + **TypeScript** — UI framework
- **Vite 6** — bundler with code splitting and esbuild minification
- **Tailwind CSS v4** — utility-first styling
- **Framer Motion** — page and component animations
- **Zustand** — global state management
- **TanStack Query** — server state and caching
- **React Router v7** — client-side routing
- **Supabase JS** — authentication client

### Backend
- **FastAPI** — async Python web framework
- **Python 3.12** — runtime
- **Pydantic v2** — request/response validation
- **Uvicorn** — ASGI server
- **Fireworks AI** — LLM inference (streaming SSE)
- **pypdf** — PDF text extraction

### Infrastructure
- **Supabase** — PostgreSQL database + authentication
- **Docker + Docker Compose** — containerization
- **Vercel** — frontend hosting
- **Railway** — backend hosting
- **GitHub Actions** — CI/CD pipeline
- **GHCR** — Docker image registry

---

## Project Structure

```
pandora/
├── apps/
│   ├── frontend/          # React 19 + Vite application
│   │   ├── src/
│   │   │   ├── pages/     # ChatPage, PlaygroundPage, PromptLibraryPage, etc.
│   │   │   ├── components/# ProtectedRoute, shared UI wrappers
│   │   │   ├── store/     # Zustand global store
│   │   │   └── utils/     # supabaseClient
│   │   ├── Dockerfile     # Multi-stage nginx build
│   │   └── nginx.conf     # nginx reverse proxy config
│   └── backend/           # FastAPI Python service
│       ├── main.py        # All API routes and extractors
│       ├── auth.py        # Bearer token validation
│       ├── config.py      # Pydantic settings
│       ├── fireworks.py   # Fireworks AI streaming client
│       └── test_main.py   # Full pytest test suite
├── packages/
│   ├── types/             # Shared TypeScript interfaces
│   ├── ui/                # Component library (Button, Card, Badge)
│   ├── config/            # Shared API config
│   └── shared/            # Utility functions
├── .github/workflows/     # CI/CD GitHub Actions
├── docker-compose.yml     # Production compose
├── docker-compose.dev.yml # Development override
├── railway.json           # Railway backend deployment
├── vercel.json            # Vercel frontend deployment
└── .env.example           # Environment variable template
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.12+
- npm 10+

### 1. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Supabase (https://supabase.com/dashboard → Project Settings → API)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Fireworks AI (https://fireworks.ai/api-keys)
FIREWORKS_API_KEY=fw_your_key
```

> **Note:** If keys are not set, both frontend and backend engage simulation fallback modes — the full dashboard remains functional for local evaluation without API keys.

### 2. Start development servers

**Windows (recommended):**
```bat
.\scripts\dev.bat
```

**Manual:**
```bash
# Terminal 1 — Frontend (port 3000)
npm install
npm run dev:frontend

# Terminal 2 — Backend (port 8000)
cd apps/backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The frontend Vite dev server proxies all `/api/*` requests to the backend automatically.

---

## Docker Deployment

### Production

```bash
# Build and start all services
docker compose up --build -d

# Check status
docker compose ps

# View logs
docker compose logs -f backend
```

| Service | URL |
|---|---|
| Frontend (nginx) | http://localhost:3000 |
| Backend (uvicorn) | http://localhost:8000 |

### Development override

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Enables uvicorn `--reload` and source volume mounts for live backend editing.

---

## API Reference

### Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Service health status |
| GET | `/ready` | Readiness probe |
| GET | `/version` | Build version |

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login (email + password) |
| POST | `/api/auth/signup` | Register new account |
| POST | `/api/auth/logout` | End session |
| GET | `/api/me` | Current user profile |

### AI Inference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/chat` | Synchronous chat completion |
| POST | `/api/chat/stream` | SSE streaming chat completion |
| POST | `/api/upload` | Upload file + AI summary |
| POST | `/api/evaluate` | Run evaluation test case |

---

## Testing

### Backend (pytest)

```bash
cd apps/backend
pytest test_main.py -v
```

Test coverage:
- Health / Ready / Version probes
- Auth login, signup, logout, `/me`
- Chat completions (sync, streaming, JSON mode)
- File upload (TXT, JSON, CSV)
- Evaluation endpoint (efficiency, custom validator)
- 404 / 405 error handling

### Frontend (TypeScript)

```bash
npm run build:frontend
```

TypeScript compiler validates all types on every build.

---

## Deployment

### Vercel (Frontend)

1. Import repository in [vercel.com](https://vercel.com)
2. Set build command: `npm run build:frontend`
3. Set output directory: `apps/frontend/dist`
4. Add environment variables from `.env.example`
5. Update `vercel.json` with your Railway backend URL

### Railway (Backend)

1. Create new project at [railway.app](https://railway.app)
2. Connect repository — Railway auto-detects `railway.json`
3. Set environment variables: `FIREWORKS_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`
4. Deploy — Railway builds from `apps/backend/Dockerfile`

### Docker Registry (GHCR)

Images are automatically built and pushed on every push to `main`:

```
ghcr.io/<your-username>/pandora-backend:latest
ghcr.io/<your-username>/pandora-frontend:latest
```

Pull and run anywhere:

```bash
docker pull ghcr.io/<your-username>/pandora-backend:latest
docker pull ghcr.io/<your-username>/pandora-frontend:latest
docker compose up -d
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL (frontend) |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon key (frontend) |
| `SUPABASE_URL` | Yes | Supabase project URL (backend) |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon key (backend) |
| `FIREWORKS_API_KEY` | Yes | Fireworks AI API key |

---

## License

MIT — built for production use.
