import db from '../../database/index.js';
import { Booking } from '../../database/models/Booking.js';
import { BusinessHours } from '../../database/models/BusinessHours.js';
import { Service } from '../../database/models/Service.js';
import { ServiceResource } from '../../database/models/ServiceResource.js';

/**
 * Servicio para gestionar disponibilidad de horarios
 */
export class AvailabilityService {
  /**
   * Obtiene los horarios de trabajo configurados para un día específico
   * @param {string} businessId - ID del negocio
   * @param {string} date - Fecha en formato YYYY-MM-DD
   * @returns {Promise<{open_time: string, close_time: string, is_open: boolean}>}
   */
  static async getBusinessHoursForDate(businessId, date) {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    
    const businessHours = await BusinessHours.findByBusinessAndDay(businessId, dayOfWeek);
    
    if (businessHours && businessHours.is_open) {
      return {
        open_time: businessHours.open_time,
        close_time: businessHours.close_time,
        is_open: true,
      };
    }
    
    // Horarios por defecto si no están configurados
    return {
      open_time: '09:00:00',
      close_time: '18:00:00',
      is_open: businessHours ? businessHours.is_open : true,
    };
  }

  /**
   * Obtiene horarios disponibles para una fecha específica
   * @param {string} businessId - ID del negocio
   * @param {string} date - Fecha en formato YYYY-MM-DD
   * @param {number} serviceDuration - Duración del servicio en minutos
   * @param {string} serviceId - ID del servicio (opcional, para verificar recursos múltiples)
   * @returns {Promise<Array<string>>} Array de horarios disponibles en formato HH:MM
   */
  static async getAvailableTimes(businessId, date, serviceDuration = 30, serviceId = null) {
    // Obtener horarios de trabajo configurados para este día
    const businessHours = await this.getBusinessHoursForDate(businessId, date);
    
    // Si el negocio está cerrado este día, retornar array vacío
    if (!businessHours.is_open) {
      return [];
    }

    // Parsear horarios de trabajo
    const [openHours, openMinutes] = businessHours.open_time.split(':').map(Number);
    const [closeHours, closeMinutes] = businessHours.close_time.split(':').map(Number);
    const startTime = openHours * 60 + openMinutes;
    const endTime = closeHours * 60 + closeMinutes;
    
    const timeSlotInterval = 30; // minutos

    // Generar todos los posibles horarios dentro del horario de trabajo
    const allTimeSlots = [];
    for (let minutes = startTime; minutes < endTime; minutes += timeSlotInterval) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      allTimeSlots.push(timeStr);
    }

    // Verificar si el servicio tiene recursos múltiples
    let service = null;
    let hasMultipleResources = false;
    let totalResources = 1;

    if (serviceId) {
      service = await Service.findById(serviceId);
      if (service) {
        hasMultipleResources = service.has_multiple_resources || false;
        if (hasMultipleResources) {
          const resources = await ServiceResource.findByService(serviceId, false);
          totalResources = resources.length;
        }
      }
    }

    // Obtener reservas existentes para esa fecha
    let existingBookings = await Booking.findByDateRange(
      businessId,
      date,
      date
    );

    // Si hay serviceId, filtrar solo reservas de ese servicio
    if (serviceId) {
      existingBookings = existingBookings.filter(b => b.service_id === serviceId);
    }

    // Obtener slots bloqueados de la tabla availability_slots
    const blockedSlots = await db('availability_slots')
      .where({ business_id: businessId, date })
      .where(function() {
        this.where({ is_blocked: true }).orWhere({ is_available: false });
      });

    // Crear un Map de horarios ocupados (si tiene recursos múltiples, contar cuántos están ocupados)
    const occupiedTimes = hasMultipleResources ? new Map() : new Set();

    // Agregar horarios ocupados por reservas confirmadas
    existingBookings
      .filter(b => b.status === 'confirmed' || b.status === 'pending' || b.status === 'pending_payment')
      .forEach(booking => {
        const bookingTime = booking.booking_time;
        const [hours, minutes] = bookingTime.split(':').map(Number);
        const bookingStart = hours * 60 + minutes;
        const bookingEnd = bookingStart + (booking.service_duration || serviceDuration);

        // Marcar todos los slots que se solapan con esta reserva
        allTimeSlots.forEach(slot => {
          const [slotHours, slotMinutes] = slot.split(':').map(Number);
          const slotStart = slotHours * 60 + slotMinutes;
          const slotEnd = slotStart + serviceDuration;

          // Si hay solapamiento, marcar como ocupado
          if (slotStart < bookingEnd && slotEnd > bookingStart) {
            if (hasMultipleResources) {
              // Contar cuántos recursos están ocupados en este horario
              const currentCount = occupiedTimes.get(slot) || 0;
              occupiedTimes.set(slot, currentCount + 1);
            } else {
              // Sin recursos múltiples, marcar directamente como ocupado
              occupiedTimes.add(slot);
            }
          }
        });
      });

    // Agregar horarios bloqueados
    blockedSlots.forEach(blocked => {
      const [startHours, startMinutes] = blocked.start_time.split(':').map(Number);
      const [endHours, endMinutes] = blocked.end_time.split(':').map(Number);
      const blockStart = startHours * 60 + startMinutes;
      const blockEnd = endHours * 60 + endMinutes;

      allTimeSlots.forEach(slot => {
        const [slotHours, slotMinutes] = slot.split(':').map(Number);
        const slotStart = slotHours * 60 + slotMinutes;
        const slotEnd = slotStart + serviceDuration;

        if (slotStart < blockEnd && slotEnd > blockStart) {
          occupiedTimes.add(slot);
        }
      });
    });

    // Filtrar horarios disponibles (no ocupados y no en el pasado si es hoy)
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return allTimeSlots.filter(slot => {
      // Si es hoy, filtrar horarios pasados
      if (date === today) {
        const [slotHours, slotMinutes] = slot.split(':').map(Number);
        if (slotHours < currentHour || (slotHours === currentHour && slotMinutes <= currentMinute)) {
          return false;
        }
      }

      // Filtrar horarios ocupados
      if (hasMultipleResources) {
        // Si tiene recursos múltiples, el horario está disponible si hay al menos un recurso libre
        const occupiedCount = occupiedTimes.get(slot) || 0;
        return occupiedCount < totalResources;
      } else {
        // Sin recursos múltiples, el horario está disponible si no está ocupado
        return !occupiedTimes.has(slot);
      }
    });
  }

  /**
   * Verifica si un horario está disponible
   * @param {string} businessId - ID del negocio
   * @param {string} date - Fecha en formato YYYY-MM-DD
   * @param {string} time - Hora en formato HH:MM
   * @param {number} serviceDuration - Duración del servicio en minutos
   * @param {string} serviceId - ID del servicio (opcional, para verificar recursos múltiples)
   * @returns {Promise<boolean>} true si está disponible
   */
  static async isTimeAvailable(businessId, date, time, serviceDuration = 30, serviceId = null) {
    const availableTimes = await this.getAvailableTimes(businessId, date, serviceDuration, serviceId);
    return availableTimes.includes(time);
  }

  /**
   * Obtiene disponibilidad para los próximos N días
   * @param {string} businessId - ID del negocio
   * @param {number} days - Número de días a consultar (default: 30)
   * @returns {Promise<Object>} Objeto con fechas como keys y arrays de horarios como values
   */
  static async getAvailabilityForNextDays(businessId, days = 30) {
    const availability = {};
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      // Obtener horarios disponibles para este día
      const times = await this.getAvailableTimes(businessId, dateStr);
      if (times.length > 0) {
        availability[dateStr] = times;
      }
    }

    return availability;
  }

  /**
   * Formatea disponibilidad para mostrar en mensaje de WhatsApp
   * @param {Object} availability - Objeto con fechas y horarios
   * @param {number} maxDays - Máximo de días a mostrar (default: 7)
   * @returns {string} Mensaje formateado
   */
  static formatAvailabilityMessage(availability, maxDays = 7) {
    const entries = Object.entries(availability).slice(0, maxDays);
    
    if (entries.length === 0) {
      return 'No hay horarios disponibles en los próximos días.';
    }

    let message = '*Horarios Disponibles:*\n\n';
    
    entries.forEach(([date, times]) => {
      const dateObj = new Date(date);
      const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
      const day = dateObj.getDate();
      const month = dateObj.toLocaleDateString('es-ES', { month: 'long' });
      
      message += `📅 *${dayName} ${day} de ${month}*\n`;
      
      // Mostrar horarios en grupos de 4
      const timeGroups = [];
      for (let i = 0; i < times.length; i += 4) {
        timeGroups.push(times.slice(i, i + 4));
      }
      
      timeGroups.forEach(group => {
        message += `   ${group.join(' | ')}\n`;
      });
      
      message += '\n';
    });

    return message;
  }
}

