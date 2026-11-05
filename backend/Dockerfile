# ====================================================================
# Stage 1: Build dependencies (with Python/C++ toolchain for better-sqlite3)
# ====================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install native build tools required to compile better-sqlite3 on Alpine
RUN apk add --no-cache python3 make g++

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies (including better-sqlite3)
RUN npm ci --omit=dev

# Build frontend if source exists in build context
COPY frontend ./frontend
RUN if [ -f "frontend/package.json" ]; then \
      cd frontend && npm install && npm run build; \
    fi

# ====================================================================
# Stage 2: Clean, minimal runtime image
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

# Copy fresh frontend build from builder stage if compiled
RUN if [ -d "/app/frontend/dist" ]; then \
      mkdir -p public && cp -r /app/frontend/dist/* public/; \
    fi

# Container environment
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Start production server
CMD ["node", "server.js"]
