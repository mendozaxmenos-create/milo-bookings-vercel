/**
 * Migration: Agregar soporte para recursos múltiples de servicio
 * 
 * Permite que un servicio tenga múltiples unidades (ej: 4 canchas de padel)
 * Cada reserva se asigna automáticamente a una unidad disponible
 */

export async function up(knex) {
  // Crear tabla de recursos de servicio
  await knex.schema.createTable('service_resources', (table) => {
    table.string('id').primary();
    table.string('service_id').notNullable().references('id').inTable('services').onDelete('CASCADE');
    table.string('name').notNullable(); // Nombre de la unidad (ej: "Cancha 1", "Sala A")
    table.integer('display_order').defaultTo(0); // Orden de visualización
    table.boolean('is_active').defaultTo(true); // Si está activa o no
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    // Un nombre único por servicio
    table.unique(['service_id', 'name']);
  });

  // Agregar campo para habilitar recursos múltiples en servicios
  await knex.schema.alterTable('services', (table) => {
    table.boolean('has_multiple_resources').defaultTo(false); // Si tiene múltiples unidades
    table.integer('resource_count').nullable(); // Cantidad total de unidades (para compatibilidad)
  });

  // Agregar resource_id a bookings
  await knex.schema.alterTable('bookings', (table) => {
    table.string('resource_id').nullable().references('id').inTable('service_resources').onDelete('SET NULL');
    table.string('resource_name').nullable(); // Nombre de la unidad asignada (para historial)
  });

  // Crear índices para mejorar performance
  await knex.schema.table('service_resources', (table) => {
    table.index(['service_id', 'is_active']);
  });

  await knex.schema.table('bookings', (table) => {
    table.index(['service_id', 'booking_date', 'booking_time', 'resource_id']);
  });
}

export async function down(knex) {
  // Remover índices
  await knex.schema.table('bookings', (table) => {
    table.dropIndex(['service_id', 'booking_date', 'booking_time', 'resource_id']);
  });

  await knex.schema.table('service_resources', (table) => {
    table.dropIndex(['service_id', 'is_active']);
  });

  // Remover columnas de bookings
  await knex.schema.alterTable('bookings', (table) => {
    table.dropColumn('resource_name');
    table.dropColumn('resource_id');
  });

  // Remover columnas de services
  await knex.schema.alterTable('services', (table) => {
    table.dropColumn('resource_count');
    table.dropColumn('has_multiple_resources');
  });

  // Eliminar tabla de recursos
  await knex.schema.dropTable('service_resources');
}

