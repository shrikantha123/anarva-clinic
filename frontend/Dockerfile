# Stage 1: Build React app with Vite
FROM node:20-alpine AS builder

WORKDIR /app

# Copy frontend files
COPY . .

# 1. Ensure package.json exists
RUN if [ ! -f package.json ]; then \
  echo '{\
  "name": "anarva-frontend",\
  "private": true,\
  "type": "module",\
  "scripts": { "build": "vite build" },\
  "dependencies": {\
    "@tailwindcss/vite": "^4.3.3",\
    "@vitejs/plugin-react": "^6.1.1",\
    "lucide-react": "^0.546.0",\
    "motion": "^12.23.24",\
    "react": "^19.0.1",\
    "react-dom": "^19.0.1",\
    "tailwindcss": "^4.3.3",\
    "typescript": "^7.0.2",\
    "vite": "^8.3.0"\
  }\
}' > package.json; fi

# 2. Ensure vite.config.ts builds with base: '/hair-loss-assessment/'
RUN echo 'import { defineConfig } from "vite";\
import react from "@vitejs/plugin-react";\
import tailwindcss from "@tailwindcss/vite";\
import path from "path";\
export default defineConfig({\
  base: "/hair-loss-assessment/",\
  plugins: [react(), tailwindcss()],\
  resolve: {\
    alias: { "@": path.resolve(__dirname, "./src") }\
  },\
  build: { outDir: "dist" }\
});' > vite.config.ts

# 3. Ensure tsconfig.json exists
RUN if [ ! -f tsconfig.json ]; then \
  echo '{\
  "compilerOptions": {\
    "target": "ES2022",\
    "module": "ESNext",\
    "moduleResolution": "bundler",\
    "jsx": "react-jsx",\
    "paths": { "@/*": ["./src/*"] },\
    "skipLibCheck": true,\
    "noEmit": true\
  }\
}' > tsconfig.json; fi

# Install packages & compile React assessment tool
RUN npm install

ARG VITE_API_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

ENV VITE_API_URL=${VITE_API_URL} \
    VITE_SUPABASE_URL=${VITE_SUPABASE_URL} \
    VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

RUN npm run build

# Stage 2: Serve Main Website at / and Assessment at /hair-loss-assessment/
FROM nginx:alpine AS runtime

# Clean html root
RUN rm -rf /usr/share/nginx/html/*

# 1. Copy the MAIN CLINIC WEBSITE to root (/)
COPY site/ /usr/share/nginx/html/

# 2. Copy the compiled React Assessment App to (/hair-loss-assessment/)
COPY --from=builder /app/dist/ /usr/share/nginx/html/hair-loss-assessment/

# Configure Nginx for both main site and React SPA subpath
RUN echo 'server {\
    listen 8080;\
    server_name _;\
    root /usr/share/nginx/html;\
    index index.html;\
    \
    # Health check for Render\
    location /health {\
        access_log off;\
        return 200 "{\"status\":\"healthy\",\"service\":\"anarva-frontend\"}";\
        add_header Content-Type application/json;\
    }\
    \
    # 1. React Hair Loss Assessment Tool\
    location ^~ /hair-loss-assessment/ {\
        alias /usr/share/nginx/html/hair-loss-assessment/;\
        try_files $uri $uri/ /hair-loss-assessment/index.html;\
    }\
    location = /hair-loss-assessment {\
        return 301 /hair-loss-assessment/;\
    }\
    \
    # 2. Main Clinic Website at root\
    location / {\
        try_files $uri $uri/ /index.html;\
    }\
}' > /etc/nginx/conf.d/default.conf

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
