# 🚀 Voyager Quick Start Guide

Get up and running with Project Voyager in 10 minutes.

---

## Prerequisites

- **Node.js 20+** (check: `node --version`)
- **Docker & Docker Compose** (check: `docker --version`)
- **Clerk Account** (for authentication)

---

## Step 1: Clone & Install

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/voyager.git
cd voyager

# Install backend dependencies
cd backend
npm install
cd ..
```

---

## Step 2: Environment Setup

```bash
# Copy the environment template
cp .env.example .env

# Edit .env and add your API keys
nano .env
```

### Required Keys

```env
# Get from: https://dashboard.clerk.com
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...

# Get from: https://platform.openai.com (Week 4+)
OPENAI_API_KEY=sk-...

# Get from: https://account.mapbox.com (Week 3+)
MAPBOX_ACCESS_TOKEN=pk....

# Get from: https://console.cloud.google.com (Week 3+)
GOOGLE_PLACES_API_KEY=AIza...
```

---

## Step 3: Start Services

### Option A: Docker Compose (Recommended)

```bash
# Start all services (MongoDB, Redis, API, Worker)
docker-compose up

# Or run in background
docker-compose up -d
```

**Services will be available at:**
- API: http://localhost:3000
- API Docs: http://localhost:3000/api/docs
- MongoDB: localhost:27017
- Redis: localhost:6379

### Option B: Manual Start (Development)

```bash
# Terminal 1: Start MongoDB & Redis
docker-compose up mongodb redis

# Terminal 2: Start API
cd backend
npm run dev

# Terminal 3: Start Worker
cd backend
npm run worker
```

---

## Step 4: Verify Installation

### Check Health

```bash
# API health check
curl http://localhost:3000/health

# Expected: {"status":"ok","timestamp":"2026-01-30T..."}
```

### Check Database Connectivity

```bash
# Ready check (verifies MongoDB + Redis)
curl http://localhost:3000/ready

# Expected: {"status":"ready","mongodb":"connected","redis":"connected",...}
```

---

## Step 5: Test CFO Validation

### Valid Request (Should Succeed)

```bash
curl -X POST http://localhost:3000/api/trips \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "destination": "Paris",
      "startDate": "2026-06-01T00:00:00Z",
      "endDate": "2026-06-07T00:00:00Z",
      "budget": {
        "total": 1000,
        "currency": "USD"
      },
      "travelers": {
        "adults": 2,
        "children": 0
      }
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Trip generation started",
  "jobId": "1234-5678-9012",
  "tripId": "65f1a2b3c4d5e6f7g8h9i0j1"
}
```

### Invalid Request (Budget Too Low - Should Fail)

```bash
curl -X POST http://localhost:3000/api/trips \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "destination": "Paris",
      "startDate": "2026-06-01T00:00:00Z",
      "endDate": "2026-06-07T00:00:00Z",
      "budget": {
        "total": 50,
        "currency": "USD"
      },
      "travelers": {
        "adults": 2,
        "children": 0
      }
    }
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Budget is too low. Minimum $20/day per person required."
}
```

---

## Step 6: Check Worker Logs

```bash
# If using Docker Compose
docker-compose logs -f worker

# Expected output:
# [INFO] 🚀 Starting trip generation
# [INFO] Step 1: Initializing...
# [INFO] Step 2: AI generation (placeholder)...
# [INFO] Step 3: Finalizing...
# [INFO] ✅ Trip generation completed
```

---

## Step 7: Query Trip Status

```bash
# Get trip by ID (replace TRIP_ID with actual ID from Step 5)
curl http://localhost:3000/api/trips/TRIP_ID
```

---

## 🛠️ Development Commands

```bash
# Backend
cd backend
npm run dev          # Start API (hot reload)
npm run worker       # Start Worker (hot reload)
npm run build        # Compile TypeScript
npm run typecheck    # Type checking

# Docker
docker-compose up           # Start all services
docker-compose down         # Stop all services
docker-compose logs -f api  # View API logs
docker-compose ps           # List running services

# Database
docker exec -it voyager-mongodb mongosh  # Access MongoDB shell
docker exec -it voyager-redis redis-cli  # Access Redis CLI
```

---

## 📊 API Documentation

Visit **http://localhost:3000/api/docs** for interactive Swagger documentation.

### Key Endpoints

| Method | Endpoint               | Description                    |
|--------|------------------------|--------------------------------|
| POST   | `/api/trips`           | Generate new trip              |
| GET    | `/api/trips/:tripId`   | Get trip by ID (polling)       |
| GET    | `/api/trips`           | Get user's trips               |
| GET    | `/health`              | Health check (uptime)          |
| GET    | `/ready`               | Readiness check (DB + Redis)   |

---

## 🐛 Troubleshooting

### "Cannot connect to MongoDB"

```bash
# Check if MongoDB is running
docker ps | grep mongodb

# View MongoDB logs
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

### "Cannot connect to Redis"

```bash
# Check if Redis is running
docker ps | grep redis

# Test Redis connection
docker exec -it voyager-redis redis-cli ping
# Expected: PONG
```

### "Worker not processing jobs"

```bash
# Check worker logs
docker-compose logs worker

# Ensure Redis is accessible
docker exec -it voyager-redis redis-cli
> LLEN bull:trip-generation:wait
# Should return number of queued jobs
```

### "Port 3000 already in use"

```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process or change PORT in .env
```

---

## 🎯 Next Steps

1. **Read the Plan**: `docs/agents/plan.md` - Understand the 10-week roadmap
2. **Week 3 Tasks**: Implement Mapbox and Google Places integration
3. **Week 4 Tasks**: Add AI agent (Gemini) for intent generation
4. **Frontend**: Start the React web app (see `frontend/web/README.md`)

---

## 📚 Additional Resources

- [Project README](./README.md) - Full documentation
- [Progress Tracker](./docs/PROGRESS.md) - Current implementation status
- [Backend Standards](./docs/agents/backend.md) - Code guidelines
- [Architecture](./docs/agents/architect.md) - System design

---

## 🤝 Need Help?

- **Issues**: https://github.com/YOUR_USERNAME/voyager/issues
- **Docs**: `docs/` folder
- **Logs**: `docker-compose logs -f`

---

**You're ready to build! 🚀**
