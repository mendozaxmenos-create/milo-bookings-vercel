# 🌐 Configurar Dominio Personalizado en Vercel

## 📋 Problema

Cada vez que Vercel hace un nuevo deployment, puede cambiar la URL. Necesitas una URL **fija y permanente** que siempre apunte a la última versión sin tener que entrar a Vercel.

## ✅ Solución: Dominio Personalizado

Vercel ofrece dos opciones:

### Opción 1: Dominio .vercel.app (GRATIS - Recomendado)

Cada proyecto en Vercel tiene un dominio **estable** que NO cambia: `tu-proyecto.vercel.app`

Este dominio **siempre** apunta a la última versión de producción.

### Opción 2: Dominio Personalizado (Mejor para producción)

Usa tu propio dominio (ej: `admin.tudominio.com`) que siempre apunte a Vercel.

---

## 🚀 Opción 1: Usar Dominio .vercel.app (Más Fácil)

### Paso 1: Obtener tu Dominio Estable

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto: `milo-bookings-admin-panel` (o el nombre que le pusiste)
3. Ve a la pestaña **"Deployments"**
4. Haz clic en el último deployment exitoso
5. Verás la URL en la parte superior, por ejemplo:
   ```
   https://milo-bookings-admin-panel-abc123.vercel.app
   ```
   
   **⚠️ Esta URL puede cambiar entre deployments**

### Paso 2: Encontrar tu Dominio Estable

1. Ve a **"Settings"** → **"Domains"**
2. Verás tu dominio estable, por ejemplo:
   ```
   milo-bookings-admin-panel.vercel.app
   ```
   
   **✅ Esta URL NO cambia nunca** - Siempre apunta a producción

### Paso 3: Usar el Dominio Estable

Este dominio (`tu-proyecto.vercel.app`) siempre apunta a la **última versión de producción**, sin importar cuántos deployments hagas.

**No necesitas hacer nada más** - Solo usa este dominio fijo.

---

## 🌐 Opción 2: Dominio Personalizado (Recomendado para Producción)

Si tienes un dominio propio (ej: comprado en Namecheap, GoDaddy, etc.), puedes configurarlo en Vercel.

### Paso 1: Agregar Dominio en Vercel

1. En Vercel Dashboard → Tu proyecto → **"Settings"** → **"Domains"**
2. Haz clic en **"Add Domain"**
3. Ingresa tu dominio, por ejemplo:
   ```
   admin.tudominio.com
   ```
4. Haz clic en **"Add"**

### Paso 2: Configurar DNS

Vercel te mostrará las instrucciones para configurar DNS. Depende de tu proveedor de dominio:

#### Si usas Vercel DNS (Más fácil)

1. Vercel te pedirá cambiar los nameservers de tu dominio
2. Copia los nameservers que Vercel te da
3. Ve a tu proveedor de dominio (Namecheap, GoDaddy, etc.)
4. Cambia los nameservers a los de Vercel
5. Espera 24-48 horas para que se propague

#### Si usas DNS de tu proveedor actual

1. Vercel te dará una **CNAME** o **A Record** para agregar
2. Ve a tu proveedor de dominio → **DNS Management**
3. Agrega el registro que Vercel te indica:
   - **Tipo**: CNAME (o A)
   - **Nombre**: `admin` (o lo que quieras)
   - **Valor**: El que Vercel te da (ej: `cname.vercel-dns.com`)
4. Espera 5-60 minutos para que se propague

### Paso 3: Verificar

1. Vercel verificará automáticamente cuando el DNS esté configurado
2. Verás un check ✅ verde cuando esté listo
3. Tu dominio personalizado ahora apunta a la última versión de producción

---

## 🔄 Actualizar Backend (CORS)

Una vez que tengas tu dominio fijo, actualiza el backend para permitir ese dominio:

### En Render (o donde tengas el backend)

1. Ve a tu servicio → **Environment**
2. Actualiza la variable `ALLOWED_ORIGINS`:
   ```env
   ALLOWED_ORIGINS=https://tu-dominio.vercel.app,https://admin.tudominio.com
   ```
   (Incluye ambos: el de Vercel y tu dominio personalizado si lo usas)
3. Haz **Manual Deploy** para aplicar los cambios

---

## 📱 Usar el Dominio Fijo

Una vez configurado, simplemente:

1. **Guarda el dominio fijo** en tus marcadores: `https://tu-dominio.vercel.app`
2. **Úsalo siempre** - Nunca cambiará
3. **Cada nuevo deployment** automáticamente estará disponible en ese dominio

---

## 🎯 ¿Qué Dominio Usar?

### Para Desarrollo/Pruebas:
- ✅ **Dominio .vercel.app**: `tu-proyecto.vercel.app`
- ✅ Es gratis y estable
- ✅ No requiere configuración adicional

### Para Producción:
- ✅ **Dominio Personalizado**: `admin.tudominio.com`
- ✅ Más profesional
- ✅ Puedes usar tu propia marca
- ✅ Requiere dominio propio (desde $10-15/año)

---

## ✅ Checklist

- [ ] Encontré mi dominio estable `.vercel.app` en Settings → Domains
- [ ] Guardé el dominio en mis marcadores
- [ ] (Opcional) Configuré dominio personalizado
- [ ] Actualicé `ALLOWED_ORIGINS` en el backend
- [ ] Probé que el dominio funciona

---

## 💡 Tips

1. **El dominio `.vercel.app` siempre está disponible** - No necesitas configuración adicional
2. **Los preview deployments** tienen URLs diferentes (para probar antes de producción)
3. **El dominio fijo siempre apunta a producción** - La rama `main` o `master`
4. **Si no ves tu dominio estable**, revisa en Settings → Domains después del primer deployment

---

## 🔗 URLs de Referencia

- **Dashboard de Vercel**: https://vercel.com/dashboard
- **Settings → Domains**: https://vercel.com/[tu-usuario]/[tu-proyecto]/settings/domains

---

**Resumen**: El dominio `.vercel.app` de tu proyecto **NUNCA cambia** y siempre apunta a la última versión de producción. Solo necesitas encontrarlo en Settings → Domains y usarlo. 🚀

