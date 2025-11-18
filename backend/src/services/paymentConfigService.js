import { BusinessPaymentConfig } from '../../database/models/BusinessPaymentConfig.js';

export class PaymentConfigService {
  static async getCredentials(businessId) {
    const dbConfig = businessId ? await BusinessPaymentConfig.findByBusiness(businessId) : null;

    const envAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const envPublicKey = process.env.MERCADOPAGO_PUBLIC_KEY;

    if (dbConfig?.is_active && dbConfig.mercadopago_access_token && dbConfig.mercadopago_public_key) {
      return {
        accessToken: dbConfig.mercadopago_access_token,
        publicKey: dbConfig.mercadopago_public_key,
        source: 'business',
      };
    }

    if (envAccessToken && envPublicKey) {
      return {
        accessToken: envAccessToken,
        publicKey: envPublicKey,
        source: 'env',
      };
    }

    return null;
  }

  static async isEnabled(businessId) {
    const credentials = await this.getCredentials(businessId);
    return Boolean(credentials?.accessToken && credentials?.publicKey);
  }

  static async saveCredentials(businessId, payload) {
    return BusinessPaymentConfig.upsert(businessId, {
      mercadopago_access_token: payload.accessToken,
      mercadopago_public_key: payload.publicKey,
      mercadopago_refresh_token: payload.refreshToken,
      mercadopago_user_id: payload.userId,
      is_active: payload.isActive,
    });
  }
}


