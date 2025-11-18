import express from 'express';
import { Business } from '../../../database/models/Business.js';
import { BusinessUser } from '../../../database/models/BusinessUser.js';
import { SystemConfig } from '../../../database/models/SystemConfig.js';
import { authenticateToken, requireSuperAdmin } from '../../utils/auth.js';
import { validateBusiness } from '../../utils/validators.js';
import { activeBots } from '../../index.js';
import { getQRCode } from '../../services/qrStorage.js';
import { BookingBot } from '../../bot/index.js';

const router = express.Router();

// Todas las rutas requieren autenticación y ser super admin
router.use(authenticateToken);
router.use(requireSuperAdmin);

/**
 * GET /api/admin/businesses
 * Listar todos los negocios
 */
router.get('/businesses', async (req, res) => {
  try {
    const businesses = await Business.list(1000, 0, true); // Incluir inactivos para super admin
    
    // Agregar información de estado del bot para cada negocio
    const businessesWithStatus = await Promise.all(
      businesses.map(async (business) => {
        const bot = activeBots.get(business.id);
        const qrData = getQRCode(business.id);
        
        let botStatus = 'not_initialized';
        if (bot) {
          try {
            const clientInfo = bot.client?.info;
            if (clientInfo) {
              botStatus = 'authenticated';
            } else if (qrData) {
              botStatus = 'waiting_qr';
            } else {
              botStatus = 'initializing';
            }
          } catch {
            botStatus = 'error';
          }
        } else if (qrData) {
          botStatus = 'waiting_qr';
        }
        
        return {
          ...business,
          bot_status: botStatus,
          has_qr: !!qrData,
        };
      })
    );
    
    res.json({ data: businessesWithStatus });
  } catch (error) {
    console.error('Error listing businesses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/admin/businesses
 * Crear un nuevo negocio
 */
router.post('/businesses', async (req, res) => {
  try {
    const { error, value } = validateBusiness(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const business = await Business.create(value);
    
    // Crear usuario owner por defecto
    if (value.owner_phone) {
      try {
        await BusinessUser.create({
          business_id: business.id,
          phone: value.owner_phone,
          password: 'changeme123', // Contraseña temporal, debería cambiarse
          role: 'owner',
        });
      } catch (err) {
        console.warn('Error creating default owner user:', err);
      }
    }
    
    // Inicializar bot si tiene whatsapp_number
    if (business.whatsapp_number) {
      try {
        const bot = new BookingBot(business.id, business.whatsapp_number);
        await bot.initialize();
        activeBots.set(business.id, bot);
        console.log(`✅ Bot inicializado para nuevo negocio: ${business.name} (${business.id})`);
      } catch (err) {
        console.error(`Error inicializando bot para ${business.name}:`, err);
      }
    }
    
    res.status(201).json({ data: business });
  } catch (error) {
    console.error('Error creating business:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/businesses/:id
 * Obtener un negocio específico
 */
router.get('/businesses/:id', async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    
    // Agregar información del bot
    const bot = activeBots.get(business.id);
    const qrData = getQRCode(business.id);
    
    let botStatus = 'not_initialized';
    let botInfo = null;
    
    if (bot) {
      try {
        const clientInfo = bot.client?.info;
        if (clientInfo) {
          botStatus = 'authenticated';
          botInfo = {
            wid: clientInfo.wid?.user,
            pushname: clientInfo.pushname,
            platform: clientInfo.platform,
          };
        } else if (qrData) {
          botStatus = 'waiting_qr';
        } else {
          botStatus = 'initializing';
        }
      } catch {
        botStatus = 'error';
      }
    } else if (qrData) {
      botStatus = 'waiting_qr';
    }
    
    res.json({
      data: {
        ...business,
        bot_status: botStatus,
        bot_info: botInfo,
        has_qr: !!qrData,
        qr: qrData?.qr || null,
      },
    });
  } catch (error) {
    console.error('Error getting business:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/admin/businesses/:id
 * Actualizar un negocio
 */
router.put('/businesses/:id', async (req, res) => {
  try {
    const { error, value } = validateBusiness(req.body, true);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const business = await Business.update(req.params.id, value);
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    
    // Si cambió el whatsapp_number, reinicializar bot
    if (value.whatsapp_number) {
      const existingBot = activeBots.get(business.id);
      if (existingBot) {
        await existingBot.disconnect();
        activeBots.delete(business.id);
      }
      
      try {
        const bot = new BookingBot(business.id, value.whatsapp_number);
        await bot.initialize();
        activeBots.set(business.id, bot);
      } catch (err) {
        console.error(`Error reinicializando bot para ${business.name}:`, err);
      }
    }
    
    res.json({ data: business });
  } catch (error) {
    console.error('Error updating business:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/admin/businesses/:id
 * Desactivar un negocio (soft delete)
 */
router.delete('/businesses/:id', async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    
    // Desactivar negocio
    await Business.update(req.params.id, { is_active: false });
    
    // Desconectar bot
    const bot = activeBots.get(req.params.id);
    if (bot) {
      await bot.disconnect();
      activeBots.delete(req.params.id);
    }
    
    res.json({ message: 'Business deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating business:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/admin/businesses/:id/activate
 * Reactivar un negocio
 */
router.post('/businesses/:id/activate', async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    
    await Business.update(req.params.id, { is_active: true });
    
    // Reinicializar bot si tiene whatsapp_number
    if (business.whatsapp_number && !activeBots.has(req.params.id)) {
      try {
        const bot = new BookingBot(business.id, business.whatsapp_number);
        await bot.initialize();
        activeBots.set(business.id, bot);
      } catch (err) {
        console.error(`Error reinicializando bot para ${business.name}:`, err);
      }
    }
    
    res.json({ message: 'Business activated successfully' });
  } catch (error) {
    console.error('Error activating business:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/businesses/:id/qr
 * Obtener QR code del bot de un negocio
 */
router.get('/businesses/:id/qr', async (req, res) => {
  try {
    const qrData = getQRCode(req.params.id);
    const bot = activeBots.get(req.params.id);
    
    if (!qrData) {
      if (bot && bot.client?.info) {
        return res.json({
          data: {
            qr: null,
            status: 'authenticated',
            message: 'Bot ya está conectado a WhatsApp',
          },
        });
      }
      
      return res.status(404).json({
        error: 'QR code no disponible',
        message: 'El QR code no está disponible. El bot puede estar ya autenticado o no estar inicializado.',
      });
    }
    
    res.json({
      data: {
        qr: qrData.qr,
        timestamp: qrData.timestamp,
        expiresAt: qrData.expiresAt,
        status: 'pending',
      },
    });
  } catch (error) {
    console.error('Error getting QR code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/admin/businesses/:id/reconnect-bot
 * Forzar reconexión del bot de un negocio
 */
router.post('/businesses/:id/reconnect-bot', async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    
    if (!business.whatsapp_number) {
      return res.status(400).json({ error: 'Business does not have a WhatsApp number configured' });
    }
    
    // Desconectar bot existente
    const existingBot = activeBots.get(req.params.id);
    if (existingBot) {
      await existingBot.disconnect();
      activeBots.delete(req.params.id);
    }
    
    // Reinicializar bot
    try {
      const bot = new BookingBot(business.id, business.whatsapp_number);
      await bot.initialize();
      activeBots.set(business.id, bot);
      
      res.json({
        message: 'Bot reconectado exitosamente',
        note: 'Si el bot necesita autenticación, se generará un nuevo QR code.',
      });
    } catch (err) {
      console.error('Error reconectando bot:', err);
      res.status(500).json({ error: 'Error al reconectar bot', details: err.message });
    }
  } catch (error) {
    console.error('Error in reconnect-bot endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/config/subscription-price
 * Obtener precio de suscripción
 */
router.get('/config/subscription-price', async (req, res) => {
  try {
    const price = await SystemConfig.get('subscription_price');
    res.json({ data: { price: price || '5000.00' } });
  } catch (error) {
    console.error('Error getting subscription price:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/admin/config/subscription-price
 * Actualizar precio de suscripción
 */
router.put('/config/subscription-price', async (req, res) => {
  try {
    const { price } = req.body;
    
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      return res.status(400).json({ error: 'Precio inválido' });
    }
    
    await SystemConfig.set('subscription_price', price.toString(), 'Precio mensual de la suscripción en pesos argentinos');
    
    res.json({ data: { price } });
  } catch (error) {
    console.error('Error updating subscription price:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

