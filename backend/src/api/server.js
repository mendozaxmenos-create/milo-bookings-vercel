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

// Configurar trust proxy para Render (necesario para rate limiting)
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por ventana
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// TEMPORAL: Endpoint para ejecutar seeds manualmente (ANTES de las rutas protegidas)
// TODO: Eliminar este endpoint después de ejecutar los seeds
// IMPORTANTE: Este endpoint debe estar ANTES de app.use('/api/admin', adminRoutes)
app.post('/api/admin/run-seeds', async (req, res) => {
  try {
    console.log('[SeedEndpoint] Ejecutando seeds manualmente...');
    
    // Importar dinámicamente para evitar problemas de circular dependencies
    const knex = (await import('knex')).default;
    const config = (await import('../knexfile.js')).default;
    const { seed: seedDemo } = await import('../database/seeds/001_demo_data.js');
    const { seed: seedSystemUsers } = await import('../database/seeds/003_system_users.js');
    
    const environment = process.env.NODE_ENV || 'production';
    const db = knex(config[environment]);
    
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
    console.log('[SeedEndpoint] Seed de datos demo completado');
    
    console.log('[SeedEndpoint] Ejecutando seed de usuarios del sistema...');
    await seedSystemUsers(db);
    console.log('[SeedEndpoint] Seed de usuarios del sistema completado');
    
    await db.destroy();
    
    console.log('[SeedEndpoint] ✅ Seeds ejecutados correctamente');
    
    res.json({ 
      message: 'Seeds ejecutados correctamente',
      businessesCount: 1, // Debería ser 1 después de ejecutar
      note: 'Puedes intentar iniciar sesión ahora con las credenciales demo'
    });
  } catch (error) {
    console.error('[SeedEndpoint] ❌ Error:', error);
    res.status(500).json({ 
      error: 'Error ejecutando seeds',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Root route - API information
app.get('/', (req, res) => {
  res.json({
    name: 'Milo Bookings API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
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
    documentation: 'See README.md for API documentation',
  });
});

// Logging middleware para todas las peticiones
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// API Routes
// NOTA: /api/admin/run-seeds debe estar ANTES de /api/admin para evitar autenticación

app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/bot', botRoutes);
// Las rutas de admin se registran DESPUÉS del endpoint de seeds
app.use('/api/admin', adminRoutes);

// Error handling
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
  });
}

export default app;

