FROM node:22-alpine

WORKDIR /app

# Install production dependencies using locked versions from backend
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy backend application source code
COPY backend/ ./

# Server port
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Start server
CMD ["node", "server.js"]

