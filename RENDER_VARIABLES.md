# 🔐 Variables de Entorno para Render

## ✅ Base de Datos (YA CONFIGURADA)

Usa la **Internal Database URL** para el servicio web:

```
DATABASE_URL=postgresql://milo_user:g4u8iqVOZ3tmGlhZDIAUkZNQ1rLhGUY0@dpg-d4eeljmr433s738lqq4g-a/milo_bookings
```

## 📋 Variables Obligatorias para Agregar

Cuando crees el Web Service en Render, agrega estas variables en la sección **"Environment Variables"**:

### 1. Base de Datos (OBLIGATORIO)
```
DATABASE_URL=postgresql://milo_user:g4u8iqVOZ3tmGlhZDIAUkZNQ1rLhGUY0@dpg-d4eeljmr433s738lqq4g-a/milo_bookings
```

### 2. JWT Secret (OBLIGATORIO - Genera uno seguro)
```
JWT_SECRET=tu-clave-super-secreta-minimo-32-caracteres-aleatorios-2024
```

**💡 Tip**: Puedes generar uno seguro con este comando:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Entorno (OBLIGATORIO)
```
NODE_ENV=production
PORT=3000
```

### 4. WhatsApp Bot (Opcional pero recomendado)
```
SESSION_STORAGE_TYPE=local
SESSION_STORAGE_PATH=/app/backend/data/whatsapp-sessions
```

### 5. MercadoPago (Solo si lo usas)
```
MERCADOPAGO_ACCESS_TOKEN=tu_access_token
MERCADOPAGO_PUBLIC_KEY=tu_public_key
MERCADOPAGO_PRODUCTION=true
WEBHOOK_BASE_URL=https://tu-app.onrender.com
MP_SUCCESS_URL=https://tu-app.onrender.com/payments/success
MP_FAILURE_URL=https://tu-app.onrender.com/payments/failure
MP_PENDING_URL=https://tu-app.onrender.com/payments/pending
```

## 🎯 Resumen Rápido

**Mínimo necesario para funcionar:**
1. `DATABASE_URL` (ya la tienes)
2. `JWT_SECRET` (genera uno seguro)
3. `NODE_ENV=production`
4. `PORT=3000`

---

**Nota**: La External Database URL solo la necesitarías si quisieras conectar desde fuera de Render (por ejemplo, desde tu máquina local para desarrollo).

