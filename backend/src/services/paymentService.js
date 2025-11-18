import { MercadoPagoConfig, Preference } from 'mercadopago';
import { PaymentConfigService } from './paymentConfigService.js';

export class PaymentService {
  static async getClient(businessId) {
    const credentials = await PaymentConfigService.getCredentials(businessId);

    if (!credentials) {
      throw new Error('MercadoPago credentials are not configured');
    }

    const client = new MercadoPagoConfig({
      accessToken: credentials.accessToken,
    });

    return {
      client,
      publicKey: credentials.publicKey,
      source: credentials.source,
    };
  }

  static async createPreference({ business, booking, service, successUrl, failureUrl, pendingUrl }) {
    const { client } = await this.getClient(business.id);
    const preferenceClient = new Preference(client);

    const baseWebhookUrl =
      process.env.MERCADOPAGO_WEBHOOK_URL ||
      `${process.env.API_BASE_URL || 'http://localhost:3000'}/api/payments/mercadopago/webhook`;

    const webhookUrl = new URL(baseWebhookUrl);
    webhookUrl.searchParams.set('businessId', business.id);

    const panelBaseUrl = process.env.ADMIN_PANEL_URL || 'http://localhost:3001';
    const successBackUrl = successUrl || process.env.MP_SUCCESS_URL || `${panelBaseUrl}/payments/success`;
    const failureBackUrl = failureUrl || process.env.MP_FAILURE_URL || `${panelBaseUrl}/payments/failure`;
    const pendingBackUrl = pendingUrl || process.env.MP_PENDING_URL || `${panelBaseUrl}/payments/pending`;

    const preferenceData = {
      items: [
        {
          id: booking.id,
          title: `${service.name} - ${business.name}`,
          description: `Reserva para ${booking.customer_name || booking.customer_phone}`,
          quantity: 1,
          currency_id: 'ARS',
          unit_price: Number(booking.amount),
        },
      ],
      payer: {
        name: booking.customer_name || '',
        phone: {
          number: booking.customer_phone,
        },
      },
      metadata: {
        booking_id: booking.id,
        business_id: business.id,
      },
      notification_url: webhookUrl.toString(),
      back_urls: {
        success: successBackUrl,
        failure: failureBackUrl,
        pending: pendingBackUrl,
      },
    };

    const response = await preferenceClient.create({ body: preferenceData });
    return response;
  }

  static async getPaymentInfo(businessId, paymentId) {
    const { client } = await this.getClient(businessId);
    const { Payment } = await import('mercadopago');
    const payment = new Payment(client);
    const response = await payment.get({ id: paymentId });
    return response;
  }
}



