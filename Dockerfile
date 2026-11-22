# Stage 1: Build the application
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package definitions
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies required for vite build)
RUN npm ci

# Copy source and config files
COPY . .

# Build production bundle into /app/dist
RUN npm run build

# Stage 2: Production runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled frontend from builder
COPY --from=builder /app/dist ./dist

# Copy server files
COPY --from=builder /app/server ./server

# Run as non-root user
USER node

# Expose default application port for Coolify
EXPOSE 3000

# Healthcheck to ensure container is responsive
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || exit 1

# Start the unified web + WebRTC signaling server
CMD ["node", "server/index.mjs"]
