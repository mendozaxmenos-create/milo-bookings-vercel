import db from '../index.js';

export class BusinessPaymentConfig {
  static table = 'business_payment_config';

  static async findByBusiness(businessId) {
    return db(this.table).where({ business_id: businessId }).first();
  }

  static async upsert(businessId, data) {
    const payload = {
      mercadopago_access_token: data.mercadopago_access_token,
      mercadopago_public_key: data.mercadopago_public_key,
      mercadopago_refresh_token: data.mercadopago_refresh_token || null,
      mercadopago_user_id: data.mercadopago_user_id || null,
      is_active: data.is_active ?? true,
      updated_at: new Date().toISOString(),
    };

    const existing = await this.findByBusiness(businessId);

    if (existing) {
      await db(this.table).where({ business_id: businessId }).update(payload);
      return this.findByBusiness(businessId);
    }

    payload.business_id = businessId;
    payload.created_at = new Date().toISOString();
    await db(this.table).insert(payload);
    return this.findByBusiness(businessId);
  }

  static async delete(businessId) {
    return db(this.table).where({ business_id: businessId }).delete();
  }
}


