# 🔄 Cómo Hacer Redeploy en Vercel

## Opción 1: Auto-Deploy (Automático)

Si tienes **auto-deploy** activado (por defecto está activado), Vercel debería detectar automáticamente el nuevo commit y hacer deploy.

**Verifica:**
1. Ve a tu proyecto en Vercel Dashboard
2. Ve a la pestaña **"Deployments"**
3. Deberías ver un nuevo deployment en progreso o completado

Si no aparece automáticamente, sigue las opciones siguientes.

---

## Opción 2: Redeploy Manual desde Deployments

1. Ve a tu proyecto en Vercel Dashboard
2. Haz clic en la pestaña **"Deployments"** (arriba)
3. Encuentra el último deployment (el más reciente)
4. Haz clic en los **tres puntos (⋯)** a la derecha del deployment
5. Selecciona **"Redeploy"**
6. Confirma el redeploy

---

## Opción 3: Hacer un Nuevo Commit (Forzar Deploy)

Si no encuentras el botón de redeploy, puedes hacer un commit vacío para forzar un nuevo deploy:

```bash
git commit --allow-empty -m "trigger: Forzar redeploy en Vercel"
git push origin main
```

O si estás en otra rama:
```bash
git push origin feat/logs-and-improvements
```

---

## Opción 4: Verificar Configuración del Proyecto

Si el proyecto no está configurado correctamente:

1. Ve a **"Settings"** → **"Git"**
2. Verifica que:
   - El repositorio esté conectado correctamente
   - La rama correcta esté seleccionada (`main` o `feat/logs-and-improvements`)
   - **"Auto Deploy"** esté activado

3. Ve a **"Settings"** → **"General"**
4. Verifica:
   - **Root Directory**: `frontend/admin-panel`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

---

## Opción 5: Crear el Proyecto de Nuevo (Si no existe)

Si no has creado el proyecto en Vercel todavía:

1. Ve a https://vercel.com/dashboard
2. Haz clic en **"Add New Project"**
3. Selecciona tu repositorio: `mendozaxmenos-create/milo-bookings`
4. Configura:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend/admin-panel` (¡IMPORTANTE!)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Agrega variable de entorno:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://milo-bookings.onrender.com`
6. Haz clic en **"Deploy"**

---

## 🔍 Verificar Estado del Deploy

1. Ve a la pestaña **"Deployments"**
2. Busca el deployment más reciente
3. Haz clic en él para ver los logs
4. Verifica que el build esté completado sin errores

---

## 💡 Tips

- **Auto-deploy está activado por defecto** - Solo necesitas hacer push a la rama conectada
- Si estás en la rama `feat/logs-and-improvements`, asegúrate de que Vercel esté configurado para esa rama
- O puedes hacer merge a `main` y Vercel desplegará automáticamente desde `main`

---

## 🚨 Si Nada Funciona

1. **Verifica que el proyecto exista en Vercel:**
   - Ve a https://vercel.com/dashboard
   - Busca tu proyecto o créalo si no existe

2. **Verifica la rama:**
   - Si creaste el proyecto desde `main`, haz merge de tus cambios a `main`
   - O cambia la configuración de Vercel para usar `feat/logs-and-improvements`

3. **Revisa los logs:**
   - Ve a "Deployments" → Click en el último deployment → Ver logs
   - Busca errores o advertencias

---

**¿Necesitas ayuda con algún paso específico?** Dime qué ves en tu dashboard de Vercel y te ayudo a encontrar el botón de redeploy.

