import dotenv from 'dotenv';
import app from './api/server.js';
import { BookingBot } from './bot/index.js';
import { Business } from '../database/models/Business.js';
import { startTrialChecker } from './services/trialService.js';
import { startReminderService } from './services/reminderService.js';
import { startBackupService } from './services/backupService.js';
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
    
    console.log(`📱 [Init] Encontrados ${businesses.length} negocio(s) activo(s) en la base de datos`);
    console.log(`📱 [Init] Detalles de negocios:`, businesses.map(b => ({
      id: b.id,
      name: b.name,
      whatsapp_number: b.whatsapp_number,
      is_active: b.is_active
    })));
    console.log(`📱 [Init] Inicializando ${businesses.length} bot(s) de WhatsApp...`);
    
    for (const business of businesses) {
      if (business.whatsapp_number) {
        try {
          console.log(`🔄 [Init] Inicializando bot para: ${business.name} (${business.id})`);
          console.log(`🔄 [Init] WhatsApp number: ${business.whatsapp_number}`);
          const bot = new BookingBot(business.id, business.whatsapp_number);
          
          // Agregar bot a activeBots ANTES de inicializar (para que esté disponible inmediatamente)
          activeBots.set(business.id, bot);
          console.log(`✅ [Init] Bot agregado a activeBots: ${business.id}`);
          
          // Inicializar bot de forma ASÍNCRONA y NO BLOQUEANTE
          // Esto permite que el servidor esté listo inmediatamente
          bot.initialize().then(() => {
            console.log(`✅ [Init] Bot inicialización completada: ${business.name} (${business.id})`);
          }).catch((initError) => {
            console.error(`❌ [Init] Error durante initialize() para ${business.id}:`, initError.message);
            // No eliminar de activeBots, el bot puede seguir intentando
          });
          
          // NO esperar a que termine la inicialización - el bot ya está en activeBots
          console.log(`⚡ [Init] Bot ${business.id} inicializándose en segundo plano (servidor listo inmediatamente)`);
        } catch (error) {
          console.error(`❌ [Init] Error al crear bot para ${business.name} (${business.id}):`, error.message);
          console.error(`❌ [Init] Error stack:`, error.stack);
          // Si hay error al crear el bot, eliminarlo de activeBots
          activeBots.delete(business.id);
        }
      } else {
        console.log(`⚠️ [Init] Negocio ${business.name} (${business.id}) no tiene whatsapp_number, saltando...`);
      }
    }
    
    console.log(`📱 [Init] Total de bots activos después de inicialización: ${activeBots.size}`);
    console.log(`📱 [Init] IDs de bots en activeBots:`, Array.from(activeBots.keys()));
  } catch (error) {
    console.error('❌ [Init] Error al inicializar bots:', error);
    console.error('❌ [Init] Error stack:', error.stack);
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
  
  const enableTrials = process.env.ENABLE_TRIAL_SERVICE !== 'false';
  const enableReminders = process.env.ENABLE_REMINDERS !== 'false';
  const enableBackups = process.env.ENABLE_BACKUPS !== 'false';
  
  if (enableTrials) {
    startTrialChecker();
  } else {
    console.log('[Init] ⏸️ Servicio de verificación de trials deshabilitado por configuración');
  }
  
  if (enableReminders) {
    startReminderService();
  } else {
    console.log('[Init] ⏸️ Servicio de recordatorios deshabilitado por configuración');
  }

  if (enableBackups && process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
    const backupHour = parseInt(process.env.BACKUP_HOUR || '2', 10); // Default: 2 AM
    try {
      startBackupService(backupHour);
      console.log(`[Init] ✅ Servicio de backup automático iniciado (ejecución diaria a las ${backupHour}:00)`);
    } catch (error) {
      console.error('[Init] ⚠️ Error iniciando servicio de backup:', error.message);
      console.error('[Init] El servidor continuará sin backups automáticos');
    }
  } else if (!enableBackups) {
    console.log('[Init] ⏸️ Servicio de backups automáticos deshabilitado por configuración');
  } else {
    console.log('[Init] ⚠️ Backup automático deshabilitado (solo disponible en producción con DATABASE_URL)');
  }
  
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

