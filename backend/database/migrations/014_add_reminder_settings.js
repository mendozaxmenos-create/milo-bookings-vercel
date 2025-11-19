/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable('business_settings', (table) => {
    table.boolean('reminders_enabled').defaultTo(false);
    table.integer('reminder_hours_before').defaultTo(24); // Por defecto 24 horas antes
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable('business_settings', (table) => {
    table.dropColumn('reminder_hours_before');
    table.dropColumn('reminders_enabled');
  });
}

