# 🚨 Solución: Error 503 Service Unavailable

## ❌ Problema

El backend en Render está devolviendo **503 Service Unavailable**, lo que significa que el servicio está caído o no está respondiendo.

## 🔍 Pasos para Diagnosticar

### 1. Verificar Logs en Render

1. Ve a **Render Dashboard**: https://dashboard.render.com
2. Selecciona tu servicio: `milo-bookings`
3. Haz clic en la pestaña **"Logs"**
4. Revisa los últimos logs para ver errores

**Busca:**
- Errores de conexión a la base de datos
- Errores de sintaxis
- Errores de dependencias faltantes
- Crashes del proceso

### 2. Verificar Estado del Servicio

En Render Dashboard:
1. Ve a tu servicio
2. Verifica el estado:
   - ✅ **Live**: Servicio corriendo
   - ⚠️ **Building**: En proceso de build
   - ❌ **Failed**: Build falló
   - 🔄 **Updating**: Actualizando

### 3. Verificar Base de Datos

1. Ve a tu servicio PostgreSQL en Render
2. Verifica que esté en estado **"Available"**
3. Si está caída, reiníciala

### 4. Verificar Variables de Entorno

1. En tu servicio, ve a **"Environment"**
2. Verifica que todas las variables estén configuradas:
   - `DATABASE_URL` (Internal URL)
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - `PORT=3000`

## ✅ Soluciones Comunes

### Solución 1: Reiniciar el Servicio

1. En Render Dashboard → Tu servicio
2. Haz clic en **"Manual Deploy"**
3. Selecciona **"Redeploy"**
4. Espera a que termine el deploy

### Solución 2: Verificar Logs de Errores

Si hay errores en los logs:

**Error de base de datos:**
- Verifica que `DATABASE_URL` esté correcta
- Verifica que la base de datos esté corriendo

**Error de dependencias:**
- El build puede haber fallado
- Revisa los logs de build

**Error de código:**
- Puede haber un error en el código que está causando el crash
- Revisa los logs para ver el error específico

### Solución 3: Verificar Build

1. Ve a **"Deployments"** en Render
2. Revisa el último deployment
3. Si el build falló, revisa los logs de build

## 🐛 Errores Comunes

### Error: "Cannot connect to database"
- **Solución**: Verifica `DATABASE_URL` y que la base de datos esté corriendo

### Error: "Port already in use"
- **Solución**: Verifica que `PORT` esté configurado correctamente (Render usa el puerto automáticamente)

### Error: "Module not found"
- **Solución**: Revisa que todas las dependencias estén en `package.json`

### Error: "Syntax error"
- **Solución**: Revisa los logs para ver el error específico

## 📋 Checklist

- [ ] Servicio está en estado "Live" en Render
- [ ] Base de datos PostgreSQL está "Available"
- [ ] Variables de entorno configuradas correctamente
- [ ] Último deployment fue exitoso
- [ ] No hay errores en los logs
- [ ] Health check responde: `https://milo-bookings.onrender.com/health`

---

**¿Qué ves en los logs de Render?** Comparte los últimos errores y te ayudo a solucionarlos.

