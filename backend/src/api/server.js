import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import businessRoutes from './routes/businesses.js';
import serviceRoutes from './routes/services.js';
import bookingRoutes from './routes/bookings.js';
import settingsRoutes from './routes/settings.js';
import availabilityRoutes from './routes/availability.js';
import paymentRoutes from './routes/payments.js';
import botRoutes from './routes/bot.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();

// Configurar trust proxy para Render
app.set('trust proxy', 1);

// CORS primero
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helmet con configuración mínima
app.use(helmet({
  contentSecurityPolicy: false,
}));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// RUTAS ESPECIALES PRIMERO (sin rate limiting)

// Health check
app.get('/health', (req, res) => {
  console.log('[Health] GET /health');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

// Rate limiting para el resto de rutas API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: (req) => req.path === '/api/run-seeds',
});

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

// Error handling
app.use((err, req, res, next) => {
  console.error('[Error Handler]', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  
  // En producción, mostrar mensaje de error pero no el stack completo
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({ 
    error: isProduction ? err.message || 'Something went wrong!' : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
});

// 404 handler (al final)
app.use((req, res) => {
  console.log(`[404] ${req.method} ${req.path} - Route not found`);
  res.status(404).json({ error: 'Route not found' });
});

export default app;
