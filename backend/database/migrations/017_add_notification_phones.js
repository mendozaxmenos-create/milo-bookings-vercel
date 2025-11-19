/**
 * Migration: Agregar múltiples números de teléfono para notificaciones
 * 
 * Permite al dueño configurar múltiples números de teléfono para recibir
 * notificaciones de nuevas reservas.
 */

export async function up(knex) {
  await knex.schema.alterTable('business_settings', (table) => {
    // Almacenar array de números en formato JSON: [{"phone": "+5491123456789", "label": "Dueño"}, ...]
    table.text('notification_phones').nullable(); // JSON array de números con etiquetas
    table.string('default_notification_phone').nullable(); // Número por defecto (puede ser null para enviar a todos)
  });
}

export async function down(knex) {
  await knex.schema.alterTable('business_settings', (table) => {
    table.dropColumn('default_notification_phone');
    table.dropColumn('notification_phones');
  });
}

