import express from 'express';
import { BusinessSettings } from '../../../database/models/BusinessSettings.js';
import { authenticateToken } from '../../utils/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener configuración del negocio
router.get('/', async (req, res) => {
  try {
    const settings = await BusinessSettings.findByBusiness(req.user.business_id);
    
    if (!settings) {
      // Crear configuración por defecto si no existe
      const defaultSettings = await BusinessSettings.createOrUpdate(req.user.business_id, {
        welcome_message: `¡Hola! Bienvenido. ¿En qué puedo ayudarte?`,
        booking_confirmation_message: 'Tu reserva ha sido confirmada.',
        payment_instructions_message: 'Por favor completa el pago para confirmar tu reserva.',
        reminder_message: 'Recordatorio: Tienes una reserva mañana.',
      });
      return res.json({ data: defaultSettings });
    }

    res.json({ data: settings });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Actualizar configuración del negocio
router.put('/', async (req, res) => {
  try {
    const {
      welcome_message,
      booking_confirmation_message,
      payment_instructions_message,
      reminder_message,
      insurance_enabled,
      reminders_enabled,
      reminder_hours_before,
    } = req.body;

    const settings = await BusinessSettings.createOrUpdate(req.user.business_id, {
      welcome_message,
      booking_confirmation_message,
      payment_instructions_message,
      reminder_message,
      insurance_enabled,
      reminders_enabled,
      reminder_hours_before,
    });

    // Notificar al bot que debe recargar la configuración
    // Esto se puede hacer mediante un evento o simplemente recargando en el próximo mensaje
    res.json({ 
      data: settings,
      message: 'Configuración actualizada. El bot usará estos cambios en los próximos mensajes.'
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

