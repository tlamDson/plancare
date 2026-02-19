# 🧳 Project Voyager: Distributed Agentic Travel Orchestrator

> An agentic, distributed system that solves the "Hallucination," "Latency," and "Cost" problems in AI travel planning.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
  - [1. Installation](#1-installation)
  - [2. Environment Variables](#2-environment-variables)
  - [3. Start Services](#3-start-services)
  - [4. Run Frontend](#4-run-frontend)
  - [5. Run Backend API](#5-run-backend-api)
  - [6. Run Worker (Optional)](#6-run-worker-optional)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Documentation](#documentation)
- [Contributing](#contributing)

---

## Overview

**Voyager** is a next-generation travel planning platform that combines AI reasoning with verified real-world data. Instead of blindly trusting AI hallucinations, we implement:

- **Smart Guardrails:** CFO Logic pre-validates budgets before AI generation
- **Precision Mapping:** 100% valid locations via Mapbox Geocoding + Google Places verification
- **Performance:** <20 second trip generation using parallel intent execution
- **Scalability:** Handles 1-day sprints to 30-day marathons via paginated processing

### Core Value Proposition

| Pillar | Solution |
|--------|----------|
| **Precision** | 100% valid markers (Ratings > 4.0) using Mapbox + Google Places |
| **Intelligence** | CFO Logic layer rejects impossible budgets upfront |
| **Performance** | Parallel Intent Execution + Exponential Backoff polling |
| **Scalability** | Hot/Cold batch processing for long trips (Eventual Consistency) |

---

## Tech Stack

### 🏗️ **Monorepo & Build**

| Layer | Technology |
|-------|-----------|
| **Monorepo** | TypeScript with npm Workspaces + Turborepo |
| **Package Manager** | npm 10.9.3+ (npm workspaces) |
| **Build Tool** | Vite (Frontend), TypeScript Compiler (Backend) |

### 🎨 **Frontend**

| Component | Technology |
|-----------|-----------|
| **Framework** | React 18+ (Vite) |
| **Styling** | Tailwind CSS + CVA (Class Variance Authority) |
| **UI Components** | Shadcn UI (Unstyled Radix Components) |
| **State Management** | React Query (Server State) + Zustand (Client State) |
| **Routing** | React Router v6 |
| **Maps** | Mapbox GL JS |
| **Forms** | React Hook Form + Zod |
| **Async Pattern** | Polling with Exponential Backoff (1s → 10s) |

### 🔧 **Backend API**

| Component | Technology |
|-----------|-----------|
| **Runtime** | Node.js 20+ (Express) |
| **API Framework** | Express.js |
| **Database** | MongoDB (Mongoose) |
| **Validation** | Zod + Envalid (Config) |
| **Logging** | Pino (Structured JSON Logging) |
| **Task Queue** | BullMQ + Redis |
| **Authentication** | Clerk |
| **Circuit Breaker** | Opossum (for external API resilience) |

### 🤖 **AI & LLM**

| Component | Model |
|-----------|-------|
| **Intent Generation** | Google Gemini 1.5 Flash |
| **Reasoning Engine** | Google Gemini 3 Pro |
| **Tool Framework** | LangChain |

### 🔌 **External APIs**

| Service | Purpose |
|---------|---------|
| **Mapbox Search API** | Geocoding & coordinate precision |
| **Google Places API** | Ratings, reviews, operational status verification |
| **Clerk Auth** | User authentication & management |

### 📦 **Infrastructure**

| Service | Deployment |
|---------|-----------|
| **Frontend** | Vercel |
| **Backend API** | Railway / Render |
| **Worker** | Railway / Render (Auto-scaling 1-5 replicas) |
| **Redis** | Railway / Render (In-memory queue broker) |
| **MongoDB** | MongoDB Atlas / Docker (local) |
| **Containerization** | Docker (Multi-stage builds, <200MB images) |
| **CI/CD** | GitHub Actions |

### 🧪 **Testing & QA**

| Layer | Tools |
|-------|-------|
| **Unit Tests** | Vitest |
| **E2E Tests** | Playwright |
| **Load Testing** | Artillery.io |
| **Mocking** | msw (Mock Service Worker) |

---

## Architecture

### High-Level Flow

```
User Request (Web)
       ↓
   [API Layer] - Validate & Queue
       ↓
   [Redis Queue] - Job Management (BullMQ)
       ↓
   [Worker] - AI + Verification Pipeline
       ↓
   [MongoDB] - Persist Trip Data
       ↓
   [UI Poll] - Display Results
```

### Distributed State Machine

```
DRAFT → QUEUED → PROCESSING_STEP_1 → PROCESSING_STEP_2 → COMPLETED
                                                        ↘ FAILED
```

### Monorepo Structure

```
TravelPlan/
├── frontend/                 # React Web App
│   └── web/src/
│       ├── features/         # Business domains (planner, auth, map)
│       ├── components/       # Shared UI library
│       ├── hooks/            # Custom React hooks
│       └── stores/           # Zustand state slices
├── backend/                  # Express API
│   └── src/
│       ├── features/         # Business domains (planner, auth)
│       ├── lib/              # Utilities (Logger, Queue Factory)
│       ├── middlewares/      # Auth, Rate Limiting
│       └── config/           # Environment validation
├── packages/shared/          # Monorepo shared kernel
│   └── src/
│       ├── schemas/          # Zod validation schemas
│       ├── types/            # TypeScript interfaces
│       └── constants/        # Shared constants
├── docker-compose.yml        # Local dev environment (MongoDB + Redis)
├── package.json              # Workspace root
└── tsconfig.base.json        # Base TypeScript config
```

---

## Prerequisites

Before starting, ensure you have installed:

- **Node.js** 20+ ([download](https://nodejs.org/))
  - Includes npm 10.9.3+ by default
- **Docker** & **Docker Compose** ([download](https://www.docker.com/products/docker-desktop))
- **Git** (for cloning & version control)

### Verify Installation

```bash
node --version    # v20.x.x
npm --version     # 10.9.3+
docker --version  # Docker version 24+
```

---

## Local Development Setup

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/travelplan.git
cd TravelPlan

# Install dependencies (all workspaces at once)
npm install
```

### 2. Environment Variables

Create `.env.local` files in the appropriate directories:

#### **Backend Configuration** (`backend/.env.local`)

```bash
# API Configuration
PORT=3000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/voyager
MONGO_DB_NAME=voyager

# Redis & Queue
REDIS_URL=redis://localhost:6379
BULLMQ_QUEUE_NAME=trip-generation

# Authentication
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# AI & LLM
GEMINI_API_KEY=your_gemini_api_key

# External APIs
MAPBOX_API_KEY=your_mapbox_api_key
GOOGLE_PLACES_API_KEY=your_google_places_api_key

# Logging
LOG_LEVEL=debug
```

#### **Frontend Configuration** (`frontend/web/.env.local`)

```bash
# API
VITE_API_URL=http://localhost:3000
VITE_API_TIMEOUT=30000

# Authentication (Clerk)
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Maps
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token

# Environment
VITE_ENV=development
```

> **Tip:** Copy from `.env.example` if it exists:
> ```bash
> cp backend/.env.example backend/.env.local
> cp frontend/web/.env.example frontend/web/.env.local
> ```

### 3. Start Services

#### **Option A: Docker Compose (Recommended for Local Dev)**

```bash
# Start MongoDB & Redis in Docker
docker-compose up -d mongodb redis

# Verify services are running
docker-compose ps

# Check logs
docker-compose logs -f mongodb redis
```

**What This Does:**
- 🗄️ **MongoDB** on `localhost:27017` (no auth)
- 🔴 **Redis** on `localhost:6379` (no auth)
- 📊 Both have persistent volumes in `./data/`

#### **Option B: Local MongoDB & Redis (Without Docker)**

```bash
# macOS (Homebrew)
brew install mongodb-community redis
brew services start mongodb-community
brew services start redis

# Linux (Ubuntu/Debian)
sudo apt-get install mongodb redis-server
sudo systemctl start mongodb
sudo systemctl start redis-server

# Windows (WSL2 / Manual Install)
# See: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/
```

### 4. Run Frontend

```bash
# From root directory, start frontend in dev mode
npm run dev:web

# Opens at: http://localhost:5173
```

**Or manually:**

```bash
# Navigate to frontend directory
cd frontend/web

# Start development server
npm run dev

# Opens at: http://localhost:5173
```

**Expected Output:**
```
VITE v5.0.0 ready in 250 ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

### 5. Run Backend API

**From root directory:**

```bash
# Start backend in dev mode
npm run dev:api

# Server runs on: http://localhost:3000
```

**Or manually:**

```bash
# Navigate to backend directory
cd backend

# Run database migrations (if applicable)
npm run migrate

# Start development server
npm run dev

# Server runs on: http://localhost:3000
```

**Expected Output:**
```
[INFO] Server listening on port 3000
[INFO] MongoDB connected to localhost:27017
[INFO] Redis connected to localhost:6379
```

**Available Endpoints:**
- `GET /health` - Health check
- `GET /ready` - Readiness check
- `POST /api/trips` - Create a new trip
- `GET /api/trips` - List user's trips
- `GET /api/trips/:tripId` - Get trip details

### 6. Run Worker (Optional)

To process async jobs locally, start the worker in a third terminal:

**From root directory:**

```bash
# Start worker process
npm run dev:worker
```

**Or manually:**

```bash
# Navigate to backend directory
cd backend

# Start worker process
npm run worker

# Expected Output:
# [INFO] Worker started, processing jobs...
```

---

## Development Workflow

### Quick Start (All 3 Services)

**Terminal 1: Services (MongoDB, Redis)**
```bash
docker-compose up mongodb redis
```

**Terminal 2: Frontend (React)**
```bash
npm run dev:web
```

**Terminal 3: Backend (Express)**
```bash
npm run dev:api
```

**Terminal 4 (Optional): Worker (BullMQ Consumer)**
```bash
npm run dev:worker
```

### Testing a Trip Request

```bash
# Create a trip via curl
curl -X POST http://localhost:3000/api/trips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -d '{
    "preferences": {
      "destination": "Paris",
      "startDate": "2026-06-01",
      "endDate": "2026-06-07",
      "budget": { "total": 1000, "currency": "USD" },
      "travelers": { "adults": 2, "children": 0 }
    }
  }'

# Expected Response:
# {
#   "success": true,
#   "tripId": "67a5c2e8f1234567890abcd0",
#   "jobId": "1",
#   "status": "QUEUED"
# }

# Poll for status updates
curl http://localhost:3000/api/trips/67a5c2e8f1234567890abcd0 \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

---

## Project Structure

### Frontend (`frontend/web/`)

```
src/
├── app/                   # Routing & providers
├── features/
│   ├── planner/          # Trip planning domain
│   │   ├── api/          # API calls (trips.api.ts)
│   │   ├── components/   # UI components
│   │   ├── hooks/        # useTripPoller, useTripActions
│   │   ├── pages/        # Page components
│   │   └── stores/       # Zustand state
│   ├── auth/             # Clerk authentication
│   └── map/              # Mapbox integration
├── components/           # Shared UI library
├── lib/                  # Utilities (axios, DOMPurify)
└── utils/                # Helper functions
```

### Backend (`backend/`)

```
src/
├── features/
│   ├── planner/          # Trip planning domain
│   │   ├── controllers/  # HTTP handlers
│   │   ├── services/     # Business logic
│   │   ├── repositories/ # Data access
│   │   ├── jobs/         # BullMQ processors
│   │   └── schemas/      # Zod validation
│   └── auth/             # Authentication
├── config/               # Environment validation
├── lib/                  # Logger, Queue factory
├── middlewares/          # Auth guards, rate limiting
└── index.ts              # Entry point
```

### Shared (`packages/shared/`)

```
src/
├── schemas/              # Zod validation (trip.schema.ts, user.schema.ts)
├── types/                # TypeScript interfaces
└── constants/            # Shared enums (status, currency)
```

---

## Key Features

### ✅ Phase 1: Foundation (Complete)

- [x] Monorepo with Yarn Workspaces
- [x] Docker Compose for local dev
- [x] BullMQ + Redis integration
- [x] CFO Logic (Budget validation)
- [x] DB-First Pattern (MongoDB)
- [x] Polling endpoints with exponential backoff
- [x] Agent locking (concurrency safety)

### 🚧 Phase 2: Intent Engine (In Progress)

- [ ] Mapbox Geocoding integration
- [ ] Google Places verification
- [ ] Parallel validation tools
- [ ] Circuit breaker (Opossum)
- [ ] Gemini AI integration

### 📋 Phase 3-4: UX & Scale (Planned)

- [ ] Travel DNA (User preferences)
- [ ] Real-time progress updates
- [ ] Interactive maps with clustering
- [ ] Long trip pagination
- [ ] Self-healing fallbacks

---

## Documentation

For detailed architectural decisions and protocols, see:

| Document | Purpose |
|----------|---------|
| `docs/PLAN.md` | 10-week roadmap & strategy |
| `docs/PROGRESS.md` | Current sprint status |
| `docs/ROLES_LOADED.md` | Agent role system |
| `docs/agents/architect.md` | System design principles |
| `docs/agents/backend.md` | API standards & patterns |
| `docs/agents/frontend.md` | React & state management rules |
| `docs/agents/devops.md` | Infrastructure & CI/CD |
| `docs/agents/qa.md` | Testing & QA protocols |
| `docs/agents/plan.md` | Timeline & milestones |

---

## Development Standards

### Code Quality

- **Rule of 200:** No file should exceed 200 lines
- **Repository Symmetry:** Features exist in frontend, backend, and worker
- **Layered Architecture:** Controllers → Services → Repositories
- **Structured Logging:** All logs include `jobId` or `correlationId`

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/trip-optimization

# Commit with semantic messages
git commit -m "feat(planner): add Mapbox geocoding tool"

# Push and create PR
git push origin feature/trip-optimization
```

### PR Checklist

- [ ] No files exceed 200 lines
- [ ] Zod validation on all inputs
- [ ] Structured logging with jobId
- [ ] Tests pass (`npm run test:unit`)
- [ ] Types check (`npm run typecheck`)
- [ ] No `console.log` statements
- [ ] Accessibility verified for UI changes

---

## Troubleshooting

### MongoDB Connection Failed

```bash
# Check if MongoDB is running
docker-compose ps mongodb

# Restart services
docker-compose down
docker-compose up -d mongodb redis

# Verify on correct port
telnet localhost 27017
```

### Redis Connection Refused

```bash
# Check Redis logs
docker-compose logs redis

# Restart Redis
docker-compose restart redis
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process or use different port
PORT=3001 npm run dev:api    # Backend
VITE_PORT=5174 npm run dev:web  # Frontend
```

### Clerk Authentication Not Working

1. Verify `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are correct
2. Check Clerk dashboard for test/live key mismatch
3. Ensure redirect URLs are configured in Clerk settings

---

## Performance Targets (SLA)

| Metric | Target |
|--------|--------|
| **Trip Generation** | < 20 seconds |
| **Valid Locations** | 100% (Ratings > 4.0) |
| **API Latency** | < 200ms (queue operation) |
| **Worker Queue Lag** | < 60 seconds |
| **Redis Memory** | < 500MB |

---

## Contributing

1. **Read the Docs:** Start with `docs/ROLES_LOADED.md` to understand the agent system
2. **Pick a Role:** Understand which engineer perspective you need
3. **Check Standards:** Review relevant agent doc (`docs/agents/*.md`)
4. **Follow Patterns:** Use existing code as templates
5. **Test Thoroughly:** Unit tests + E2E tests required
6. **Submit PR:** Include description of changes and design decisions

---

## Support & Contact

For questions or issues:

- 📖 Check the documentation in `docs/`
- 🐛 Open a GitHub issue
- 💬 Discuss in pull request comments

---

## License

MIT License - See `LICENSE` file for details

---

**Last Updated:** 2026-02-10  
**Status:** 🟢 Phase 1 Complete, Phase 2 In Progress
