# 🚀 Guía de Deploy en Qoddi (GRATIS)

Qoddi es una alternativa similar a Heroku. Ofrece:
- ✅ Plan gratuito generoso
- ✅ PostgreSQL gratuito
- ✅ Deploy automático desde GitHub
- ✅ SSL/HTTPS automático

## 📋 Pre-requisitos

1. Cuenta en GitHub
2. Cuenta en Qoddi (https://qoddi.com)

## 🎯 Paso a Paso

### Paso 1: Crear cuenta

1. Ve a https://qoddi.com
2. Haz clic en **"Sign Up"**
3. Conecta tu cuenta de GitHub

### Paso 2: Crear App

1. Haz clic en **"New App"**
2. Selecciona **"From GitHub"**
3. Selecciona tu repositorio: `mendozaxmenos-create/milo-bookings`
4. Configura:
   - **App Name**: `milo-bookings`
   - **Region**: Elige la más cercana
   - **Buildpack**: `Docker` (detectará el Dockerfile automáticamente)

### Paso 3: Agregar PostgreSQL

1. En tu app, ve a **"Add-ons"**
2. Selecciona **"PostgreSQL"**
3. Elige el plan **"Free"**
4. Qoddi configurará automáticamente `DATABASE_URL`

### Paso 4: Configurar Variables

En **"Environment Variables"**, agrega:

```env
JWT_SECRET=tu-clave-super-secreta-minimo-32-caracteres
NODE_ENV=production
PORT=3000
```

### Paso 5: Deploy

1. Haz clic en **"Deploy"**
2. Espera a que termine el build
3. Tu app estará disponible en: `https://milo-bookings.qoddi.app`

---

**Más detalles**: https://qoddi.com/docs

