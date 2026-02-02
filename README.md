# ?? Project Voyager: Agentic Travel Orchestrator

> **Solving the Hallucination, Latency & Cost problem in AI travel planning**

Voyager is a distributed, agentic system that generates **100% valid travel itineraries** in under 20 seconds using a "Smart Guardrail" architecture.

---

## ?? Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Development](#development)
- [Deployment](#deployment)
- [Documentation](#documentation)

---

## ? Features

- **?? 100% Precision**: Valid locations via Mapbox Geocoding + Google Places
- **? <20s Generation**: Parallel intent execution
- **?? Cost-Optimized**: "CFO Logic" validates budgets before AI compute
- **?? Real-Time Updates**: WebSocket progress notifications
- **??? Interactive Maps**: Mapbox GL with clustering
- **?? Agentic Workflow**: Self-correcting AI with tool validation

---

## ??? Architecture

```
???????????????      ???????????????      ???????????????
?   Frontend  ????????   Backend   ????????   Worker    ?
?  (React)    ?      ?  (Express)  ?      ?  (BullMQ)   ?
???????????????      ???????????????      ???????????????
                            ?                     ?
                            ?                     ?
                     ???????????????      ???????????????
                     ?   MongoDB   ?      ?    Redis    ?
                     ???????????????      ???????????????
                                                  ?
                                          ?????????????????
                                          ?   AI Agent    ?
                                          ?  (Gemini)     ?
                                          ?????????????????
```

**Stack:**
- **Frontend**: React 19, Vite, TailwindCSS, Shadcn UI, Mapbox GL
- **Backend**: Node.js, Express, BullMQ, Mongoose
- **AI**: Gemini 1.5 Flash (Intents) + Pro (Reasoning)
- **Validation**: Mapbox Search + Google Places API
- **Infrastructure**: Docker, Railway/Render

---

## ?? Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- MongoDB (or use Docker)
- Redis (or use Docker)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/voyager.git
cd voyager

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend/web && npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env and fill in:
# - CLERK_SECRET_KEY
# - OPENAI_API_KEY
# - MAPBOX_ACCESS_TOKEN
# - GOOGLE_PLACES_API_KEY
```

### 3. Start with Docker (Recommended)

```bash
# Start all services (MongoDB, Redis, API, Worker)
docker-compose up

# API: http://localhost:3000
# Swagger Docs: http://localhost:3000/api/docs
```

### 4. Start Manually (Development)

```bash
# Terminal 1: Start MongoDB & Redis
docker-compose up mongodb redis

# Terminal 2: Start API
cd backend
npm run dev

# Terminal 3: Start Worker
cd backend
npm run worker

# Terminal 4: Start Frontend
cd frontend/web
npm run dev
```

---

## ??? Development

### Project Structure

```
voyager/
??? backend/              # Node.js API & Worker
?   ??? src/
?   ?   ??? config/       # Environment & DB
?   ?   ??? features/     # Domain-based modules
?   ?   ?   ??? planner/  # Trip generation logic
?   ?   ?   ??? auth/     # Clerk integration
?   ?   ?   ??? user/     # User management
?   ?   ??? lib/          # Queue, Logger
?   ?   ??? middlewares/  # Auth, Validation
?   ?   ??? index.ts      # API Entry
?   ??? Dockerfile
??? frontend/
?   ??? web/              # React SPA
?       ??? src/
?       ?   ??? features/ # Domain modules
?       ?   ??? components/
?       ?   ??? lib/
??? docs/
?   ??? agents/           # Agent role documentation
??? docker-compose.yml
??? README.md
```

### Scripts

```bash
# Backend
npm run dev          # Start API (hot reload)
npm run worker       # Start Worker (hot reload)
npm run build        # Compile TypeScript
npm run typecheck    # Type checking

# Frontend
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run preview      # Preview production build
```

### Architecture Principles

- **Feature-First**: Code organized by business domain, not file type
- **Repository Pattern**: Controllers ? Services ? Repositories
- **Rule of 200**: Max 200 lines per file
- **Fire & Listen**: Async jobs via BullMQ, no blocking HTTP

See `docs/agents/` for detailed role-based guidelines:
- `architect.md` - System design
- `backend.md` - API standards
- `frontend.md` - UI patterns
- `devops.md` - Infrastructure
- `qa.md` - Testing strategy

---

## ?? Deployment

### Railway (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

Configuration is in `railway.toml`.

### Render

1. Fork this repository
2. Create new Blueprint instance on Render
3. Point to `render.yaml`
4. Set environment variables in dashboard

### Vercel (Frontend Only)

```bash
cd frontend/web
vercel deploy --prod
```

---

## ?? Documentation

- **[Plan](docs/agents/plan.md)**: 10-week execution roadmap
- **[Architecture](docs/agents/architect.md)**: Domain modeling & state machines
- **[Backend](docs/agents/backend.md)**: API patterns & best practices
- **[Frontend](docs/agents/frontend.md)**: UI/UX standards
- **[DevOps](docs/agents/devops.md)**: Infrastructure & CI/CD
- **[QA](docs/agents/qa.md)**: Testing strategy

---

## ?? Security

- Environment validation via `envalid` (startup fails if keys missing)
- AI output sanitized via `DOMPurify`
- Zod validation on all requests
- Clerk for authentication
- Rate limiting on external APIs (Circuit Breakers)

---

## ?? Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Load testing
npm run test:load
```

---

## ?? License

MIT

---

## ?? Contributing

1. Read `docs/agents/` for role-specific guidelines
2. Follow the "Rule of 200" (max 200 lines per file)
3. Use feature branches (`feature/trip-optimizer`)
4. Submit PR with clear description

---

## ?? Support

- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/voyager/issues)
- **Docs**: [docs/agents/](docs/agents/)

---

**Built with ?? using the Agentic Architecture Pattern**
