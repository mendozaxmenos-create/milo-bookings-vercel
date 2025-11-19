import express from 'express';
import { authenticateToken } from '../../utils/auth.js';
import { BusinessHours } from '../../../database/models/BusinessHours.js';
import { AvailabilityService } from '../../services/availabilityService.js';
import db from '../../../database/index.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// ============================================
// Horarios de Trabajo (Business Hours)
// ============================================

// Obtener horarios de trabajo del negocio
router.get('/hours', async (req, res) => {
  try {
    const hours = await BusinessHours.findByBusiness(req.user.business_id);
    res.json({ data: hours });
  } catch (error) {
    console.error('Error getting business hours:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Actualizar horarios de trabajo (por día)
router.put('/hours/:dayOfWeek', async (req, res) => {
  try {
    const dayOfWeek = parseInt(req.params.dayOfWeek);
    
    if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ error: 'Invalid day of week (0-6)' });
    }

    const { open_time, close_time, is_open } = req.body;

    const hour = await BusinessHours.upsert(req.user.business_id, dayOfWeek, {
      open_time,
      close_time,
      is_open: is_open ?? true,
    });

    res.json({ data: hour });
  } catch (error) {
    console.error('Error updating business hours:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Actualizar todos los horarios de trabajo
router.put('/hours', async (req, res) => {
  try {
    const hours = req.body.hours; // Array de { day_of_week, open_time, close_time, is_open }
    
    if (!Array.isArray(hours)) {
      return res.status(400).json({ error: 'Hours must be an array' });
    }

    const updatedHours = [];
    for (const hourData of hours) {
      const hour = await BusinessHours.upsert(
        req.user.business_id,
        hourData.day_of_week,
        {
          open_time: hourData.open_time,
          close_time: hourData.close_time,
          is_open: hourData.is_open ?? true,
        }
      );
      updatedHours.push(hour);
    }

    res.json({ data: updatedHours });
  } catch (error) {
    console.error('Error updating business hours:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// Bloques de Disponibilidad (Availability Slots)
// ============================================

// Obtener bloques de disponibilidad
router.get('/slots', async (req, res) => {
  try {
    const { date, start_date, end_date } = req.query;
    
    let query = db('availability_slots')
      .where({ business_id: req.user.business_id });

    if (date) {
      query = query.where({ date });
    } else if (start_date && end_date) {
      query = query.whereBetween('date', [start_date, end_date]);
    }

    const slots = await query.orderBy('date', 'asc').orderBy('start_time', 'asc');
    res.json({ data: slots });
  } catch (error) {
    console.error('Error getting availability slots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Crear bloque de disponibilidad (bloquear horario)
router.post('/slots', async (req, res) => {
  try {
    const { date, start_time, end_time, is_blocked = true, service_id } = req.body;

    if (!date || !start_time || !end_time) {
      return res.status(400).json({ error: 'date, start_time, and end_time are required' });
    }

    const slot = {
      id: uuidv4(),
      business_id: req.user.business_id,
      date,
      start_time,
      end_time,
      is_blocked,
      is_available: !is_blocked,
      service_id: service_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db('availability_slots').insert(slot);
    res.status(201).json({ data: slot });
  } catch (error) {
    console.error('Error creating availability slot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Eliminar bloque de disponibilidad
router.delete('/slots/:id', async (req, res) => {
  try {
    const slot = await db('availability_slots')
      .where({ id: req.params.id, business_id: req.user.business_id })
      .first();

    if (!slot) {
      return res.status(404).json({ error: 'Availability slot not found' });
    }

    await db('availability_slots').where({ id: req.params.id }).delete();
    res.json({ message: 'Availability slot deleted' });
  } catch (error) {
    console.error('Error deleting availability slot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// Consultar Disponibilidad
// ============================================

// Obtener disponibilidad para una fecha
router.get('/available-times', async (req, res) => {
  try {
    const { date, service_duration = 30, service_id } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'date is required' });
    }

    const availableTimes = await AvailabilityService.getAvailableTimes(
      req.user.business_id,
      date,
      parseInt(service_duration),
      service_id || null // Pasar service_id para verificar recursos múltiples
    );

    res.json({ data: availableTimes });
  } catch (error) {
    console.error('Error getting available times:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Obtener disponibilidad para los próximos días
router.get('/availability', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    
    const availability = await AvailabilityService.getAvailabilityForNextDays(
      req.user.business_id,
      days
    );

    res.json({ data: availability });
  } catch (error) {
    console.error('Error getting availability:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

