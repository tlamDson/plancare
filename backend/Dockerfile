# ============================================
# MULTI-STAGE DOCKER BUILD
# Stage 1: Builder (Compile TypeScript)
# Stage 2: Development (Hot Reload)
# Stage 3: Production (Optimized)
# ============================================

# ============================================
# STAGE 1: BUILDER
# ============================================
FROM node:20-slim AS builder

WORKDIR /app

# Copy root package files (monorepo workspace)
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy backend package files
COPY backend/package*.json ./backend/

# Copy shared package files (workspace dependency)
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies from root (handles workspace linking)
RUN npm ci

# Copy all source code
COPY backend/src ./backend/src
COPY backend/tsconfig.json ./backend/
COPY packages/shared/src ./packages/shared/src
COPY packages/shared/tsconfig.json ./packages/shared/

# Build shared package first
RUN npm run build -w packages/shared

# Build backend
RUN npm run build -w backend

# ============================================
# STAGE 2: DEVELOPMENT (Hot Reload)
# ============================================
FROM node:20-slim AS development

WORKDIR /app

# Copy root package files (monorepo workspace)
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy backend package files
COPY backend/package*.json ./backend/

# Copy shared package files (workspace dependency)
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies from root (handles workspace linking)
RUN npm ci

# Copy source for hot reload (volume mount overrides this)
COPY backend/src ./backend/src
COPY backend/tsconfig.json ./backend/
COPY packages/shared/src ./packages/shared/src
COPY packages/shared/tsconfig.json ./packages/shared/

# Build shared package (required for @travelplan/shared imports)
RUN npm run build -w packages/shared

# Expose port
EXPOSE 3000

# Default command (can be overridden in docker-compose)
CMD ["npm", "run", "dev", "-w", "backend"]

# ============================================
# STAGE 3: PRODUCTION (Optimized <200MB)
# ============================================
FROM node:20-slim AS production

# Set environment
ENV NODE_ENV=production

WORKDIR /app

# Copy root package files (monorepo workspace)
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy backend package files
COPY backend/package*.json ./backend/

# Copy shared package files (workspace dependency)
COPY packages/shared/package*.json ./packages/shared/

# Install ONLY production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy compiled code from builder (backend & shared)
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "backend/dist/backend/src/index.js"]
