FROM node:22-alpine

WORKDIR /app

# Install production dependencies only using locked versions
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Server port
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Start server
CMD ["node", "server.js"]
