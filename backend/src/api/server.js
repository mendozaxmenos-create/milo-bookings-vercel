import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { apiLogger } from '../utils/logger.js';
import authRoutes from './routes/auth.js';
import businessRoutes from './routes/businesses.js';
import serviceRoutes from './routes/services.js';
import bookingRoutes from './routes/bookings.js';
import settingsRoutes from './routes/settings.js';
import availabilityRoutes from './routes/availability.js';
import paymentRoutes from './routes/payments.js';
import botRoutes from './routes/bot.js';
import adminRoutes from './routes/admin.js';
import insuranceRoutes from './routes/insurance.js';
import serviceResourcesRoutes from './routes/serviceResources.js';

dotenv.config();

const app = express();

// Configurar trust proxy para Render
app.set('trust proxy', 1);

// CORS primero
// Función para verificar si el origen está permitido
const corsOptions = {
  origin: (origin, callback) => {
    // Permitir requests sin origen (Postman, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Obtener orígenes permitidos desde variable de entorno
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];
    
    // Permitir todos los dominios de Vercel automáticamente
    const isVercelDomain = origin.includes('.vercel.app') || origin.includes('vercel.app');
    
    // Si está en la lista de permitidos o es un dominio de Vercel
    if (allowedOrigins.includes(origin) || isVercelDomain || allowedOrigins.length === 0) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helmet con configuración mínima
app.use(helmet({
  contentSecurityPolicy: false,
}));

// Logging middleware estructurado
app.use((req, res, next) => {
  // Solo loggear en modo debug o para rutas importantes
  if (process.env.LOG_LEVEL === 'DEBUG' || req.path.includes('/api/')) {
    apiLogger.debug(`${req.method} ${req.path}`, {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
    });
  }
  next();
});

// RUTAS ESPECIALES PRIMERO (sin rate limiting)

// Health check mejorado
app.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    };

    // Verificar conexión a base de datos
    try {
      const db = (await import('../../database/index.js')).default;
      await db.raw('SELECT 1');
      health.database = { status: 'connected' };
    } catch (dbError) {
      health.database = { status: 'error', error: dbError.message };
      health.status = 'degraded';
    }

    // Verificar variables de entorno críticas
    health.config = {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeVersion: process.version,
    };

    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    apiLogger.error('Health check failed', { error: error.message, stack: error.stack });
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Health check detallado (solo en desarrollo o para super admin)
app.get('/health/detailed', async (req, res) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      pid: process.pid,
    };

    // Verificar conexión a base de datos con detalles
    try {
      const db = (await import('../../database/index.js')).default;
      await db.raw('SELECT 1');
      
      // Contar registros en tablas principales
      const businessesCount = await db('businesses').count('* as count').first();
      const bookingsCount = await db('bookings').count('* as count').first();
      const servicesCount = await db('services').count('* as count').first();

      health.database = {
        status: 'connected',
        businesses: parseInt(businessesCount?.count || 0),
        bookings: parseInt(bookingsCount?.count || 0),
        services: parseInt(servicesCount?.count || 0),
      };
    } catch (dbError) {
      health.database = { status: 'error', error: dbError.message };
      health.status = 'degraded';
    }

    // Información del sistema
    health.system = {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasMercadoPago: !!process.env.MERCADOPAGO_ACCESS_TOKEN,
    };

    // Verificar bots activos
    try {
      const { activeBots } = await import('../../index.js');
      health.bots = {
        activeCount: activeBots.size,
      };
    } catch (botError) {
      health.bots = { status: 'error', error: botError.message };
    }

    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    apiLogger.error('Detailed health check failed', { error: error.message, stack: error.stack });
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Root route - DEBE ESTAR ANTES DE CUALQUIER OTRA COSA
app.get('/', (req, res) => {
  console.log('[Root] GET / - Handler ejecutándose');
  const response = {
    name: 'Milo Bookings API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      healthDetailed: '/health/detailed',
      runSeeds: '/api/run-seeds (POST) - TEMPORAL',
      auth: '/api/auth',
      businesses: '/api/businesses',
      services: '/api/services',
      bookings: '/api/bookings',
      settings: '/api/settings',
      availability: '/api/availability',
      payments: '/api/payments',
      bot: '/api/bot',
      admin: '/api/admin',
    },
  };
  console.log('[Root] Enviando respuesta');
  res.json(response);
});

// Endpoint para ejecutar seeds
app.post('/api/run-seeds', async (req, res) => {
  console.log('[SeedEndpoint] POST /api/run-seeds');
  try {
    const knex = (await import('knex')).default;
    const config = (await import('../../knexfile.js')).default;
    const { seed: seedDemo } = await import('../../database/seeds/001_demo_data.js');
    const { seed: seedSystemUsers } = await import('../../database/seeds/003_system_users.js');
    
    const environment = process.env.NODE_ENV || 'production';
    const db = knex(config[environment]);
    
    const businessesCount = await db('businesses').count('* as count').first();
    const count = parseInt(businessesCount?.count || 0, 10);
    
    if (count > 0) {
      await db.destroy();
      return res.json({ 
        message: 'Ya hay datos en la base de datos',
        businessesCount: count,
      });
    }
    
    await seedDemo(db);
    await seedSystemUsers(db);
    await db.destroy();
    
    res.json({ 
      message: 'Seeds ejecutados correctamente',
      businessesCount: 1,
      note: 'Puedes intentar iniciar sesión ahora con las credenciales demo'
    });
  } catch (error) {
    console.error('[SeedEndpoint] Error:', error);
    res.status(500).json({ 
      error: 'Error ejecutando seeds',
      message: error.message,
    });
  }
});

// Internal status endpoint (protected by token)
app.get('/internal/status', async (req, res) => {
  try {
    if (!process.env.INTERNAL_API_TOKEN) {
      return res.status(503).json({ error: 'Internal token not configured' });
    }
    if (req.query.token !== process.env.INTERNAL_API_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const knex = (await import('knex')).default;
    const config = (await import('../../knexfile.js')).default;
    const environment = process.env.NODE_ENV || 'production';
    const db = knex(config[environment]);

    const [businessesCount] = await db('businesses').count('* as count');
    const [businessUsersCount] = await db('business_users').count('* as count');
    const [systemUsersCount] = await db('system_users').count('* as count');

    const latestBusiness = await db('businesses').orderBy('created_at', 'desc').first();
    const latestBusinessUser = await db('business_users')
      .select('id', 'business_id', 'phone', 'role', 'created_at')
      .orderBy('created_at', 'desc')
      .first();
    const latestSystemUser = await db('system_users')
      .select('id', 'email', 'role', 'is_active', 'created_at')
      .orderBy('created_at', 'desc')
      .first();

    await db.destroy();

    res.json({
      data: {
        counts: {
          businesses: parseInt(businessesCount?.count || 0, 10),
          business_users: parseInt(businessUsersCount?.count || 0, 10),
          system_users: parseInt(systemUsersCount?.count || 0, 10),
        },
        latest: {
          business: latestBusiness,
          business_user: latestBusinessUser,
          system_user: latestSystemUser,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[InternalStatus] Error:', error);
    res.status(500).json({ error: 'Internal status error', message: error.message });
  }
});

// Rate limiting específico para endpoints sensibles
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos por IP por ventana de tiempo
  message: { error: 'Demasiados intentos. Por favor intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Permitir más intentos para password reset en desarrollo
    if (process.env.NODE_ENV !== 'production' && req.path.includes('/forgot-password')) {
      return true;
    }
    return false;
  },
});

// Rate limiting para password reset (más estricto)
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Solo 3 intentos por hora
  message: { error: 'Demasiados intentos de recuperación de contraseña. Por favor intenta de nuevo en 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting general para API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // 200 requests por IP por ventana de tiempo
  message: { error: 'Demasiadas solicitudes. Por favor intenta de nuevo más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Saltar rate limiting para endpoints especiales
    if (req.path === '/api/run-seeds') return true;
    // Saltar para health checks
    if (req.path === '/health' || req.path === '/') return true;
    return false;
  },
});

// Aplicar rate limiting general a todas las rutas API
app.use('/api/', apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/bot', botRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/service-resources', serviceResourcesRoutes);

// Error handling con logging estructurado
app.use((err, req, res, next) => {
  const errorMeta = {
    path: req.path,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: req.user?.user_id || null,
    businessId: req.user?.business_id || null,
    stack: err.stack,
  };

  // Log del error con contexto
  apiLogger.error(err.message || 'Unhandled error', errorMeta);

  // En producción, mostrar mensaje de error pero no el stack completo
  const isProduction = process.env.NODE_ENV === 'production';
  const statusCode = err.status || err.statusCode || 500;

  res.status(statusCode).json({ 
    error: isProduction && statusCode === 500 
      ? 'Internal server error' 
      : (err.message || 'Something went wrong!'),
    ...(isProduction ? {} : { 
      stack: err.stack,
      path: req.path,
    }),
  });
});

// 404 handler (al final)
app.use((req, res) => {
  console.log(`[404] ${req.method} ${req.path} - Route not found`);
  res.status(404).json({ error: 'Route not found' });
});

export default app;
