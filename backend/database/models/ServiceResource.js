import db from '../index.js';
import { v4 as uuidv4 } from 'uuid';

export class ServiceResource {
  /**
   * Crear un recurso de servicio
   */
  static async create(data) {
    const id = data.id || uuidv4();
    const resource = {
      id,
      service_id: data.service_id,
      name: data.name,
      display_order: data.display_order ?? 0,
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db('service_resources').insert(resource);
    return this.findById(id);
  }

  /**
   * Buscar recurso por ID
   */
  static async findById(id) {
    return db('service_resources').where({ id }).first();
  }

  /**
   * Buscar recursos por servicio
   */
  static async findByService(serviceId, includeInactive = false) {
    const query = db('service_resources').where({ service_id: serviceId });
    if (!includeInactive) {
      query.where({ is_active: true });
    }
    return query.orderBy('display_order', 'asc').orderBy('name', 'asc');
  }

  /**
   * Buscar recursos disponibles para una fecha y hora específica
   */
  static async findAvailableResources(serviceId, bookingDate, bookingTime) {
    // Obtener todos los recursos activos del servicio
    const allResources = await this.findByService(serviceId, false);

    if (allResources.length === 0) {
      return [];
    }

    // Buscar recursos que ya están ocupados en esa fecha y hora
    const bookedResources = await db('bookings')
      .where({ 
        service_id: serviceId,
        booking_date: bookingDate,
        booking_time: bookingTime,
        status: db.raw("NOT IN ('cancelled', 'completed')"), // Solo reservas activas
      })
      .whereNotNull('resource_id')
      .select('resource_id');

    const bookedResourceIds = bookedResources.map(br => br.resource_id).filter(Boolean);

    // Filtrar recursos disponibles (no están en la lista de ocupados)
    const availableResources = allResources.filter(
      resource => !bookedResourceIds.includes(resource.id)
    );

    return availableResources;
  }

  /**
   * Asignar automáticamente un recurso disponible
   */
  static async assignAvailableResource(serviceId, bookingDate, bookingTime) {
    const available = await this.findAvailableResources(serviceId, bookingDate, bookingTime);
    
    if (available.length === 0) {
      return null; // No hay recursos disponibles
    }

    // Tomar el primero disponible (ordenado por display_order y name)
    return available[0];
  }

  /**
   * Actualizar recurso
   */
  static async update(id, data) {
    await db('service_resources')
      .where({ id })
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      });
    return this.findById(id);
  }

  /**
   * Eliminar recurso
   */
  static async delete(id) {
    return db('service_resources').where({ id }).delete();
  }

  /**
   * Activar/desactivar recurso
   */
  static async toggleActive(id) {
    const resource = await this.findById(id);
    if (!resource) return null;

    await db('service_resources')
      .where({ id })
      .update({
        is_active: !resource.is_active,
        updated_at: new Date().toISOString(),
      });
    return this.findById(id);
  }

  /**
   * Contar recursos activos por servicio
   */
  static async countByService(serviceId) {
    const result = await db('service_resources')
      .where({ service_id: serviceId, is_active: true })
      .count('* as count')
      .first();
    return parseInt(result?.count || 0);
  }
}

