import express from 'express';
import { authenticateToken } from '../../utils/auth.js';
import { getQRCode } from '../../services/qrStorage.js';
import { activeBots } from '../../index.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * GET /api/bot/:businessId/qr
 * Obtener QR code del bot de WhatsApp para un negocio
 */
router.get('/:businessId/qr', async (req, res) => {
  try {
    const { businessId } = req.params;
    
    // Verificar que el usuario pertenece a este negocio
    if (req.user.business_id !== businessId && req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Obtener QR code almacenado
    const qrData = getQRCode(businessId);
    
    if (!qrData) {
      // Verificar si el bot está activo y autenticado
      const bot = activeBots.get(businessId);
      if (bot && bot.client?.info) {
        // Bot ya está autenticado, no necesita QR
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
 * GET /api/bot/:businessId/status
 * Obtener estado del bot de WhatsApp para un negocio
 */
router.get('/:businessId/status', async (req, res) => {
  try {
    const { businessId } = req.params;
    
    // Verificar que el usuario pertenece a este negocio
    if (req.user.business_id !== businessId && req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const bot = activeBots.get(businessId);
    const qrData = getQRCode(businessId);
    
    let status = 'not_initialized';
    let info = null;
    
    if (bot) {
      try {
        // Intentar obtener información del cliente
        const clientInfo = bot.client?.info;
        if (clientInfo) {
          status = 'authenticated';
          info = {
            wid: clientInfo.wid?.user,
            pushname: clientInfo.pushname,
            platform: clientInfo.platform,
          };
        } else if (qrData) {
          status = 'waiting_qr';
        } else {
          status = 'initializing';
        }
      } catch (error) {
        status = 'error';
        info = { error: error.message };
      }
    } else if (qrData) {
      status = 'waiting_qr';
    }
    
    res.json({
      data: {
        status,
        info,
        hasQR: !!qrData,
        qrExpiresAt: qrData?.expiresAt,
      },
    });
  } catch (error) {
    console.error('Error getting bot status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/bot/:businessId/reconnect
 * Forzar reconexión del bot (útil si se desconectó)
 */
router.post('/:businessId/reconnect', async (req, res) => {
  try {
    const { businessId } = req.params;
    
    // Solo owners pueden reconectar
    if (req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const bot = activeBots.get(businessId);
    
    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }
    
    // Desconectar y reinicializar
    try {
      await bot.disconnect();
      activeBots.delete(businessId);
      
      // Reinicializar (esto se haría desde index.js, pero por ahora solo respondemos)
      res.json({
        data: {
          message: 'Bot desconectado. Se reinicializará automáticamente.',
          note: 'El bot se reiniciará en el próximo ciclo de inicialización.',
        },
      });
    } catch (error) {
      console.error('Error reconnecting bot:', error);
      res.status(500).json({ error: 'Error al reconectar bot' });
    }
  } catch (error) {
    console.error('Error in reconnect endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

