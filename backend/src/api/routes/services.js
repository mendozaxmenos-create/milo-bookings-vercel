import express from 'express';
import { Service } from '../../../database/models/Service.js';
import { authenticateToken } from '../../utils/auth.js';
import { validateService } from '../../utils/validators.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Listar servicios del negocio
router.get('/', async (req, res) => {
  try {
    console.log('[API] GET /services - User:', {
      user_id: req.user.user_id,
      business_id: req.user.business_id,
      role: req.user.role,
    });
    
    const includeInactive = req.query.includeInactive === 'true';
    const services = await Service.findByBusiness(req.user.business_id, includeInactive);
    
    console.log('[API] GET /services - Found services:', {
      count: services?.length || 0,
      business_id: req.user.business_id,
      includeInactive,
    });
    
    res.json({ data: services });
  } catch (error) {
    console.error('[API] Error listing services:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Obtener servicio por ID
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Verificar que el servicio pertenece al negocio del usuario
    if (service.business_id !== req.user.business_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({ data: service });
  } catch (error) {
    console.error('Error getting service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Crear servicio
router.post('/', async (req, res) => {
  try {
    const { error, value } = validateService(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const service = await Service.create({
      ...value,
      business_id: req.user.business_id,
    });

    res.status(201).json({ data: service });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Actualizar servicio
router.put('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Verificar que el servicio pertenece al negocio del usuario
    if (service.business_id !== req.user.business_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { error, value } = validateService(req.body, true);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const updated = await Service.update(req.params.id, value);
    res.json({ data: updated });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Eliminar servicio
router.delete('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Verificar que el servicio pertenece al negocio del usuario
    if (service.business_id !== req.user.business_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await Service.delete(req.params.id);
    res.json({ message: 'Service deleted' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle activo/inactivo
router.patch('/:id/toggle', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Verificar que el servicio pertenece al negocio del usuario
    if (service.business_id !== req.user.business_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = await Service.toggleActive(req.params.id);
    res.json({ data: updated });
  } catch (error) {
    console.error('Error toggling service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

