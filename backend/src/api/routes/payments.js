import express from 'express';
import { authenticateToken } from '../../utils/auth.js';
import { PaymentConfigService } from '../../services/paymentConfigService.js';
import { validatePaymentConfig } from '../../utils/validators.js';
import { PaymentService } from '../../services/paymentService.js';
import { Booking } from '../../../database/models/Booking.js';

const router = express.Router();

// Webhook (no auth)
router.post('/mercadopago/webhook', async (req, res) => {
  try {
    const businessId = req.query.businessId;
    const paymentId = req.query.id || req.body?.data?.id || req.body?.id;

    if (!businessId || !paymentId) {
      return res.status(400).json({ error: 'Missing businessId or paymentId' });
    }

    const paymentInfo = await PaymentService.getPaymentInfo(businessId, paymentId);
    // En v2, la respuesta puede estar en paymentInfo directamente o en paymentInfo.data
    const payment = paymentInfo.data || paymentInfo;
    const bookingId = payment.metadata?.booking_id;

    if (!bookingId) {
      return res.json({ message: 'Payment received without booking metadata' });
    }

    const status = payment.status;
    const updatePayload = {
      payment_id: paymentId,
      payment_status: status,
    };

    if (status === 'approved') {
      updatePayload.status = 'confirmed';
    } else if (status === 'in_process' || status === 'pending') {
      updatePayload.status = 'pending_payment';
    } else if (status === 'rejected' || status === 'cancelled') {
      updatePayload.status = 'pending_payment';
    }

    await Booking.update(bookingId, updatePayload);
    return res.json({ success: true });
  } catch (error) {
    console.error('MercadoPago webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing error' });
  }
});

// Protected routes
router.use(authenticateToken);

router.get('/config', async (req, res) => {
  try {
    const credentials = await PaymentConfigService.getCredentials(req.user.business_id);
    if (!credentials) {
      return res.json({ data: null });
    }
    res.json({
      data: {
        publicKey: credentials.publicKey,
        source: credentials.source,
      },
    });
  } catch (error) {
    console.error('Error getting payment config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/config', async (req, res) => {
  try {
    const { error, value } = validatePaymentConfig(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    await PaymentConfigService.saveCredentials(req.user.business_id, value);

    res.json({
      message: 'MercadoPago configuration updated',
      data: {
        publicKey: value.publicKey,
      },
    });
  } catch (err) {
    console.error('Error saving payment config:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


