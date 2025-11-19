# ✅ Verificación de Deploy en Render

## ✅ Health Check - FUNCIONANDO

```
GET https://milo-bookings.onrender.com/health
Response: {"status":"ok","timestamp":"2025-11-18T22:10:11.486Z"}
```

✅ **Servidor corriendo correctamente**

## 🧪 Verificación 2025-11-19

- ✅ `GET /health` sigue respondiendo correctamente (timestamp 2025-11-19 15:26Z).
- ❌ `POST /api/auth/login` (business y super admin) responde `500` con `{"error":"Something went wrong!"}`.
- 🔍 Acción sugerida: abrir Shell en Render y ejecutar `cd backend && npm run db:seed` para re-crear credenciales demo, luego revisar logs del deploy para capturar el stacktrace exacto.
- 🌐 Frontend actual: `https://milo-bookings-admin-panel-f3hacagnc-milo-bookings-projects.vercel.app/` devuelve `401` (probable protección de preview) por lo que no se pudo validar login desde el panel todavía.

## 🔍 Próximos Pasos de Verificación

### 1. Verificar Logs en Render

Ve a Render Dashboard → Tu servicio → **"Logs"** y busca:

#### ✅ Logs que DEBES ver (éxito):
```
[KnexConfig] NODE_ENV: production
[KnexConfig] DATABASE_URL definida: true
[KnexConfig] DATABASE_URL: postgresql://milo_user:****@dpg-...
📊 Ejecutando migraciones de base de datos...
Batch 1 run: X migrations
✅ Migraciones ejecutadas correctamente
🚀 Milo Bookings Backend running on port 10000
✅ Bot inicializado para: ...
```

#### ❌ Logs que NO debes ver (error):
```
connect ECONNREFUSED ::1:5432
Error: connect ECONNREFUSED
[KnexConfig] ⚠️  DATABASE_URL no está definida!
```

### 2. Verificar Endpoints de la API

Prueba estos endpoints para verificar que todo funciona:

#### Login (Super Admin):
```bash
POST https://milo-bookings.onrender.com/api/auth/login
Content-Type: application/json

{
  "email": "admin@milobookings.com",
  "password": "admin123",
  "is_system_user": true
}
```

#### Login (Negocio):
```bash
POST https://milo-bookings.onrender.com/api/auth/login
Content-Type: application/json

{
  "business_id": "demo-business-001",
  "phone": "+5491123456789",
  "password": "demo123"
}
```

#### Health Check (ya funciona ✅):
```bash
GET https://milo-bookings.onrender.com/health
```

### 3. Verificar Base de Datos

Si las migraciones se ejecutaron correctamente, deberías poder:
- Hacer login
- Ver la lista de negocios (si eres super admin)
- Acceder al dashboard

### 4. Verificar Bot de WhatsApp

El bot se inicializará automáticamente para los negocios activos. Revisa los logs para ver:
```
✅ Bot inicializado para: Salón de Belleza Demo (demo-business-001)
```

**Nota**: La primera vez necesitarás escanear el QR code. Puedes obtenerlo desde:
- Panel de admin → Ver QR
- O desde el endpoint: `GET /api/bot/:business_id/qr`

## 🎯 Checklist de Verificación

- [x] Health check responde correctamente
- [ ] Logs muestran conexión exitosa a PostgreSQL
- [ ] Migraciones ejecutadas sin errores
- [ ] Login funciona (super admin o negocio)
- [ ] Bot inicializado (si hay negocios activos)
- [ ] No hay errores `ECONNREFUSED` en los logs

## 🐛 Si Hay Problemas

### Error: "DATABASE_URL no está definida"
- Ve a Render → Environment → Verifica que `DATABASE_URL` esté configurada
- Usa la **Internal Database URL** (sin `.oregon-postgres.render.com`)

### Error: "connect ECONNREFUSED"
- Verifica que la base de datos PostgreSQL esté corriendo en Render
- Verifica que uses la Internal URL, no la External

### Bot no inicia
- Es normal si no hay negocios activos
- Revisa los logs para ver si hay errores específicos

---

**¿Todo funcionando?** 🎉 ¡Tu aplicación está desplegada en Render!

