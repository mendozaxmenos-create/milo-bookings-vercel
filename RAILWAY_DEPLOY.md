# 🚂 Guía de Deployment en Railway - Milo Bookings

## 📋 Pasos para Desplegar

### 1. Conectar Repositorio de GitHub

En Railway:
1. Haz clic en **"Configure GitHub App"** o **"New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Autoriza Railway para acceder a tus repositorios
4. Selecciona el repositorio `milo-bookings`
5. Railway detectará automáticamente el `Dockerfile` y `railway.json`

### 2. Agregar Base de Datos PostgreSQL

1. En tu proyecto de Railway, haz clic en **"+ New"**
2. Selecciona **"Database"** → **"Add PostgreSQL"**
3. Railway creará automáticamente la variable `DATABASE_URL`

### 3. Configurar Variables de Entorno

En la configuración de tu servicio, agrega estas variables:

#### 🔐 Seguridad (OBLIGATORIAS)
```env
JWT_SECRET=tu-clave-secreta-super-larga-minimo-32-caracteres
NODE_ENV=production
```

#### 🗄️ Base de Datos
Railway crea automáticamente `DATABASE_URL`, pero puedes verificar que esté configurada.

#### 💳 MercadoPago (si usas pagos)
```env
MERCADOPAGO_ACCESS_TOKEN=tu_access_token
MERCADOPAGO_PUBLIC_KEY=tu_public_key
MERCADOPAGO_PRODUCTION=true
WEBHOOK_BASE_URL=https://tu-app.railway.app
MP_SUCCESS_URL=https://tu-app.railway.app/payments/success
MP_FAILURE_URL=https://tu-app.railway.app/payments/failure
MP_PENDING_URL=https://tu-app.railway.app/payments/pending
```

#### 🌐 CORS (si tienes frontend separado)
```env
ALLOWED_ORIGINS=https://tu-frontend.com
```

#### 📱 WhatsApp (Opcional)
```env
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

### 4. Configurar Dominio (Opcional)

1. En la configuración del servicio, ve a **"Settings"** → **"Networking"**
2. Haz clic en **"Generate Domain"** para obtener un dominio público
3. O configura un dominio personalizado

### 5. Deploy Automático

Railway desplegará automáticamente cuando:
- Haces push a la rama principal (main/master)
- Cambias variables de entorno
- Haces deploy manual desde el dashboard

### 6. Verificar el Deploy

1. Espera a que el build termine (puede tardar 5-10 minutos la primera vez)
2. Revisa los logs para ver:
   - ✅ Migraciones ejecutadas
   - ✅ Bot inicializado
   - ✅ Servidor corriendo en puerto 3000

3. Prueba el health check:
   ```
   https://tu-app.railway.app/health
   ```

## 🔍 Troubleshooting

### Error: "Cannot connect to database"
- Verifica que la base de datos PostgreSQL esté corriendo
- Verifica que `DATABASE_URL` esté configurada
- Revisa los logs del servicio de base de datos

### Error: "Puppeteer failed to launch"
- Ya está configurado en el Dockerfile
- Verifica que `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium`

### El bot no inicia
- Revisa los logs del servicio
- La primera vez necesitarás escanear el QR code
- Railway expone los logs en tiempo real

### Migraciones no se ejecutan
- Verifica que `docker-entrypoint.sh` tenga permisos de ejecución
- Revisa los logs al iniciar el contenedor

## 📝 Notas Importantes

1. **Primera vez**: El bot necesitará escanear el QR code. Revisa los logs para ver el QR o usa el endpoint `/api/bot/:business_id/qr`

2. **Sesiones de WhatsApp**: Se guardan en `/app/backend/data/whatsapp-sessions`. Railway usa volúmenes efímeros, así que considera usar almacenamiento persistente si necesitas mantener sesiones.

3. **Webhooks de MercadoPago**: Configura la URL en MercadoPago apuntando a `https://tu-app.railway.app/api/payments/webhook`

4. **Logs**: Railway muestra logs en tiempo real. Úsalos para debuggear problemas.

## 🎯 Checklist Pre-Deploy

- [ ] Repositorio en GitHub
- [ ] Railway conectado al repositorio
- [ ] Base de datos PostgreSQL agregada
- [ ] Variables de entorno configuradas
- [ ] `JWT_SECRET` configurado (mínimo 32 caracteres)
- [ ] `DATABASE_URL` configurada (automático con PostgreSQL)
- [ ] Dominio público generado (opcional)
- [ ] Webhooks de MercadoPago configurados (si aplica)

## 🚀 Siguiente Paso

Una vez desplegado, puedes:
1. Acceder al panel de admin en: `https://tu-app.railway.app`
2. Iniciar sesión con las credenciales del seed
3. Configurar tu primer negocio desde el super admin panel

