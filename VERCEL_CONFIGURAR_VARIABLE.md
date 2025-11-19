# 🔧 Configurar Variable de Entorno en Vercel

## ❌ Problema

El frontend se queda en "Iniciando sesión..." porque no puede conectarse al backend. Esto sucede porque falta la variable de entorno `VITE_API_URL` en Vercel.

## ✅ Solución: Agregar Variable de Entorno

### Paso 1: Ir a Environment Variables

1. En Vercel Dashboard, ve a tu proyecto: `milo-bookings-admin-panel`
2. Haz clic en **"Settings"** (arriba)
3. En el menú lateral, haz clic en **"Environment Variables"**

### Paso 2: Agregar Variable

1. Haz clic en **"Add New"** o **"Add Variable"**
2. Configura:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://milo-bookings.onrender.com`
   - **Environment**: Selecciona todas las opciones:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
3. Haz clic en **"Save"**

### Paso 3: Hacer Redeploy

Después de agregar la variable, necesitas hacer redeploy para que tome efecto:

1. Ve a la pestaña **"Deployments"**
2. Haz clic en los **tres puntos (⋯)** del último deployment
3. Selecciona **"Redeploy"**
4. O simplemente haz un nuevo commit y push (Vercel desplegará automáticamente)

---

## 🔍 Verificar que Funciona

Después del redeploy:

1. Abre la consola del navegador (F12 → Console)
2. Intenta hacer login de nuevo
3. Deberías ver en la consola:
   - Si hay errores de conexión, aparecerán aquí
   - Si la conexión funciona, verás las peticiones HTTP

---

## 🐛 Si Sigue Sin Funcionar

### Verificar Backend

1. Abre en el navegador: `https://milo-bookings.onrender.com/health`
2. Debería responder: `{"status":"ok","timestamp":"..."}`
3. Si no responde, el backend está caído

### Verificar CORS

El backend debería estar configurado para aceptar peticiones desde Vercel. Si hay errores de CORS:

1. Ve a Render Dashboard → Tu servicio → Environment
2. Verifica que `ALLOWED_ORIGINS` incluya tu dominio de Vercel
3. O agrega: `ALLOWED_ORIGINS=https://tu-proyecto.vercel.app`

---

## ✅ Checklist

- [ ] Variable `VITE_API_URL` agregada en Vercel
- [ ] Valor: `https://milo-bookings.onrender.com`
- [ ] Aplicada a Production, Preview y Development
- [ ] Redeploy realizado
- [ ] Backend responde en `/health`
- [ ] CORS configurado correctamente

---

**Después de agregar la variable y hacer redeploy, el login debería funcionar correctamente.**

