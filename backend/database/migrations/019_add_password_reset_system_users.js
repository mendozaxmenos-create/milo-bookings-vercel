/**
 * Migration: Agregar campos para recuperación de contraseña en system_users
 * 
 * Agrega campos para almacenar tokens de recuperación de contraseña
 * y su fecha de expiración para usuarios del sistema (super admin).
 */

export async function up(knex) {
  await knex.schema.alterTable('system_users', (table) => {
    table.string('password_reset_token').nullable();
    table.timestamp('password_reset_expires').nullable();
  });
}

export async function down(knex) {
  await knex.schema.alterTable('system_users', (table) => {
    table.dropColumn('password_reset_expires');
    table.dropColumn('password_reset_token');
  });
}

