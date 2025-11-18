import { Business } from '../../database/models/Business.js';
import { SystemConfig } from '../../database/models/SystemConfig.js';
import { activeBots } from '../index.js';

/**
 * Verifica negocios con trial expirado y envía notificaciones
 */
export async function checkExpiredTrials() {
  try {
    const now = new Date();
    
    // Buscar negocios con trial expirado
    const businesses = await Business.findAllWithTrials();
    
    const expiredTrials = businesses.filter(business => {
      if (!business.is_trial || !business.trial_end_date) {
        return false;
      }
      
      const endDate = new Date(business.trial_end_date);
      // Verificar si expiró hoy o antes (con margen de 1 hora para evitar múltiples notificaciones)
      return endDate < now && (now - endDate) < 24 * 60 * 60 * 1000; // Solo notificar si expiró en las últimas 24 horas
    });
    
    if (expiredTrials.length === 0) {
      return;
    }
    
    console.log(`[TrialService] Encontrados ${expiredTrials.length} trial(s) expirado(s)`);
    
    // Obtener precio de suscripción
    const subscriptionPrice = await SystemConfig.get('subscription_price') || '5000.00';
    
    // Enviar notificaciones
    for (const business of expiredTrials) {
      await notifyTrialExpired(business, subscriptionPrice);
    }
  } catch (error) {
    console.error('[TrialService] Error verificando trials expirados:', error);
  }
}

/**
 * Envía notificación de trial expirado al dueño del negocio
 */
async function notifyTrialExpired(business, subscriptionPrice) {
  try {
    const bot = activeBots.get(business.id);
    
    if (!bot) {
      console.warn(`[TrialService] Bot no disponible para negocio ${business.id}`);
      return;
    }
    
    // Formatear precio
    const price = parseFloat(subscriptionPrice).toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
    });
    
    const message = `🚨 *Período de Prueba Finalizado*

Hola! Te informamos que tu período de prueba de 7 días en Milo Bookings ha finalizado.

Para continuar utilizando nuestros servicios y mantener tu bot de reservas activo, necesitas abonar tu suscripción mensual.

💰 *Precio de Suscripción:* ${price}

Una vez realizado el pago, tu servicio se reactivará automáticamente.

¿Necesitas ayuda? Contáctanos para más información.

¡Gracias por confiar en Milo Bookings! 🚀`;

    // Enviar mensaje al dueño
    // Formatear número de teléfono para WhatsApp (remover + y espacios, agregar @c.us)
    let ownerPhone = business.owner_phone.replace(/[\s\+]/g, '');
    if (!ownerPhone.includes('@')) {
      ownerPhone = `${ownerPhone}@c.us`;
    }
    
    await bot.sendMessage(ownerPhone, message);
    
    console.log(`[TrialService] Notificación enviada a ${business.name} (${business.owner_phone})`);
    
    // Marcar como notificado (opcional: agregar campo trial_notified en businesses)
    // Por ahora, solo enviamos el mensaje
  } catch (error) {
    console.error(`[TrialService] Error enviando notificación a ${business.id}:`, error);
  }
}

/**
 * Inicia el servicio de verificación de trials
 * Se ejecuta cada hora
 */
export function startTrialChecker() {
  // Verificar inmediatamente al iniciar
  checkExpiredTrials();
  
  // Luego verificar cada hora
  setInterval(() => {
    checkExpiredTrials();
  }, 60 * 60 * 1000); // 1 hora
  
  console.log('[TrialService] Servicio de verificación de trials iniciado (cada 1 hora)');
}

