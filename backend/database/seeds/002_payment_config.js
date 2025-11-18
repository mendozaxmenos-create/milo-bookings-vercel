/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  const businessId = 'demo-business-001';

  const accessToken =
    process.env.SEED_MERCADOPAGO_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN;
  const publicKey =
    process.env.SEED_MERCADOPAGO_PUBLIC_KEY || process.env.MERCADOPAGO_PUBLIC_KEY;
  const refreshToken =
    process.env.SEED_MERCADOPAGO_REFRESH_TOKEN || process.env.MERCADOPAGO_REFRESH_TOKEN || null;
  const userId =
    process.env.SEED_MERCADOPAGO_USER_ID || process.env.MERCADOPAGO_USER_ID || null;

  if (!accessToken || !publicKey) {
    console.warn(
      '[seed:payment_config] Skipping because access/public key were not provided. ' +
        'Set SEED_MERCADOPAGO_ACCESS_TOKEN and SEED_MERCADOPAGO_PUBLIC_KEY to seed demo data.'
    );
    return;
  }

  await knex('business_payment_config').where({ business_id: businessId }).del();

  await knex('business_payment_config').insert({
    business_id: businessId,
    mercadopago_access_token: accessToken,
    mercadopago_public_key: publicKey,
    mercadopago_refresh_token: refreshToken,
    mercadopago_user_id: userId,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  console.log('[seed:payment_config] MercadoPago credentials stored for', businessId);
}


