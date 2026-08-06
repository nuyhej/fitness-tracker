# ==========================================
# Stage 1: Build Frontend (Vite + React + TS)
# ==========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package definitions and install
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source and build production static bundle
COPY frontend ./
ENV NODE_ENV=production
RUN npm run build


# ==========================================
# Stage 2: Production Backend (FastAPI + Python)
# ==========================================
FROM python:3.11-slim AS production

WORKDIR /app

# Install basic OS libraries if required by uvicorn/asyncio
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python packages
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir aiosqlite uvicorn

# Copy backend codebase
COPY backend ./backend
WORKDIR /app/backend

# Copy compiled frontend build into static folder
COPY --from=frontend-builder /app/frontend/dist /app/backend/static

# Expose single port 8000 for full-stack hosting
EXPOSE 8000

# Set environment variables for production
ENV ENV=production
ENV FRONTEND_URL=http://localhost:8000
ENV DATABASE_URL=sqlite+aiosqlite:///./data/health.db

# Command to launch the full-stack server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
