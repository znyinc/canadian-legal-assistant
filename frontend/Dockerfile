# Build stage
FROM node:20-bullseye AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

ARG VITE_API_BASE_URL=http://localhost:3001
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80

# Minimal nginx config stays default; API base URL baked at build time
