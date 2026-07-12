# ── Stage 1: Build ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root manifests + shared package manifests first for layer cache
COPY package*.json tsconfig.json ./
COPY packages/ui/package*.json ./packages/ui/
COPY packages/types/package*.json ./packages/types/
COPY packages/config/package*.json ./packages/config/
COPY packages/shared/package*.json ./packages/shared/
COPY apps/frontend/package*.json ./apps/frontend/

# Install all workspace dependencies with exact lockfile
RUN npm ci

# Copy full source tree
COPY packages/ ./packages/
COPY apps/frontend/ ./apps/frontend/

# Compile production bundle
RUN npm run build:frontend

# ── Stage 2: Serve with nginx ───────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Remove default site config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx reverse-proxy config
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/pandora.conf

# Copy compiled static assets from build stage
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

EXPOSE 80

# Lightweight healthcheck via wget (pre-installed in alpine)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
