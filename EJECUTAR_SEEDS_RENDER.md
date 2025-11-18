# 🌱 Ejecutar Seeds en Render

## ❌ Problema

El login falla con "Invalid credentials" porque los datos de seed (usuario demo) no se ejecutaron en la base de datos de producción.

## ✅ Solución: Ejecutar Seeds Manualmente

### Opción 1: Desde Render Shell (Recomendado)

1. Ve a Render Dashboard → Tu servicio `milo-bookings`
2. Haz clic en **"Shell"** (en el menú lateral o arriba)
3. Se abrirá una terminal en el navegador
4. Ejecuta estos comandos:

```bash
cd backend
npm run db:seed
```

5. Deberías ver:
```
Ran seed: 001_demo_data.js
Ran seed: 003_system_users.js
```

### Opción 2: Modificar docker-entrypoint.sh (Ya hecho)

He modificado el `docker-entrypoint.sh` para que ejecute seeds automáticamente si no hay datos. Esto se aplicará en el próximo deploy.

**Para aplicar ahora:**
1. Haz redeploy en Render
2. El script verificará si hay datos
3. Si no hay, ejecutará los seeds automáticamente

### Opción 3: Crear Usuario Manualmente

Si prefieres crear el usuario manualmente, puedes usar el endpoint de registro (si está habilitado) o ejecutar SQL directamente.

---

## 🔍 Verificar que Funcionó

Después de ejecutar los seeds, verifica:

1. **Prueba el login:**
   - Business ID: `demo-business-001`
   - Teléfono: `+5491123456789`
   - Contraseña: `demo123`

2. **O prueba como Super Admin:**
   - Email: `admin@milobookings.com`
   - Contraseña: `admin123`

---

## 📋 Credenciales Creadas por Seeds

### Negocio Demo:
- **Business ID**: `demo-business-001`
- **Teléfono**: `+5491123456789`
- **Contraseña**: `demo123`

### Super Admin:
- **Email**: `admin@milobookings.com`
- **Contraseña**: `admin123`

---

**¿Necesitas ayuda?** La forma más rápida es usar Render Shell (Opción 1) para ejecutar los seeds manualmente.

