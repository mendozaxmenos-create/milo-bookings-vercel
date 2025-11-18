/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('business_payment_config', (table) => {
    table.string('business_id').primary().references('id').inTable('businesses').onDelete('CASCADE');
    table.string('mercadopago_access_token').notNullable();
    table.string('mercadopago_public_key').notNullable();
    table.string('mercadopago_refresh_token');
    table.string('mercadopago_user_id');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable('business_payment_config');
}


