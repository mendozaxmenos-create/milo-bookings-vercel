/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('system_config', (table) => {
    table.string('key').primary();
    table.text('value').notNullable();
    table.string('description').nullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
  
  // Insertar configuración inicial
  await knex('system_config').insert({
    key: 'subscription_price',
    value: '5000.00',
    description: 'Precio mensual de la suscripción en pesos argentinos',
    updated_at: new Date().toISOString(),
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable('system_config');
}

