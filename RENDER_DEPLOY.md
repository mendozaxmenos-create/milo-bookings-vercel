# 🚀 Guía de Deploy en Render (GRATIS)

Render es una excelente alternativa gratuita a Railway. Ofrece:
- ✅ Plan gratuito generoso
- ✅ PostgreSQL gratuito
- ✅ Deploy automático desde GitHub
- ✅ SSL/HTTPS automático
- ✅ Sin límites de tamaño de proyecto

## 📋 Pre-requisitos

1. Cuenta en GitHub (ya tienes el código ahí)
2. Cuenta en Render (https://render.com) - registro gratuito

## 🎯 Paso a Paso

### Paso 1: Crear cuenta en Render

1. Ve a https://render.com
2. Haz clic en **"Get Started for Free"**
3. Conecta tu cuenta de GitHub
4. Autoriza a Render para acceder a tus repositorios

### Paso 2: Crear Base de Datos PostgreSQL

1. En el Dashboard de Render, haz clic en **"+ New"**
2. Selecciona **"PostgreSQL"**
3. Configura:
   - **Name**: `milo-bookings-db` (o el nombre que prefieras)
   - **Database**: `milo_bookings` (o el nombre que prefieras)
   - **User**: `milo_user` (o el nombre que prefieras)
   - **Region**: Elige la más cercana (ej: `Oregon (US West)`)
   - **PostgreSQL Version**: `16` (o la más reciente)
   - **Plan**: **Free** (tiene 1GB de almacenamiento)
4. Haz clic en **"Create Database"**
5. **IMPORTANTE**: Copia la **Internal Database URL** y la **External Database URL**
   - La Internal es para usar dentro de Render
   - La External es para conexiones externas (si las necesitas)

### Paso 3: Crear Web Service (Aplicación)

1. En el Dashboard, haz clic en **"+ New"**
2. Selecciona **"Web Service"**
3. Conecta tu repositorio:
   - Selecciona **"Connect GitHub"** si no lo has hecho
   - Busca y selecciona: `mendozaxmenos-create/milo-bookings`
   - Selecciona la rama: `main` o `feat/logs-and-improvements`

4. Configura el servicio:
   - **Name**: `milo-bookings` (o el nombre que prefieras)
   - **Region**: La misma que elegiste para la base de datos
   - **Branch**: `main` (o la rama que quieras)
   - **Root Directory**: Dejar vacío (raíz del proyecto)
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `Dockerfile` (ya está en la raíz)
   - **Docker Context**: Dejar vacío
   - **Plan**: **Free** (tiene 750 horas/mes gratis)

5. **Variables de Entorno** - Haz clic en **"Advanced"** y agrega:

```env
# Base de datos (usa la Internal Database URL de PostgreSQL)
DATABASE_URL=postgresql://milo_user:password@dpg-xxxxx-a.oregon-postgres.render.com/milo_bookings

# Seguridad (OBLIGATORIO - genera uno seguro)
JWT_SECRET=tu-clave-super-secreta-minimo-32-caracteres-aleatorios-2024

# Entorno
NODE_ENV=production
PORT=3000

# WhatsApp Bot (opcional)
SESSION_STORAGE_TYPE=local
SESSION_STORAGE_PATH=/app/backend/data/whatsapp-sessions

# MercadoPago (si lo usas)
MERCADOPAGO_ACCESS_TOKEN=tu_access_token
MERCADOPAGO_PUBLIC_KEY=tu_public_key
MERCADOPAGO_PRODUCTION=true
WEBHOOK_BASE_URL=https://tu-app.onrender.com
MP_SUCCESS_URL=https://tu-app.onrender.com/payments/success
MP_FAILURE_URL=https://tu-app.onrender.com/payments/failure
MP_PENDING_URL=https://tu-app.onrender.com/payments/pending
```

6. Haz clic en **"Create Web Service"**

### Paso 4: Configurar el Servicio

1. Una vez creado, ve a **"Settings"** del servicio
2. En **"Health Check Path"**, agrega: `/health`
3. En **"Auto-Deploy"**, asegúrate de que esté en **"Yes"** (se actualiza automáticamente con cada push)

### Paso 5: Esperar el Deploy

1. Render comenzará a construir automáticamente
2. Puedes ver el progreso en la pestaña **"Logs"**
3. El primer deploy puede tardar 5-10 minutos
4. Revisa los logs para ver:
   - ✅ Migraciones ejecutadas
   - ✅ Bot inicializado
   - ✅ Servidor corriendo en puerto 3000

### Paso 6: Obtener URL Pública

1. Una vez que el deploy termine, Render te dará una URL automática:
   - Formato: `https://milo-bookings.onrender.com`
2. Esta URL es tu dominio público (gratis)
3. Puedes usar un dominio personalizado si lo deseas (desde Settings → Custom Domain)

## 🔍 Verificación Post-Deploy

### 1. Verificar Health Check

```bash
curl https://tu-app.onrender.com/health
```

Debería responder: `{"status":"ok","timestamp":"..."}`

### 2. Verificar Logs

En Render Dashboard → Tu servicio → Logs

Busca:
- ✅ `🚀 Milo Bookings Backend running on port 3000`
- ✅ `📊 Ejecutando migraciones de base de datos...`
- ✅ `✅ Bot inicializado para: ...`

### 3. Verificar Base de Datos

Los logs deberían mostrar que las migraciones se ejecutaron correctamente.

## ⚠️ Limitaciones del Plan Gratuito

- **Sleep después de inactividad**: El servicio se "duerme" después de 15 minutos de inactividad. La primera petición puede tardar ~30 segundos en "despertar".
- **750 horas/mes**: Suficiente para desarrollo y pruebas
- **1GB PostgreSQL**: Suficiente para empezar
- **512MB RAM**: Debería ser suficiente para tu app

## 💡 Tips

- El servicio se despierta automáticamente con la primera petición
- Puedes usar un servicio como UptimeRobot (gratis) para hacer ping cada 5 minutos y mantener el servicio despierto
- Los logs se actualizan en tiempo real
- Puedes hacer rollback a deployments anteriores
- Render expone automáticamente HTTPS (no necesitas configurar SSL)

## 🐛 Troubleshooting

### Error: "Cannot connect to database"
- Verifica que `DATABASE_URL` esté configurada correctamente
- Usa la **Internal Database URL** (no la External)
- Verifica que la base de datos esté corriendo

### Error: "Puppeteer failed to launch"
- Ya está configurado en el Dockerfile
- Verifica los logs para más detalles

### El servicio se duerme
- Es normal en el plan gratuito
- La primera petición después de dormir tarda ~30 segundos
- Usa UptimeRobot para mantenerlo despierto

### Build falla
- Revisa los logs de build en Render
- Verifica que `Dockerfile` esté en la raíz
- Asegúrate de que todas las dependencias estén en `package.json`

---

**¿Listo para desplegar?** Sigue los pasos y verifica cada uno antes de continuar al siguiente.

