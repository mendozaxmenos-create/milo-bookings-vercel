# 🚀 Configurar Frontend en Vercel - Paso a Paso

## 📋 Prerequisitos

- ✅ Backend funcionando en Render: `https://milo-bookings.onrender.com`
- ✅ Cuenta de Vercel creada
- ✅ Repositorio conectado a GitHub

## 🎯 Paso 1: Crear/Verificar Proyecto en Vercel

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Si ya tienes el proyecto:
   - Ve a **Settings** → **General**
   - Verifica que el **Root Directory** esté configurado como: `frontend/admin-panel`
3. Si NO tienes el proyecto:
   - Haz clic en **"Add New Project"**
   - Selecciona el repositorio: `mendozaxmenos-create/milo-bookings`
   - Configura:
     - **Framework Preset**: `Vite`
     - **Root Directory**: `frontend/admin-panel`
     - **Build Command**: `npm run build` (debería detectarse automáticamente)
     - **Output Directory**: `dist` (debería detectarse automáticamente)
     - **Install Command**: `npm install`

## 🔧 Paso 2: Configurar Variables de Entorno

1. En Vercel Dashboard → Tu proyecto → **Settings** → **Environment Variables**
2. Agrega las siguientes variables:

### Variable 1: API URL
- **Key**: `VITE_API_URL`
- **Value**: `https://milo-bookings.onrender.com`
- **Environment**: Production, Preview, Development (marca todas)

### Variable 2: (Opcional) CORS Origins
Si el backend tiene restricciones CORS, también agrega:
- **Key**: `VITE_ALLOWED_ORIGINS`
- **Value**: `https://tu-dominio-vercel.vercel.app`
- **Environment**: Production, Preview

## 🔓 Paso 3: Desactivar Protección de Deployment

1. En Vercel Dashboard → Tu proyecto → **Settings** → **Deployment Protection**
2. Verifica si hay alguna protección activa:
   - **Password Protection**: Desactivar (si está activa)
   - **Vercel Authentication**: Desactivar (si está activa)
3. Guarda los cambios

## 🌐 Paso 4: Configurar CORS en Backend (Render)

Para que el frontend pueda hacer requests al backend:

1. Ve a Render Dashboard → Tu servicio `milo-bookings` → **Environment**
2. Agrega o actualiza la variable:
   - **Key**: `ALLOWED_ORIGINS`
   - **Value**: `https://tu-dominio-vercel.vercel.app,https://milo-bookings-admin-panel-f3hacagnc-milo-bookings-projects.vercel.app`
   - (Incluye todos los dominios de Vercel que uses: producción, preview, etc.)
3. Guarda y haz **Manual Deploy** para aplicar los cambios

## 🚀 Paso 5: Deploy

1. En Vercel Dashboard → Tu proyecto → **Deployments**
2. Si ya hay un deployment, haz clic en **"Redeploy"** → **"Use existing Build Cache"**
3. O simplemente haz un push a la rama principal y Vercel desplegará automáticamente

## ✅ Paso 6: Verificar

Una vez desplegado:

1. Abre la URL de tu frontend (ej: `https://tu-proyecto.vercel.app`)
2. Deberías ver la pantalla de login
3. Prueba con las credenciales demo:
   - **Business ID**: `demo-business-001`
   - **Teléfono**: `+5491123456789`
   - **Contraseña**: `demo123`

## 🐛 Troubleshooting

### Error: "Failed to fetch" o CORS error

**Solución:**
- Verifica que `ALLOWED_ORIGINS` en Render incluya el dominio de Vercel
- Verifica que `VITE_API_URL` esté configurada correctamente en Vercel
- Haz redeploy del backend después de cambiar `ALLOWED_ORIGINS`

### Error: "401 Unauthorized" al cargar la página

**Solución:**
- Desactiva "Password Protection" en Vercel Settings → Deployment Protection
- Verifica que no haya "Vercel Authentication" activa

### Error: "Cannot GET /" o página en blanco

**Solución:**
- Verifica que `vercel.json` esté en `frontend/admin-panel/`
- Verifica que el **Output Directory** sea `dist`
- Verifica que el build se complete correctamente (revisa los logs de deploy)

### El frontend no se conecta al backend

**Solución:**
1. Abre la consola del navegador (F12)
2. Busca logs que empiecen con `[API]`
3. Verifica que `VITE_API_URL` esté configurada:
   - Deberías ver: `[API] Using VITE_API_URL: https://milo-bookings.onrender.com`
4. Si ves el warning de fallback, la variable no está configurada correctamente

## 📝 Checklist Final

- [ ] Proyecto creado en Vercel con Root Directory: `frontend/admin-panel`
- [ ] Variable `VITE_API_URL` configurada en Vercel
- [ ] Protección de deployment desactivada
- [ ] Variable `ALLOWED_ORIGINS` configurada en Render
- [ ] Backend redeployado después de cambiar CORS
- [ ] Frontend desplegado correctamente
- [ ] Login funciona desde el frontend
- [ ] Dashboard carga correctamente

## 🔗 URLs Importantes

- **Backend**: https://milo-bookings.onrender.com
- **Frontend**: (tu URL de Vercel)
- **Health Check**: https://milo-bookings.onrender.com/health
- **API Docs**: https://milo-bookings.onrender.com/ (GET /)

## 💡 Tips

- Vercel hace deploy automático en cada push a la rama principal
- Puedes usar Preview Deployments para probar cambios antes de producción
- Los logs de Vercel te ayudan a debuggear problemas de build
- Usa la consola del navegador para ver los logs de `[API]` y debuggear conexiones

---

**¿Problemas?** Revisa los logs de Vercel y Render, y la consola del navegador para más detalles.

