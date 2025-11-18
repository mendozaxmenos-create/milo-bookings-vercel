import dotenv from 'dotenv';
import app from './api/server.js';
import { BookingBot } from './bot/index.js';
import { Business } from '../database/models/Business.js';
import { startTrialChecker } from './services/trialService.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Almacenar instancias de bots activos
// Exportar para uso en API
export const activeBots = new Map();

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
  
  // Inicializar bots después de que el servidor esté listo
  await initializeBots();
  
  // Iniciar servicio de verificación de trials
  startTrialChecker();
  
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

