/**
 * Endpoint para manejar shortlinks
 * 
 * Redirige a wa.me con el slug del comercio
 * 
 * GET /api/shortlink?slug=monpatisserie
 * o
 * GET /monpatisserie (rewrite desde vercel.json)
 */

import { ClientService } from '../../../backend/src/services/clientService.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const slug = req.query.slug;

    if (!slug) {
      return res.status(400).json({ error: 'Missing slug parameter' });
    }

    // Verificar que el cliente existe
    const client = await ClientService.getBySlug(slug);

    if (!client || client.status !== 'active') {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Comercio no encontrado</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>❌ Comercio no encontrado</h1>
            <p>El link que intentaste usar no está disponible.</p>
          </body>
        </html>
      `);
    }

    // Obtener número de WhatsApp desde variables de entorno
    const whatsappNumber = process.env.WHATSAPP_NUMBER; // Formato: 5491123456789 (sin +)
    
    if (!whatsappNumber) {
      return res.status(500).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Error de configuración</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>❌ Error de configuración</h1>
            <p>El sistema no está configurado correctamente.</p>
          </body>
        </html>
      `);
    }

    // Crear URL de WhatsApp con el slug como mensaje inicial
    // El slug se enviará como primer mensaje para identificar el comercio
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(slug)}`;

    // Redirigir a WhatsApp
    return res.redirect(301, whatsappUrl);
  } catch (error) {
    console.error('[Shortlink] Error:', error);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>❌ Error</h1>
          <p>Ocurrió un error al procesar tu solicitud.</p>
        </body>
      </html>
    `);
  }
}

