/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable('bookings', (table) => {
    table.string('payment_preference_id');
    table.string('payment_init_point');
    table.string('payment_sandbox_init_point');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable('bookings', (table) => {
    table.dropColumn('payment_preference_id');
    table.dropColumn('payment_init_point');
    table.dropColumn('payment_sandbox_init_point');
  });
}


