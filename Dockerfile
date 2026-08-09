# FRAS Frontend Builder
FROM node:20-alpine AS fras-frontend-builder

RUN apk add --no-cache git

WORKDIR /app

# Clone Face Recognition project
RUN git clone --depth 1 https://github.com/vinaykatikireddy/facial-recognition-attendance-system.git

WORKDIR /app/facial-recognition-attendance-system/frontend

RUN npm ci
RUN npm run build


# Final Image
FROM python:3.11-slim

WORKDIR /app

# Install system packages
RUN apt-get update && apt-get install -y \
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
    && rm -rf /var/lib/apt/lists/*

# Clone Face Recognition project
RUN git clone --depth 1 https://github.com/vinaykatikireddy/facial-recognition-attendance-system.git

# Install Python dependencies
RUN pip install --no-cache-dir -r /app/facial-recognition-attendance-system/backend/requirements.txt

# Copy all from this repository
COPY . /app/

# Copy backend
COPY --from=0 /app/facial-recognition-attendance-system/backend /opt/fras-backend

# Copy built frontend
COPY --from=fras-frontend-builder app/facial-recognition-attendance-system/frontend/dist /var/www/fras

# Copy configuration files
COPY nginx.conf /etc/nginx/nginx.conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose ports
EXPOSE 80
EXPOSE 7860

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
