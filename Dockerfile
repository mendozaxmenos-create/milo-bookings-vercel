# Dockerfile para Milo Bookings - Optimizado para producción en la nube
FROM node:18-slim

# Instalar dependencias del sistema necesarias para Puppeteer y PostgreSQL
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-sandbox \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    xdg-utils \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Configurar Puppeteer para usar Chromium del sistema
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración primero (para mejor cacheo de Docker)
COPY package*.json ./
COPY backend/package*.json ./backend/

# Instalar dependencias del workspace
RUN npm ci --legacy-peer-deps --workspaces

# Copiar código fuente
COPY . .

# Crear directorios necesarios
RUN mkdir -p backend/data backend/data/whatsapp-sessions && \
    chmod -R 755 backend/data

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000
ENV SESSION_STORAGE_TYPE=local
ENV SESSION_STORAGE_PATH=/app/backend/data/whatsapp-sessions

# Healthcheck para monitoreo
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

# Script de inicio que ejecuta migraciones antes de iniciar
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "backend/src/index.js"]

