# Stage 1: Build React app with Vite
FROM node:20-alpine AS builder

WORKDIR /app

# Copy everything inside frontend folder
COPY . .

# 1. Ensure package.json exists with all required frontend packages
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

# 2. Ensure vite.config.ts exists with path alias (@ -> ./src)
RUN if [ ! -f vite.config.ts ]; then \
  echo 'import { defineConfig } from "vite";\
import react from "@vitejs/plugin-react";\
import tailwindcss from "@tailwindcss/vite";\
import path from "path";\
export default defineConfig({\
  plugins: [react(), tailwindcss()],\
  resolve: {\
    alias: { "@": path.resolve(__dirname, "./src") }\
  },\
  build: { outDir: "dist" }\
});' > vite.config.ts; fi

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

# Install packages and build to /app/dist
RUN npm install

ARG VITE_API_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

ENV VITE_API_URL=${VITE_API_URL} \
    VITE_SUPABASE_URL=${VITE_SUPABASE_URL} \
    VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

RUN npm run build

# Stage 2: Serve via Nginx
FROM nginx:alpine AS runtime

# Copy nginx.conf (it is directly in the frontend root)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Clean default welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled React files
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
