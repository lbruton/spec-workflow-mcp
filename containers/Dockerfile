# Build stage
FROM node:24-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source files
COPY src ./src
COPY scripts ./scripts
COPY tsconfig.json ./tsconfig.json
COPY vitest.config.ts ./vitest.config.ts

# Build the application (increase heap size for Vite build)
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Runtime stage
FROM node:24-alpine
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy only production files
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/dist ./dist

RUN mkdir -p /workspace /workspace/.specflow-mcp

# Change ownership of the app directory to the node user (uid=1000)
RUN chown -R node:node /app /workspace

# Switch to non-root user for security
USER node

WORKDIR /workspace

# Security: Set environment variables for secure defaults
ENV SPEC_WORKFLOW_HOME=/workspace/.specflow-mcp
ENV NODE_ENV=production

# Docker networking: Bind to 0.0.0.0 inside container (required for port forwarding to work)
# Security is controlled by Docker's port mapping (see docker-compose.yml)
# - Default: 127.0.0.1:5000:5000 exposes only to host's localhost (secure)
# - Optional: 0.0.0.0:5000:5000 or 5000:5000 exposes to all interfaces (use with caution)
ENV SPEC_WORKFLOW_BIND_ADDRESS=0.0.0.0
ENV SPEC_WORKFLOW_ALLOW_EXTERNAL_ACCESS=true

EXPOSE 5000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Run as non-root user with secure defaults
# Use shell form for CMD to enable environment variable expansion
CMD node /app/dist/index.js ${SPEC_WORKFLOW_PATH:-/workspace} --dashboard --port ${DASHBOARD_PORT:-5000}
