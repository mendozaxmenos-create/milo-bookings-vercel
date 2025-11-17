# 🤖 Milo Bookings - Sistema de Gestión de Reservas

**Versión:** 1.0.0  
**Tipo:** White Label - Gestión de Agendas/Reservas  
**Basado en:** Milo Bot  
**Estado:** ✅ Funcional - Listo para Deployment

---

## 📋 Descripción

Milo Bookings es una versión white label de Milo Bot, diseñada específicamente para la gestión de reservas y agendas de negocios de servicios. Permite a los dueños de negocios (salones de belleza, consultorios, estudios, etc.) gestionar sus reservas de forma automatizada a través de WhatsApp, con integración de pagos y un panel de administración completo.

**✨ Característica Principal:** El bot de WhatsApp funciona completamente según la configuración establecida desde el panel web. Todo lo que configures (servicios, horarios, mensajes) se refleja inmediatamente en el bot sin necesidad de reinicios.

---

## ✨ Características Principales

### Para Clientes (vía WhatsApp)
- 📱 Consultar servicios disponibles (configurados desde el panel)
- 📅 Consultar disponibilidad de horarios (según horarios configurados)
- 🎫 Realizar reservas con flujo completo paso a paso
- ✅ Recibir confirmaciones personalizadas
- 📋 Ver sus reservas activas

### Para Dueños de Negocios (Panel Web)
- 🛠️ **Gestión de Servicios** - Crear, editar, activar/desactivar servicios
- ⏰ **Configuración de Horarios** - Establecer horarios de trabajo por día de la semana
- 🚫 **Bloques de Disponibilidad** - Bloquear días/horarios específicos (feriados, etc.)
- 📅 **Gestión de Reservas** - Ver, confirmar, cancelar y gestionar todas las reservas
- 💬 **Personalización de Mensajes** - Configurar mensajes del bot (bienvenida, confirmación, etc.)
- 📊 **Dashboard** - Estadísticas y resumen de reservas
- 🔐 Acceso seguro con autenticación JWT

### Integración Frontend ↔️ Backend ↔️ Bot
- ✅ **Tiempo Real**: Los cambios en el frontend se reflejan inmediatamente en el bot
- ✅ **Sin Reinicios**: El bot consulta la configuración dinámicamente desde la base de datos
- ✅ **Sincronización Automática**: Servicios, horarios y mensajes siempre actualizados

---

## 🏗️ Arquitectura

### Componentes

1. **Bot de WhatsApp** - Interfaz principal con clientes (usa configuración del panel)
2. **API Backend** - Lógica de negocio y endpoints REST
3. **Panel Web** - Administración para dueños de negocios (React + TypeScript)
4. **Base de Datos** - PostgreSQL (producción) / SQLite (desarrollo)
5. **Sistema de Disponibilidad** - Calcula horarios disponibles según configuración

### Tecnologías

- **Backend**: Node.js + Express + ES Modules
- **Frontend**: React + TypeScript + Vite
- **Base de Datos**: SQLite (dev) / PostgreSQL (prod)
- **WhatsApp**: whatsapp-web.js
- **Autenticación**: JWT
- **State Management**: Zustand + React Query

---

## 📚 Documentación

- **[Guía de Deployment](./DEPLOYMENT.md)** - 🚀 **Guía completa para desplegar en la nube**
- **[Backlog Completo](./MILO_BOOKINGS_BACKLOG.md)** - Plan de desarrollo detallado
- **[Arquitectura Técnica](./MILO_BOOKINGS_ARCHITECTURE.md)** - Diseño del sistema
- **[Guía de Setup](./MILO_BOOKINGS_SETUP.md)** - Instrucciones de instalación
- **[Configuración del Repositorio](./MILO_BOOKINGS_REPO_SETUP.md)** - Setup de Git y GitHub

---

## 🚀 Instalación y Deployment

### ⚠️ Importante: Deployment en la Nube

**Milo Bookings está diseñado para ejecutarse en la nube**, no localmente. El bot de WhatsApp requiere un entorno cloud para funcionar correctamente.

### 🌐 Deployment Rápido

**Recomendado: Railway (Backend) + Render/Vercel (Frontend)**

#### Backend:
1. **Railway** (Más fácil):
   - Conecta tu repositorio en [railway.app](https://railway.app)
   - Railway detectará automáticamente la configuración
   - Agrega PostgreSQL desde el dashboard
   - Configura las variables de entorno
   - ¡Listo! El deploy es automático

#### Frontend:
1. **Render/Vercel/Netlify**:
   - Conecta tu repositorio
   - Configura el build: `cd frontend/admin-panel && npm install && npm run build`
   - Configura `VITE_API_URL` con la URL de tu backend
   - ¡Deploy automático!

📖 **Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para guía completa de deployment (Backend + Frontend)**

### 💻 Desarrollo Local (Solo para testing)

Si necesitas probar localmente:

1. **Clonar el repositorio**
```bash
git clone https://github.com/mendozaxmenos-create/milo-bookings.git
cd milo-bookings
```

2. **Instalar dependencias**
```bash
npm install
cd backend && npm install
cd ../frontend/admin-panel && npm install
```

3. **Configurar variables de entorno**
```bash
# Backend
cp .env.example backend/.env
# Editar backend/.env con tus credenciales

# Frontend (opcional)
cd frontend/admin-panel
# Crear .env con VITE_API_URL=http://localhost:3000
```

4. **Inicializar base de datos**
```bash
cd backend
npm run db:migrate
npm run db:seed
```

5. **Iniciar servidores**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend/admin-panel
npm run dev
```

6. **Acceder**
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000/health

⚠️ **Nota**: El bot de WhatsApp puede tener limitaciones en desarrollo local. Para producción, usa un servicio cloud.

---

## 📖 Uso

### Configuración Inicial

1. **Acceder al Panel Web**
   - Abre el frontend (http://localhost:3001 o tu URL de producción)
   - Login con tus credenciales

2. **Configurar Horarios de Trabajo**
   - Ve a "Horarios" en el menú
   - Configura horarios de apertura/cierre para cada día
   - Marca días como cerrados si es necesario
   - El bot usará estos horarios automáticamente

3. **Agregar Servicios**
   - Ve a "Servicios" en el menú
   - Crea tus servicios con precios y duraciones
   - El bot mostrará estos servicios a los clientes

4. **Personalizar Mensajes del Bot**
   - Ve a "Configuración" (próximamente)
   - Personaliza mensajes de bienvenida, confirmación, etc.

5. **Conectar Bot de WhatsApp**
   - El bot se inicializa automáticamente al iniciar el servidor
   - Escanea el código QR que aparece en los logs
   - Una vez conectado, los clientes pueden escribir al bot

### Flujo de Reserva del Cliente

1. Cliente envía mensaje al bot de WhatsApp
2. Bot muestra menú principal con opciones
3. Cliente selecciona "Reservar"
4. Bot muestra servicios disponibles (configurados desde el panel)
5. Cliente selecciona un servicio
6. Bot muestra horarios disponibles (según horarios configurados)
7. Cliente selecciona fecha y hora
8. Bot solicita nombre del cliente
9. Bot muestra resumen y solicita confirmación
10. Cliente confirma → Reserva creada
11. Bot envía confirmación personalizada

### Gestión desde el Panel

- **Ver Reservas**: Todas las reservas aparecen en tiempo real
- **Cambiar Estados**: Confirmar, cancelar, completar reservas
- **Bloquear Horarios**: Bloquea días específicos (feriados, etc.)
- **Actualizar Servicios**: Los cambios se reflejan inmediatamente en el bot

---

## 🔧 Configuración

### Variables de Entorno - Backend

```env
# Servidor
PORT=3000
NODE_ENV=production

# Base de Datos
DATABASE_URL=postgresql://user:password@host:5432/milo_bookings

# JWT
JWT_SECRET=tu_secreto_jwt_muy_seguro_minimo_32_caracteres

# WhatsApp
SESSION_STORAGE_TYPE=local
SESSION_STORAGE_PATH=/tmp/whatsapp-sessions
QR_WEBHOOK_URL=https://tu-dominio.com/api/webhooks/qr

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=tu_access_token
MERCADOPAGO_PUBLIC_KEY=tu_public_key

# CORS - IMPORTANTE: Incluir la URL del frontend
ALLOWED_ORIGINS=https://admin.tu-dominio.com,https://tu-dominio.com
FRONTEND_URL=https://admin.tu-dominio.com
```

### Variables de Entorno - Frontend

```env
# URL del API Backend (REQUERIDA en producción)
VITE_API_URL=https://api.tu-dominio.com

# Puerto (solo para desarrollo local)
VITE_PORT=3001
```

---

## 📁 Estructura del Proyecto

```
milo-bookings/
├── backend/
│   ├── src/
│   │   ├── api/              # Endpoints REST
│   │   │   └── routes/       # auth, services, bookings, availability, settings
│   │   ├── bot/              # Lógica del bot WhatsApp
│   │   │   └── handlers/     # Manejo de mensajes
│   │   ├── services/         # Lógica de negocio
│   │   │   ├── availabilityService.js
│   │   │   └── sessionStorage.js
│   │   └── utils/            # Utilidades (auth, validators)
│   ├── database/
│   │   ├── migrations/       # Migraciones de BD
│   │   ├── models/           # Modelos de datos
│   │   └── seeds/            # Datos de prueba
│   └── data/                 # Base de datos SQLite (dev)
├── frontend/
│   └── admin-panel/          # Panel web React
│       └── src/
│           ├── pages/        # Dashboard, Services, Bookings, Availability
│           ├── components/   # Componentes reutilizables
│           ├── services/     # Cliente API
│           └── store/        # Estado global (Zustand)
├── shared/                    # Tipos TypeScript compartidos
├── docs/                      # Documentación
└── tests/                     # Tests
```

---

## 🎯 Estado del Proyecto

### ✅ Completado

- ✅ **FASE 1**: Fundación y Core
  - Sistema multi-tenant
  - Autenticación JWT
  - Integración con WhatsApp
  - Base de datos configurada

- ✅ **FASE 2**: Funcionalidades Core de Reservas
  - Flujo completo de reservas en el bot
  - Validación de disponibilidad
  - Consulta de servicios y horarios
  - Sistema de disponibilidad dinámico

- ✅ **FASE 3**: Panel de Administración
  - Dashboard con estadísticas
  - Gestión de servicios (CRUD completo)
  - Gestión de reservas
  - **Configuración de horarios de trabajo**
  - **Bloques de disponibilidad**
  - Personalización de mensajes del bot

- ✅ **FASE 4**: Integración Frontend-Backend-Bot
  - El bot consulta configuración dinámicamente
  - Cambios en frontend se reflejan en el bot
  - Sin necesidad de reinicios

- ✅ **Deployment en la Nube**
  - Configuración para Railway, Render, Heroku
  - Dockerfile incluido
  - Variables de entorno documentadas
  - Frontend configurado para producción

### ⏳ Pendiente

- ⏳ **FASE 5**: Integración con MercadoPago
  - Generación de links de pago
  - Webhooks para confirmación
  - Actualización de estados de pago

- ⏳ **FASE 6**: Personalización Avanzada
  - Recordatorios automáticos
  - Notificaciones al dueño
  - Reportes y estadísticas avanzadas

- ⏳ **FASE 7**: Integración con Milo
  - Acceso a funcionalidades de Milo para super usuarios

---

## 🔐 Seguridad

- Contraseñas encriptadas con bcrypt
- JWT para autenticación
- Rate limiting en API
- Validación de inputs
- CORS configurado
- Variables de entorno para secretos

---

## 🧪 Testing

### Datos de Prueba

**Usuario para Login:**
- **Business ID**: `demo-business-001`
- **Teléfono**: `+5491123456789`
- **Contraseña**: `demo123`

**Servicios de Prueba:**
1. Corte de Cabello - $2,500.00 (30 min)
2. Peinado - $3,500.00 (60 min)
3. Tintura - $5,000.00 (90 min)

### Probar el Bot

1. Inicia el backend (el bot se inicializa automáticamente)
2. Escanea el código QR que aparece en los logs
3. Escribe "menu" o "inicio" al bot
4. Prueba el flujo completo de reserva

---

## 📊 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario

### Servicios
- `GET /api/services` - Listar servicios
- `POST /api/services` - Crear servicio
- `PUT /api/services/:id` - Actualizar servicio
- `DELETE /api/services/:id` - Eliminar servicio
- `PATCH /api/services/:id/toggle` - Activar/desactivar

### Reservas
- `GET /api/bookings` - Listar reservas
- `POST /api/bookings` - Crear reserva
- `PUT /api/bookings/:id` - Actualizar reserva
- `DELETE /api/bookings/:id` - Eliminar reserva
- `PATCH /api/bookings/:id/status` - Cambiar estado

### Horarios y Disponibilidad
- `GET /api/availability/hours` - Obtener horarios de trabajo
- `PUT /api/availability/hours/:dayOfWeek` - Actualizar horario de un día
- `PUT /api/availability/hours` - Actualizar todos los horarios
- `GET /api/availability/slots` - Obtener bloques de disponibilidad
- `POST /api/availability/slots` - Crear bloque (bloquear horario)
- `DELETE /api/availability/slots/:id` - Eliminar bloque
- `GET /api/availability/available-times` - Consultar horarios disponibles

### Configuración
- `GET /api/settings` - Obtener configuración del negocio
- `PUT /api/settings` - Actualizar configuración (mensajes del bot)

---

## 🚀 Próximos Pasos

1. **Integración con MercadoPago** - Procesamiento de pagos
2. **Notificaciones** - Recordatorios automáticos y notificaciones al dueño
3. **Reportes** - Estadísticas y reportes avanzados
4. **Integración con Milo** - Acceso a funcionalidades adicionales

---

## 🤝 Contribución

Este es un proyecto privado. Para contribuciones, contactar al equipo de desarrollo.

---

## 📄 Licencia

Propietario - Mendoza x Menos Create

---

## 📞 Soporte

Para soporte técnico o consultas, contactar al equipo de desarrollo.

---

## 🎉 Características Destacadas

### ✨ Integración en Tiempo Real

**El bot funciona completamente según la configuración del panel web:**

- ✅ **Servicios**: Los servicios que agregues/edites en el panel se muestran inmediatamente en el bot
- ✅ **Horarios**: Los horarios que configures se usan automáticamente para calcular disponibilidad
- ✅ **Mensajes**: Los mensajes personalizados se aplican en tiempo real
- ✅ **Bloques**: Los horarios bloqueados se respetan automáticamente
- ✅ **Sin Reinicios**: Todo funciona dinámicamente, sin necesidad de reiniciar el bot

### 🔄 Flujo Completo de Reservas

El bot guía al cliente paso a paso:
1. Selección de servicio
2. Selección de fecha (muestra horarios disponibles)
3. Selección de hora (valida disponibilidad)
4. Ingreso de nombre
5. Confirmación con resumen
6. Creación de reserva

### 📱 Panel de Administración Completo

- Dashboard con estadísticas
- Gestión completa de servicios
- Configuración de horarios por día
- Bloqueo de disponibilidad
- Gestión de reservas
- Personalización de mensajes

---

**Última actualización:** Enero 2025  
**Versión:** 1.0.0

