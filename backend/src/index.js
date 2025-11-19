import dotenv from 'dotenv';
import app from './api/server.js';
import { BookingBot } from './bot/index.js';
import { Business } from '../database/models/Business.js';
import { startTrialChecker } from './services/trialService.js';
import { startReminderService } from './services/reminderService.js';
import knex from 'knex';
import config from '../knexfile.js';
import { seed as seedDemo } from '../database/seeds/001_demo_data.js';
import { seed as seedSystemUsers } from '../database/seeds/003_system_users.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Almacenar instancias de bots activos
// Exportar para uso en API
export const activeBots = new Map();

// Función para ejecutar seeds si no hay datos
async function checkAndSeed() {
  let db;
  try {
    console.log('='.repeat(60));
    console.log('[SeedCheck] 🌱 Verificando si se necesitan seeds...');
    console.log('[SeedCheck] NODE_ENV:', process.env.NODE_ENV);
    console.log('[SeedCheck] DATABASE_URL definida:', !!process.env.DATABASE_URL);
    
    const environment = process.env.NODE_ENV || 'production';
    console.log('[SeedCheck] Environment config:', environment);
    console.log('[SeedCheck] Conectando a la base de datos...');
    
    db = knex(config[environment]);
    console.log('[SeedCheck] ✅ Conexión establecida');
    
    console.log('[SeedCheck] Verificando negocios...');
    const businessesCount = await db('businesses').count('* as count').first();
    const count = parseInt(businessesCount?.count || 0, 10);
    console.log(`[SeedCheck] 📈 Negocios encontrados: ${count}`);
    
    if (count === 0) {
      console.log('[SeedCheck] ⚠️  No hay datos, ejecutando seeds...');
      console.log('[SeedCheck] 📝 Ejecutando seed de datos demo...');
      await seedDemo(db);
      console.log('[SeedCheck] ✅ Seed de datos demo completado');
      
      console.log('[SeedCheck] 👤 Ejecutando seed de usuarios del sistema...');
      await seedSystemUsers(db);
      console.log('[SeedCheck] ✅ Seed de usuarios del sistema completado');
      
      console.log('[SeedCheck] 🎉 ✅ TODOS LOS SEEDS EJECUTADOS CORRECTAMENTE');
      console.log('[SeedCheck] 📋 Credenciales demo:');
      console.log('[SeedCheck]    Business ID: demo-business-001');
      console.log('[SeedCheck]    Teléfono: +5491123456789');
      console.log('[SeedCheck]    Contraseña: demo123');
    } else {
      console.log('[SeedCheck] ✅ Ya hay datos en la base de datos, saltando seeds');
    }
    
    await db.destroy();
    console.log('[SeedCheck] 🔌 Conexión cerrada');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('[SeedCheck] ❌ ERROR:', error.message);
    console.error('[SeedCheck] Error completo:', error);
    console.error('[SeedCheck] Stack:', error.stack);
    if (db) {
      try {
        await db.destroy();
      } catch (e) {
        console.error('[SeedCheck] Error cerrando conexión:', e);
      }
    }
    console.log('[SeedCheck] ⚠️  Continuando sin seeds...');
    throw error; // Re-lanzar para que el try-catch externo lo capture
  }
}

// Función para inicializar bots de todos los negocios activos
async function initializeBots() {
  try {
    // Obtener todos los negocios activos
    const businesses = await Business.findAllActive();
    
    console.log(`📱 Inicializando ${businesses.length} bot(s) de WhatsApp...`);
    
    for (const business of businesses) {
      if (business.whatsapp_number) {
        try {
          const bot = new BookingBot(business.id, business.whatsapp_number);
          await bot.initialize();
          activeBots.set(business.id, bot);
          console.log(`✅ Bot inicializado para: ${business.name} (${business.id})`);
        } catch (error) {
          console.error(`❌ Error al inicializar bot para ${business.name}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error('Error al inicializar bots:', error);
  }
}

// Inicializar servidor
app.listen(PORT, '0.0.0.0', async () => {
  console.log('='.repeat(60));
  console.log(`🚀 Milo Bookings Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 API URL: http://localhost:${PORT}`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log('='.repeat(60));
  console.log('');
  
  try {
    // EJECUTAR SEEDS PRIMERO (si no hay datos)
    console.log('[Init] Iniciando verificación de seeds...');
    await checkAndSeed();
    console.log('[Init] Verificación de seeds completada');
  } catch (error) {
    console.error('[Init] ERROR ejecutando seeds:', error);
    console.error('[Init] Stack:', error.stack);
  }
  
  try {
    // Inicializar bots después de que el servidor esté listo
    console.log('[Init] Iniciando bots...');
    await initializeBots();
    console.log('[Init] Bots inicializados');
  } catch (error) {
    console.error('[Init] ERROR inicializando bots:', error);
  }
  
  // Iniciar servicio de verificación de trials
  startTrialChecker();
  
  // Iniciar servicio de recordatorios
  startReminderService();
  
  console.log('\n✅ Backend listo para recibir peticiones\n');
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

