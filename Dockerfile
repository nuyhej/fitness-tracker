# ==========================================
# Stage 1: Build Frontend (Vite + React + TS)
# ==========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package definitions and install
COPY frontend/package*.json ./
ENV NODE_ENV=development
RUN npm install --legacy-peer-deps


# Copy frontend source and build production static bundle
COPY frontend ./
ENV NODE_ENV=production
RUN npm run build


# ==========================================
# Stage 2: Production Backend (FastAPI + Python)
# ==========================================
FROM python:3.11-slim AS production

WORKDIR /app

# Copy requirements and install Python packages directly via lightweight pre-built wheels
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.txt

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
