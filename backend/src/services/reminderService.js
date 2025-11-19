import { Booking } from '../../database/models/Booking.js';
import { BusinessSettings } from '../../database/models/BusinessSettings.js';
import { activeBots } from '../index.js';

/**
 * Envía recordatorios de reservas próximas
 */
export async function sendBookingReminders() {
  try {
    // Verificar que DATABASE_URL esté configurada
    if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
      console.warn('[ReminderService] DATABASE_URL no está configurada, saltando envío de recordatorios');
      return;
    }

    const now = new Date();
    console.log('[ReminderService] Verificando recordatorios...', now.toISOString());

    // Obtener todas las reservas confirmadas que no han sido recordadas
    const bookings = await Booking.findUpcomingConfirmed();

    if (!bookings || bookings.length === 0) {
      console.log('[ReminderService] No hay reservas próximas para recordar');
      return;
    }

    console.log(`[ReminderService] Encontradas ${bookings.length} reserva(s) confirmada(s)`);

    let remindersSent = 0;

    for (const booking of bookings) {
      try {
        // Obtener configuración del negocio
        const settings = await BusinessSettings.findByBusiness(booking.business_id);

        // Verificar si los recordatorios están habilitados
        if (!settings || !settings.reminders_enabled) {
          continue;
        }

        // Verificar si ya se envió el recordatorio
        if (booking.reminder_sent) {
          continue;
        }

        // Calcular cuántas horas faltan para la reserva
        const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
        const hoursUntilBooking = (bookingDateTime - now) / (1000 * 60 * 60);

        // Obtener horas configuradas (por defecto 24)
        const reminderHoursBefore = settings.reminder_hours_before || 24;

        // Verificar si es el momento de enviar el recordatorio
        // Enviar si faltan entre reminderHoursBefore y reminderHoursBefore - 1 horas
        // Esto evita enviar múltiples recordatorios
        if (hoursUntilBooking <= reminderHoursBefore && hoursUntilBooking > (reminderHoursBefore - 1)) {
          await sendReminder(booking, settings);
          remindersSent++;
        }
      } catch (error) {
        console.error(`[ReminderService] Error procesando reserva ${booking.id}:`, error);
      }
    }

    if (remindersSent > 0) {
      console.log(`[ReminderService] ✅ ${remindersSent} recordatorio(s) enviado(s)`);
    } else {
      console.log('[ReminderService] No hay recordatorios pendientes en este momento');
    }
  } catch (error) {
    console.error('[ReminderService] Error enviando recordatorios:', error);
  }
}

/**
 * Envía un recordatorio de reserva al cliente
 */
async function sendReminder(booking, settings) {
  try {
    const bot = activeBots.get(booking.business_id);

    if (!bot) {
      console.warn(`[ReminderService] Bot no disponible para negocio ${booking.business_id}`);
      return;
    }

    // Formatear mensaje de recordatorio
    const reminderMessage = settings.reminder_message || 
      `⏰ *Recordatorio de Reserva*

Hola ${booking.customer_name || 'cliente'}!

Te recordamos que tienes una reserva:
📅 *Fecha:* ${new Date(booking.booking_date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
🕐 *Hora:* ${booking.booking_time}
📋 *Servicio:* ${booking.service_name}

¡Te esperamos!`;

    // Formatear número de teléfono para WhatsApp
    let customerPhone = booking.customer_phone.replace(/[\s\+]/g, '');
    if (!customerPhone.includes('@')) {
      customerPhone = `${customerPhone}@c.us`;
    }

    // Enviar mensaje
    await bot.sendMessage(customerPhone, reminderMessage);

    // Marcar como recordatorio enviado
    await Booking.update(booking.id, { reminder_sent: true });

    console.log(`[ReminderService] Recordatorio enviado a ${booking.customer_phone} para reserva ${booking.id}`);
  } catch (error) {
    console.error(`[ReminderService] Error enviando recordatorio para reserva ${booking.id}:`, error);
  }
}

/**
 * Inicia el servicio de recordatorios
 * Se ejecuta cada hora
 */
export function startReminderService() {
  // Verificar inmediatamente al iniciar
  sendBookingReminders();

  // Luego verificar cada hora
  setInterval(() => {
    sendBookingReminders();
  }, 60 * 60 * 1000); // 1 hora

  console.log('[ReminderService] Servicio de recordatorios iniciado (cada 1 hora)');
}

