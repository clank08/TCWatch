# Production Dockerfile for TCWatch Backend
# Optimized for minimal size and security

FROM node:20-alpine AS base

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init curl && \
    rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S tcwatch -u 1001 -G nodejs

# Install dependencies stage
FROM base AS deps

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev --frozen-lockfile && \
    npm cache clean --force

# Build stage
FROM base AS build

# Copy package files
COPY package*.json ./

# Install all dependencies for building
RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN npm run build && \
    npm prune --omit=dev

# Runtime stage
FROM base AS runtime

# Copy production dependencies
COPY --from=deps --chown=tcwatch:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=build --chown=tcwatch:nodejs /app/dist ./dist
COPY --from=build --chown=tcwatch:nodejs /app/package*.json ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Switch to non-root user
USER tcwatch

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["dumb-init", "node", "dist/index.js"]