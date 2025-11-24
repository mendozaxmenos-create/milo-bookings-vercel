/**
 * Endpoint para generar y gestionar shortlinks
 * 
 * GET /api/shortlinks - Listar shortlinks
 * POST /api/shortlinks - Crear nuevo shortlink
 */

import { ClientService } from '../../../backend/src/services/clientService.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Listar todos los clientes activos con sus slugs
      const clients = await ClientService.getAllActive();
      
      const shortlinks = clients.map(client => ({
        slug: client.slug,
        name: client.name,
        url: `${process.env.SHORTLINK_BASE_URL || 'https://go.soymilo.com'}/${client.slug}`,
      }));

      return res.status(200).json({ shortlinks });
    } catch (error) {
      console.error('[Shortlinks] Error:', error);
      return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, slug, businessId, settings } = req.body;

      if (!name || !slug) {
        return res.status(400).json({ error: 'Missing required fields: name, slug' });
      }

      // Validar formato del slug
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return res.status(400).json({ error: 'Invalid slug format. Use only lowercase letters, numbers, and hyphens' });
      }

      const client = await ClientService.create({
        name,
        slug: slug.toLowerCase(),
        business_id: businessId || null,
        settings: settings || {},
      });

      return res.status(201).json({
        id: client.id,
        name: client.name,
        slug: client.slug,
        url: `${process.env.SHORTLINK_BASE_URL || 'https://go.soymilo.com'}/${client.slug}`,
      });
    } catch (error) {
      console.error('[Shortlinks] Error:', error);
      if (error.message.includes('unique')) {
        return res.status(409).json({ error: 'Slug already exists' });
      }
      return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

