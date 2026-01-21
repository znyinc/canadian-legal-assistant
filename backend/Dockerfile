FROM node:20-bullseye AS base

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Prisma client
COPY prisma ./prisma
RUN npx prisma generate

# App source
COPY . .

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

# Run migrations then start server
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npm start"]
