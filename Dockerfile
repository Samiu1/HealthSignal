# Use Node.js for building the frontend
FROM node:24-slim AS frontend-builder
WORKDIR /app/web
COPY web/package*.json ./
RUN npm install
COPY web/ ./
RUN npm run build

# Final stage: Python with Node.js support
FROM python:3.12-slim

# Install system dependencies and Node.js 24
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_24.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install uv for Python package management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copy Python configuration
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# Copy the rest of the application
COPY . .

# Copy built standalone and static assets from stage 1
COPY --from=frontend-builder /app/web/.next/standalone /app/web/standalone
COPY --from=frontend-builder /app/web/.next/static /app/web/standalone/.next/static
COPY --from=frontend-builder /app/web/public /app/web/standalone/public

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DB_PATH="/app/data/health_data.db"

# Expose the API and Dashboard ports
EXPOSE 3000

# Command to run both the sync script and the web server
# We use node directly on the standalone server.js
CMD ["sh", "-c", "uv run main.py & cd web/standalone && node server.js"]
