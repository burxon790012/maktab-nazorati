FROM node:22-alpine

WORKDIR /app

# Copy package files (present both in root and backend)
COPY package*.json ./

# Install production dependencies only (omit dev and optional like better-sqlite3)
RUN npm ci --omit=dev --omit=optional

# Copy application source files
COPY . .

# If built with root context, ensure backend files are in /app root
RUN if [ -d "backend" ] && [ -f "backend/server.js" ]; then \
      cp -rn backend/* . 2>/dev/null || cp -r backend/* .; \
    fi

# Server port
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Start server
CMD ["node", "server.js"]
