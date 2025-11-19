import express from 'express';
import { ServiceResource } from '../../../database/models/ServiceResource.js';
import { Service } from '../../../database/models/Service.js';
import { authenticateToken } from '../../utils/auth.js';
import { sanitizeObject } from '../../utils/sanitize.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Listar recursos de un servicio
router.get('/service/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;

    // Verificar que el servicio pertenece al negocio
    const service = await Service.findById(serviceId);
    if (!service || service.business_id !== req.user.business_id) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const includeInactive = req.query.includeInactive === 'true';
    const resources = await ServiceResource.findByService(serviceId, includeInactive);
    
    res.json({ data: resources });
  } catch (error) {
    console.error('Error listing service resources:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Crear recurso de servicio
router.post('/', async (req, res) => {
  try {
    const { service_id, name, display_order } = sanitizeObject(req.body, {
      name: 'string',
    });

    if (!service_id || !name) {
      return res.status(400).json({ error: 'service_id and name are required' });
    }

    // Verificar que el servicio pertenece al negocio
    const service = await Service.findById(service_id);
    if (!service || service.business_id !== req.user.business_id) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Verificar si el servicio tiene recursos múltiples habilitados
    if (!service.has_multiple_resources) {
      return res.status(400).json({ 
        error: 'El servicio no tiene recursos múltiples habilitados. Primero habilita esta función en el servicio.' 
      });
    }

    const resource = await ServiceResource.create({
      service_id,
      name,
      display_order: display_order || 0,
    });

    res.status(201).json({ data: resource });
  } catch (error) {
    console.error('Error creating service resource:', error);
    if (error.code === 'SQLITE_CONSTRAINT' || error.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un recurso con ese nombre para este servicio' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Actualizar recurso
router.put('/:id', async (req, res) => {
  try {
    const resource = await ServiceResource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Verificar que el servicio pertenece al negocio
    const service = await Service.findById(resource.service_id);
    if (!service || service.business_id !== req.user.business_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { name, display_order } = sanitizeObject(req.body, {
      name: 'string',
    });

    const updated = await ServiceResource.update(req.params.id, {
      ...(name && { name }),
      ...(display_order !== undefined && { display_order }),
    });

    res.json({ data: updated });
  } catch (error) {
    console.error('Error updating service resource:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Eliminar recurso
router.delete('/:id', async (req, res) => {
  try {
    const resource = await ServiceResource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Verificar que el servicio pertenece al negocio
    const service = await Service.findById(resource.service_id);
    if (!service || service.business_id !== req.user.business_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await ServiceResource.delete(req.params.id);
    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Error deleting service resource:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Activar/desactivar recurso
router.patch('/:id/toggle', async (req, res) => {
  try {
    const resource = await ServiceResource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Verificar que el servicio pertenece al negocio
    const service = await Service.findById(resource.service_id);
    if (!service || service.business_id !== req.user.business_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = await ServiceResource.toggleActive(req.params.id);
    res.json({ data: updated });
  } catch (error) {
    console.error('Error toggling service resource:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

