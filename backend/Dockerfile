FROM node:18-alpine

WORKDIR /app

# Bog'liqliklarni o'rnatish
COPY package*.json ./
RUN npm install --production

# Loyiha fayllarini nusxalash
COPY . .

# Server porti
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Serverni ishga tushirish
CMD ["node", "server.js"]
