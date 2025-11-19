import db from '../index.js';

export class BusinessSettings {
  static async createOrUpdate(businessId, data) {
    const existing = await this.findByBusiness(businessId);
    
    const settings = {
      business_id: businessId,
      welcome_message: data.welcome_message,
      booking_confirmation_message: data.booking_confirmation_message,
      payment_instructions_message: data.payment_instructions_message,
      reminder_message: data.reminder_message,
      insurance_enabled: data.insurance_enabled !== undefined ? data.insurance_enabled : false,
      reminders_enabled: data.reminders_enabled !== undefined ? data.reminders_enabled : false,
      reminder_hours_before: data.reminder_hours_before !== undefined ? data.reminder_hours_before : 24,
      owner_notifications_enabled: data.owner_notifications_enabled !== undefined ? data.owner_notifications_enabled : true,
      owner_notification_message: data.owner_notification_message || null,
      notification_phones: data.notification_phones ? (typeof data.notification_phones === 'string' ? data.notification_phones : JSON.stringify(data.notification_phones)) : null,
      default_notification_phone: data.default_notification_phone || null,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      await db('business_settings')
        .where({ business_id: businessId })
        .update(settings);
    } else {
      settings.created_at = new Date().toISOString();
      await db('business_settings').insert(settings);
    }

    return this.findByBusiness(businessId);
  }

  static async findByBusiness(businessId) {
    return db('business_settings')
      .where({ business_id: businessId })
      .first();
  }

  static async getWelcomeMessage(businessId) {
    const settings = await this.findByBusiness(businessId);
    return settings?.welcome_message || '¡Hola! Bienvenido. ¿En qué puedo ayudarte?';
  }

  static async getBookingConfirmationMessage(businessId) {
    const settings = await this.findByBusiness(businessId);
    return settings?.booking_confirmation_message || 'Tu reserva ha sido confirmada.';
  }
}

