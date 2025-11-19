import db from '../index.js';
import { v4 as uuidv4 } from 'uuid';

export class Booking {
  static async create(data) {
    const id = data.id || uuidv4();
    const booking = {
      id,
      business_id: data.business_id,
      service_id: data.service_id,
      customer_phone: data.customer_phone,
      customer_name: data.customer_name,
      booking_date: data.booking_date,
      booking_time: data.booking_time,
      status: data.status || 'pending',
      payment_status: data.payment_status || 'pending',
      payment_id: data.payment_id,
      payment_preference_id: data.payment_preference_id || null,
      payment_init_point: data.payment_init_point || null,
      payment_sandbox_init_point: data.payment_sandbox_init_point || null,
      amount: data.amount,
      notes: data.notes,
      insurance_provider_id: data.insurance_provider_id || null,
      copay_amount: data.copay_amount || null,
      insurance_provider_name: data.insurance_provider_name || null,
      resource_id: data.resource_id || null,
      resource_name: data.resource_name || null,
      reminder_sent: data.reminder_sent || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db('bookings').insert(booking);
    return this.findById(id);
  }

  static async findById(id) {
    return db('bookings')
      .join('services', 'bookings.service_id', 'services.id')
      .select(
        'bookings.*',
        'services.name as service_name',
        'services.duration_minutes as service_duration'
      )
      .where({ 'bookings.id': id })
      .first();
  }

  static async findByBusiness(businessId, filters = {}) {
    console.log('[Booking.findByBusiness] Querying bookings:', {
      businessId,
      filters,
    });
    
    // Construir query base para contar total (con mismos filtros)
    const countQuery = db('bookings')
      .where({ 'bookings.business_id': businessId });

    const dataQuery = db('bookings')
      .join('services', 'bookings.service_id', 'services.id')
      .select(
        'bookings.*',
        'services.name as service_name',
        'services.duration_minutes as service_duration'
      )
      .where({ 'bookings.business_id': businessId });

    // Aplicar filtros a ambas queries
    if (filters.status) {
      countQuery.where({ 'bookings.status': filters.status });
      dataQuery.where({ 'bookings.status': filters.status });
    }

    if (filters.date) {
      countQuery.where({ 'bookings.booking_date': filters.date });
      dataQuery.where({ 'bookings.booking_date': filters.date });
    }

    if (filters.customer_phone) {
      countQuery.where({ 'bookings.customer_phone': filters.customer_phone });
      dataQuery.where({ 'bookings.customer_phone': filters.customer_phone });
    }

    // Búsqueda por nombre o teléfono
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      countQuery.where(function() {
        this.where('bookings.customer_name', 'like', searchTerm)
          .orWhere('bookings.customer_phone', 'like', searchTerm);
      });
      dataQuery.where(function() {
        this.where('bookings.customer_name', 'like', searchTerm)
          .orWhere('bookings.customer_phone', 'like', searchTerm);
      });
    }

    // Contar total con filtros aplicados
    const totalCountResult = await countQuery.count('* as count').first();
    const totalCount = parseInt(totalCountResult?.count || 0);

    // Configurar paginación
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const offset = (page - 1) * limit;

    const bookings = await dataQuery
      .orderBy('bookings.booking_date', 'desc')
      .orderBy('bookings.booking_time', 'desc')
      .limit(limit)
      .offset(offset);
    
    const totalPages = Math.ceil(totalCount / limit);

    console.log('[Booking.findByBusiness] Query result:', {
      businessId,
      page,
      limit,
      totalCount,
      totalPages,
      returnedCount: bookings?.length || 0,
      statuses: bookings?.map(b => b.status) || [],
      sampleIds: bookings?.slice(0, 3).map(b => b.id) || [],
    });
    
    // Si no hay resultados pero debería haber, verificar el join
    if ((!bookings || bookings.length === 0) && totalCount > 0) {
      console.warn('[Booking.findByBusiness] WARNING: No bookings returned but totalCount > 0. Checking join issue...');
      
      // Verificar si hay reservas sin servicio asociado
      const bookingsWithoutService = await db('bookings')
        .where({ business_id: businessId })
        .whereNotIn('service_id', db('services').select('id').where({ business_id: businessId }));
      
      if (bookingsWithoutService.length > 0) {
        console.error('[Booking.findByBusiness] ERROR: Found bookings without valid service:', {
          count: bookingsWithoutService.length,
          bookingIds: bookingsWithoutService.map(b => b.id),
        });
      }
    }
    
    return bookings;
  }

  static async findByCustomer(customerPhone) {
    return db('bookings')
      .join('services', 'bookings.service_id', 'services.id')
      .select(
        'bookings.*',
        'services.name as service_name',
        'services.duration_minutes as service_duration'
      )
      .where({ 'bookings.customer_phone': customerPhone })
      .orderBy('bookings.booking_date', 'desc')
      .orderBy('bookings.booking_time', 'desc');
  }

  static async update(id, data) {
    await db('bookings')
      .where({ id })
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      });
    return this.findById(id);
  }

  static async findByPaymentPreference(preferenceId) {
    return db('bookings')
      .where({ payment_preference_id: preferenceId })
      .first();
  }

  static async delete(id) {
    return db('bookings').where({ id }).delete();
  }

  static async findByDateRange(businessId, startDate, endDate) {
    return db('bookings')
      .join('services', 'bookings.service_id', 'services.id')
      .select(
        'bookings.*',
        'services.name as service_name',
        'services.duration_minutes as service_duration'
      )
      .where({ 'bookings.business_id': businessId })
      .whereBetween('bookings.booking_date', [startDate, endDate])
      .orderBy('bookings.booking_date', 'asc')
      .orderBy('bookings.booking_time', 'asc');
  }

  /**
   * Encuentra reservas confirmadas próximas (para recordatorios)
   */
  static async findUpcomingConfirmed() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStr = today.toISOString().split('T')[0];
    
    return db('bookings')
      .join('services', 'bookings.service_id', 'services.id')
      .select(
        'bookings.*',
        'services.name as service_name',
        'services.duration_minutes as service_duration'
      )
      .where({ 'bookings.status': 'confirmed' })
      .where('bookings.booking_date', '>=', todayStr)
      .where('bookings.reminder_sent', false)
      .orderBy('bookings.booking_date', 'asc')
      .orderBy('bookings.booking_time', 'asc');
  }
}

