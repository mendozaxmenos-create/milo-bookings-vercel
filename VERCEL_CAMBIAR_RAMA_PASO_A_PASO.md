# 🔧 Cambiar Rama en Vercel - Paso a Paso

## 📍 Paso 1: Ir al Proyecto Específico

1. **Desde donde estás ahora:**
   - Haz clic en **"Home"** o en el logo de Vercel (arriba a la izquierda)
   - O ve directamente a: https://vercel.com/dashboard

2. **Busca tu proyecto:**
   - Deberías ver una lista de proyectos
   - Busca el proyecto relacionado con `milo-bookings` o `milo-bookings-frontend`
   - **Haz clic en el nombre del proyecto** (NO en Settings del Team)

## 📍 Paso 2: Ir a Settings del Proyecto

1. **Una vez dentro del proyecto:**
   - Verás pestañas: **"Overview"**, **"Deployments"**, **"Settings"**, etc.
   - Haz clic en **"Settings"** (arriba, en las pestañas del proyecto)

## 📍 Paso 3: Ir a Git

1. **En Settings del proyecto:**
   - En el menú lateral izquierdo, busca **"Git"**
   - Haz clic en **"Git"**

## 📍 Paso 4: Cambiar Production Branch

1. **En la sección Git:**
   - Busca **"Production Branch"** o **"Production Branch Settings"**
   - Verás un campo que probablemente dice `main`
   - **Cámbialo a:** `feat/logs-and-improvements`
   - O si hay un dropdown, selecciona `feat/logs-and-improvements`

2. **Guarda:**
   - Haz clic en **"Save"** o el botón de guardar

## 📍 Paso 5: Verificar Deploy

1. **Ve a "Deployments":**
   - Haz clic en la pestaña **"Deployments"**
   - Deberías ver un nuevo deployment en progreso automáticamente
   - Este deployment usará la rama `feat/logs-and-improvements` con los cambios corregidos

---

## 🔍 Si No Encuentras "Git" en Settings

Busca en **"Build and Deployment"**:
1. En Settings del proyecto, busca **"Build and Deployment"** en el menú lateral
2. Ahí deberías encontrar la configuración de ramas

---

## 🆘 Si No Ves el Proyecto

**Crear el proyecto:**
1. Ve a https://vercel.com/dashboard
2. Haz clic en **"Add New Project"**
3. Selecciona tu repositorio: `mendozaxmenos-create/milo-bookings`
4. Configura:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend/admin-panel`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Production Branch**: `feat/logs-and-improvements` (o `main` si prefieres)
5. Agrega variable de entorno:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://milo-bookings.onrender.com`
6. Haz clic en **"Deploy"**

---

**¿Necesitas ayuda con algún paso específico?** Dime qué ves cuando haces clic en el proyecto.

