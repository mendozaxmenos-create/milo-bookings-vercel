# 🚀 Guía de Deploy en Fly.io (GRATIS)

Fly.io es otra excelente opción gratuita. Ofrece:
- ✅ Plan gratuito con 3 VMs compartidas
- ✅ PostgreSQL gratuito (hasta 3GB)
- ✅ Deploy desde CLI o GitHub
- ✅ SSL/HTTPS automático
- ✅ Sin límites de tamaño

## 📋 Pre-requisitos

1. Cuenta en Fly.io (https://fly.io)
2. Fly CLI instalado

## 🎯 Instalación Rápida

### Paso 1: Instalar Fly CLI

```bash
# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# O con npm
npm install -g flyctl
```

### Paso 2: Login

```bash
fly auth login
```

### Paso 3: Crear App

```bash
cd C:\Users\gusta\Desktop\milo-bookings
fly launch
```

Esto te preguntará:
- Nombre de la app (o déjalo que lo genere)
- Región (elige la más cercana)
- PostgreSQL: **Sí** (creará una base de datos)
- Redis: No (a menos que lo necesites)

### Paso 4: Configurar Variables

```bash
fly secrets set JWT_SECRET=tu-clave-super-secreta-minimo-32-caracteres
fly secrets set NODE_ENV=production
```

### Paso 5: Deploy

```bash
fly deploy
```

### Paso 6: Verificar

```bash
fly status
fly logs
```

## 📝 Notas

- Fly.io requiere un archivo `fly.toml` (se genera automáticamente con `fly launch`)
- El plan gratuito incluye 3 VMs compartidas
- PostgreSQL gratuito hasta 3GB
- Puedes escalar cuando lo necesites

---

**Más detalles**: https://fly.io/docs/

