# 🚀 Guía de Deployment - Milo Bookings

Esta guía te ayudará a desplegar Milo Bookings en diferentes plataformas cloud.

## 📋 Requisitos Previos

- Cuenta en una plataforma cloud (Railway, Render, Fly.io, etc.)
- Base de datos PostgreSQL (proporcionada por la plataforma o externa)
- Credenciales de MercadoPago
- Dominio (opcional, para webhooks)

## 🔧 Variables de Entorno Necesarias

### Base de Datos
```env
# Opción 1: URL completa (recomendado)
DATABASE_URL=postgresql://user:password@host:5432/milo_bookings

# Opción 2: Variables individuales
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=milo_bookings
DB_USER=postgres
DB_PASSWORD=your_password
```

### Seguridad
```env
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
NODE_ENV=production
```

### CORS
```env
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

### MercadoPago
```env
MERCADOPAGO_ACCESS_TOKEN=your_access_token
MERCADOPAGO_PUBLIC_KEY=your_public_key
MERCADOPAGO_PRODUCTION=true
WEBHOOK_BASE_URL=https://your-domain.com
MP_SUCCESS_URL=https://your-domain.com/payments/success
MP_FAILURE_URL=https://your-domain.com/payments/failure
MP_PENDING_URL=https://your-domain.com/payments/pending
```

### WhatsApp (Opcional)
```env
# Si quieres reutilizar sesión de otro bot
MILO_BOT_SESSION_PATH=/path/to/session
```

### Puppeteer (Ya configurado en Dockerfile)
```env
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

## 🚂 Deployment en Railway

1. **Conectar repositorio:**
   - Ve a [Railway](https://railway.app)
   - Crea un nuevo proyecto
   - Conecta tu repositorio de GitHub

2. **Agregar base de datos PostgreSQL:**
   - En Railway, agrega un servicio PostgreSQL
   - Railway automáticamente crea la variable `DATABASE_URL`

3. **Configurar variables de entorno:**
   - En la configuración del servicio, agrega todas las variables de entorno necesarias
   - Railway detectará automáticamente el `Dockerfile`

4. **Deploy:**
   - Railway desplegará automáticamente cuando hagas push a la rama principal
   - Las migraciones se ejecutarán automáticamente al iniciar

## 🎨 Deployment en Render

1. **Crear servicio:**
   - Ve a [Render](https://render.com)
   - Crea un nuevo "Web Service"
   - Conecta tu repositorio

2. **Configuración:**
   - **Build Command:** (dejar vacío, Render usa Dockerfile)
   - **Start Command:** `node backend/src/index.js`
   - **Environment:** Docker

3. **Base de datos:**
   - Crea un servicio PostgreSQL en Render
   - Render creará automáticamente `DATABASE_URL`

4. **Variables de entorno:**
   - Agrega todas las variables necesarias en la sección "Environment"

5. **Deploy:**
   - Render desplegará automáticamente
   - El archivo `render.yaml` ya está configurado

## 🪂 Deployment en Fly.io

1. **Instalar Fly CLI:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login:**
   ```bash
   fly auth login
   ```

3. **Crear app:**
   ```bash
   fly launch
   ```

4. **Configurar variables:**
   ```bash
   fly secrets set DATABASE_URL=postgresql://...
   fly secrets set JWT_SECRET=your-secret
   # ... etc
   ```

5. **Deploy:**
   ```bash
   fly deploy
   ```

## 🐳 Deployment con Docker

### Build local:
```bash
docker build -t milo-bookings .
```

### Run:
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=your-secret \
  -e MERCADOPAGO_ACCESS_TOKEN=... \
  milo-bookings
```

## 📝 Notas Importantes

### Base de Datos
- **Desarrollo:** SQLite (local)
- **Producción:** PostgreSQL (recomendado)
- Las migraciones se ejecutan automáticamente al iniciar el contenedor

### WhatsApp en la Nube
- El bot necesita acceso a WhatsApp Web
- En la primera ejecución, necesitarás escanear el QR code
- Las sesiones se guardan en `/app/backend/data/whatsapp-sessions`
- Considera usar volúmenes persistentes para mantener las sesiones

### Webhooks de MercadoPago
- Configura la URL del webhook en MercadoPago: `https://tu-dominio.com/api/payments/webhook`
- Asegúrate de que tu dominio tenga SSL (HTTPS)
- Railway y Render proporcionan HTTPS automáticamente

### Monitoreo
- El endpoint `/health` está disponible para health checks
- Railway y Render lo usan automáticamente

## 🔍 Troubleshooting

### El bot no inicia
- Verifica que `PUPPETEER_EXECUTABLE_PATH` esté configurado
- Revisa los logs del contenedor
- Asegúrate de que Chromium esté instalado (ya incluido en Dockerfile)

### Error de base de datos
- Verifica que `DATABASE_URL` esté correctamente configurada
- Asegúrate de que la base de datos PostgreSQL esté accesible
- Verifica que las migraciones se ejecutaron correctamente

### Webhooks no funcionan
- Verifica que `WEBHOOK_BASE_URL` apunte a tu dominio con HTTPS
- Revisa los logs del endpoint `/api/payments/webhook`
- Verifica que MercadoPago tenga la URL correcta configurada

## 📚 Recursos

- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [Fly.io Docs](https://fly.io/docs)
- [Docker Docs](https://docs.docker.com)
