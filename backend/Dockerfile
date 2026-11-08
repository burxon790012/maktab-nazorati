# ====================================================================
# Stage 1: Build frontend
# ====================================================================
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ====================================================================
# Stage 2: Build dependencies (with Python/C++ toolchain for better-sqlite3)
# ====================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install native build tools required to compile better-sqlite3 on Alpine
RUN apk add --no-cache python3 make g++

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies (including better-sqlite3)
RUN npm ci --omit=dev

# ====================================================================
# Stage 3: Clean, minimal runtime image
# ====================================================================
FROM node:22-alpine

WORKDIR /app

# Add libstdc++ runtime required for native C++ addons
RUN apk add --no-cache libstdc++

# Copy built node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Copy application source files
COPY . .

# If built from repository root, bring backend/ files to /app root
RUN if [ -d "backend" ] && [ -f "backend/server.js" ]; then \
      cp -rn backend/* . 2>/dev/null || cp -r backend/* .; \
    fi

# Ensure production public folders contain fresh frontend build
COPY --from=frontend-builder /app/frontend/dist ./public
COPY --from=frontend-builder /app/frontend/dist ./backend/public

# Container environment
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Start production server
CMD ["node", "server.js"]
