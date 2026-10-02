# Stage 1: Build React app with Vite
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# RUN npm install (Installs Vite, React, and build tools without needing lockfile)
RUN npm install

# Copy source code
COPY . .

# Build-time environment variables for Vite
ARG VITE_API_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

ENV VITE_API_URL=${VITE_API_URL} \
    VITE_SUPABASE_URL=${VITE_SUPABASE_URL} \
    VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

# Compile the production assets
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remove default nginx html BEFORE copying new dist files
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
