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
const PORT = process.env.PORT || 3000;

// Configurar trust proxy para Render
app.set('trust proxy', 1);

// Middleware básico
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware (temprano para ver todas las peticiones)
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root route
app.get('/', (req, res) => {
  res.json({
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
  });
});

// TEMPORAL: Endpoint para ejecutar seeds (SIN rate limiting, SIN autenticación)
app.post('/api/run-seeds', async (req, res) => {
  try {
    console.log('[SeedEndpoint] ⚡ Iniciando ejecución de seeds...');
    
    const knex = (await import('knex')).default;
    const config = (await import('../knexfile.js')).default;
    const { seed: seedDemo } = await import('../database/seeds/001_demo_data.js');
    const { seed: seedSystemUsers } = await import('../database/seeds/003_system_users.js');
    
    const environment = process.env.NODE_ENV || 'production';
    console.log('[SeedEndpoint] Environment:', environment);
    
    const db = knex(config[environment]);
    console.log('[SeedEndpoint] Conexión a DB establecida');
    
    // Verificar si hay negocios
    const businessesCount = await db('businesses').count('* as count').first();
    const count = parseInt(businessesCount?.count || 0, 10);
    console.log(`[SeedEndpoint] Negocios encontrados: ${count}`);
    
    if (count > 0) {
      await db.destroy();
      return res.json({ 
        message: 'Ya hay datos en la base de datos',
        businessesCount: count,
        note: 'Los seeds no se ejecutaron porque ya existen negocios'
      });
    }
    
    console.log('[SeedEndpoint] Ejecutando seed de datos demo...');
    await seedDemo(db);
    console.log('[SeedEndpoint] ✅ Seed de datos demo completado');
    
    console.log('[SeedEndpoint] Ejecutando seed de usuarios del sistema...');
    await seedSystemUsers(db);
    console.log('[SeedEndpoint] ✅ Seed de usuarios del sistema completado');
    
    await db.destroy();
    console.log('[SeedEndpoint] ✅ Todos los seeds ejecutados correctamente');
    
    res.json({ 
      message: 'Seeds ejecutados correctamente',
      businessesCount: 1,
      note: 'Puedes intentar iniciar sesión ahora con las credenciales demo'
    });
  } catch (error) {
    console.error('[SeedEndpoint] ❌ Error:', error);
    console.error('[SeedEndpoint] Stack:', error.stack);
    res.status(500).json({ 
      error: 'Error ejecutando seeds',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Rate limiting (solo para rutas de API, excluyendo /api/run-seeds)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: (req) => req.path === '/api/run-seeds',
});

// Aplicar rate limiting a rutas de API
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
  console.error('[Error Handler]', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler (al final)
app.use((req, res) => {
  console.log(`[404] Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Route not found' });
});

export default app;
