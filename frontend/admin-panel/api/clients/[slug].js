/**
 * Endpoint para obtener la configuración de un comercio por su slug
 * 
 * GET /api/clients/[slug]
 */

import { ClientService } from '../../../../backend/src/services/clientService.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // En Vercel, los parámetros dinámicos vienen en req.query
    const slug = req.query.slug;

    if (!slug) {
      return res.status(400).json({ error: 'Missing slug parameter' });
    }

    const client = await ClientService.getBySlug(slug);

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // No devolver información sensible
    return res.status(200).json({
      id: client.id,
      name: client.name,
      slug: client.slug,
      status: client.status,
      settings: client.settings,
    });
  } catch (error) {
    console.error('[Clients] Error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

