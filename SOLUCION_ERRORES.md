# 🔧 Solución de Errores Comunes

## ❌ Error: EADDRINUSE - Puerto 3000 en uso

### Solución Rápida:

**Opción 1: Usar el script automático**
```powershell
cd backend
.\kill-port.ps1
```

**Opción 2: Cerrar procesos manualmente**
```powershell
# Encontrar procesos en el puerto 3000
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess

# Cerrar todos los procesos Node.js
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

**Opción 3: Cambiar el puerto del backend**

Edita el archivo `.env` en la raíz del proyecto:
```env
PORT=3001
```

Y actualiza `FRONTEND_URL` y `ALLOWED_ORIGINS` también.

### Verificar que el puerto está libre:
```powershell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
```

Si no muestra nada, el puerto está libre.

---

## ❌ Error: Cannot find module

### Solución:
```bash
# Desde la raíz del proyecto
npm install --legacy-peer-deps
```

---

## ❌ Error: Database locked

### Solución:
1. Cerrar todos los procesos del backend
2. Esperar unos segundos
3. Reiniciar el backend

O resetear la base de datos:
```bash
cd backend
npm run db:rollback
npm run db:migrate
npm run db:seed
```

---

## ❌ Frontend no se conecta al backend

### Verificar:
1. ✅ Backend está corriendo en http://localhost:3000
2. ✅ Frontend está corriendo en http://localhost:3001
3. ✅ Archivo `.env` tiene `FRONTEND_URL=http://localhost:3001`
4. ✅ Archivo `.env` tiene `ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000`

### Probar conexión:
```powershell
Invoke-WebRequest -Uri http://localhost:3000/health -UseBasicParsing
```

---

## ❌ Error al hacer login

### Verificar:
1. ✅ Migraciones ejecutadas: `npm run db:migrate`
2. ✅ Seeds ejecutados: `npm run db:seed`
3. ✅ Business ID correcto: `demo-business-001`
4. ✅ Teléfono correcto: `+5491123456789`
5. ✅ Contraseña correcta: `demo123`

---

## 🔄 Reiniciar Todo

Si nada funciona, reinicia todo:

```powershell
# 1. Cerrar todos los procesos
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Esperar 2 segundos
Start-Sleep -Seconds 2

# 3. Iniciar backend (Terminal 1)
cd backend
npm run dev

# 4. Iniciar frontend (Terminal 2)
cd frontend\admin-panel
npm run dev
```

