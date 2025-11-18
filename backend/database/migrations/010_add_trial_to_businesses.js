/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.table('businesses', (table) => {
    table.boolean('is_trial').defaultTo(false);
    table.timestamp('trial_start_date').nullable();
    table.timestamp('trial_end_date').nullable();
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.table('businesses', (table) => {
    table.dropColumn('is_trial');
    table.dropColumn('trial_start_date');
    table.dropColumn('trial_end_date');
  });
}

