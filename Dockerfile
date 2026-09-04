# ============================================================
# FRONTEND BUILDERS
# ============================================================

# FRAS -------------------------------------------------------
FROM node:20-alpine AS fras-frontend-builder

RUN apk add --no-cache git

WORKDIR /app

RUN git clone --depth 1 https://github.com/vinaykatikireddy/facial-recognition-attendance-system.git facial-recognition-attendance-system

WORKDIR /app/facial-recognition-attendance-system/frontend

RUN npm ci
RUN npm run build


# AI-WEB-VULN-SIM --------------------------------------------
FROM node:20-alpine AS ai-web-vuln-sim-frontend-builder

RUN apk add --no-cache git

WORKDIR /app

RUN git clone --depth 1 https://github.com/vinaykatikireddy/ai-web-vuln-sim.git ai-web-vuln-sim

WORKDIR /app/ai-web-vuln-sim/frontend

RUN npm ci
RUN npm run build


# ============================================================
# FINAL IMAGE
# ============================================================
FROM python:3.11-slim

WORKDIR /app

# Install system packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    nginx \
    supervisor \
    curl \
    libxcb1 \
    libxext6 \
    libsm6 \
    libxrender1 \
    ffmpeg \
    libgl1 \
    gcc \
    python3-dev \
    fuse-overlayfs \
    libglib2.0-0 \
    libpango-1.0-0 \
    libpango1.0-dev \
    libharfbuzz-dev \
    shared-mime-info \
    libgdk-pixbuf-xlib-2.0-0 \
    libpangocairo-1.0-0 \
    && rm -rf /var/lib/apt/lists/*


# ============================================================
# SETUP BACKENDS WITH VENVs
# ============================================================

# FRAS -------------------------------------------------------

RUN python3 -m venv /opt/venv-fras

RUN /opt/venv-fras/bin/pip install --no-cache-dir -r /app/facial-recognition-attendance-system/backend/requirements.txt


# AI-WEB-VULN-SIM --------------------------------------------

RUN python3 -m venv /opt/venv-ai-vuln

RUN /opt/venv-ai-vuln/bin/pip install --no-cache-dir poetry

ENV POETRY_VIRTUALENVS_CREATE=false
WORKDIR /app/ai-web-vuln-sim/backend
RUN /opt/venv-ai-vuln/bin/poetry install --no-root --no-interaction --no-ansi


# ============================================================
# COPY BUILT FRONTENDS
# ============================================================
COPY --from=fras-frontend-builder /app/facial-recognition-attendance-system/frontend/dist /var/www/fras

COPY --from=ai-web-vuln-sim-frontend-builder /app/ai-web-vuln-sim/frontend/dist /var/www/ai-web-vuln-sim


# ============================================================
# CONFIGURATION FILES
# ============================================================
COPY nginx.conf /etc/nginx/nginx.conf

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf


# ============================================================
# PORTS
# ============================================================
EXPOSE 80
EXPOSE 7860


CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]