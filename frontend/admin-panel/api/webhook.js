/**
 * Webhook endpoint para recibir mensajes de Meta WhatsApp Business API
 * 
 * Este endpoint:
 * - Verifica el webhook de Meta
 * - Recibe mensajes entrantes
 * - Identifica el comercio desde el slug en el mensaje
 * - Maneja sesiones
 * - Procesa la lógica del bot
 */

import { SessionService } from '../../../backend/src/services/sessionService.js';
import { ClientService } from '../../../backend/src/services/clientService.js';
import { BotService } from '../../../backend/src/services/botService.js';

// Verificación del webhook (GET)
export default async function handler(req, res) {
  // Verificación del webhook de Meta
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'] || req.query['hub_mode'];
    const token = req.query['hub.verify_token'] || req.query['hub_verify_token'];
    const challenge = req.query['hub.challenge'] || req.query['hub_challenge'];

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

    console.log('[Webhook] Verificación recibida:', { mode, token, challenge: challenge?.substring(0, 20) });
    console.log('[Webhook] Verify token esperado:', verifyToken);

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('[Webhook] ✅ Webhook verificado correctamente');
      return res.status(200).send(challenge);
    } else {
      console.warn('[Webhook] ❌ Verificación fallida:', { 
        modeMatch: mode === 'subscribe', 
        tokenMatch: token === verifyToken,
        receivedToken: token?.substring(0, 10) + '...',
        expectedToken: verifyToken?.substring(0, 10) + '...'
      });
      return res.status(403).send('Forbidden');
    }
  }

  // Procesar mensajes entrantes (POST)
  if (req.method === 'POST') {
    try {
      const body = req.body;

      // Meta envía notificaciones en este formato
      if (body.object === 'whatsapp_business_account') {
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;

        // Procesar mensajes
        if (value?.messages) {
          for (const message of value.messages) {
            await processMessage(message, value.metadata);
          }
        }

        // Procesar estados de mensajes (delivered, read, etc.)
        if (value?.statuses) {
          for (const status of value.statuses) {
            console.log('[Webhook] Status update:', status);
            // Aquí puedes manejar estados si es necesario
          }
        }

        res.status(200).json({ success: true });
      } else {
        res.status(200).json({ success: true, message: 'Not a WhatsApp message' });
      }
    } catch (error) {
      console.error('[Webhook] Error procesando mensaje:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}

/**
 * Procesa un mensaje entrante
 */
async function processMessage(message, metadata) {
  try {
    const from = message.from; // Número del usuario (formato: 5491123456789)
    const messageText = message.text?.body || '';
    const messageId = message.id;

    console.log(`[Webhook] Mensaje recibido de ${from}: "${messageText}"`);

    // Detectar slug del comercio desde el mensaje
    // El slug puede venir en el primer mensaje cuando el usuario hace clic en el shortlink
    let clientSlug = null;
    
    // Intentar extraer el slug del mensaje
    // Si el mensaje es solo el slug (ej: "monpatisserie"), ese es el comercio
    const slugMatch = messageText.trim().match(/^([a-z0-9-]+)$/i);
    if (slugMatch) {
      clientSlug = slugMatch[1].toLowerCase();
    }

    // Obtener o crear sesión
    let session;
    if (clientSlug) {
      // Si hay slug, crear/actualizar sesión con ese comercio
      session = await SessionService.getOrCreateSession(from, clientSlug);
    } else {
      // Si no hay slug, buscar sesión activa
      session = await SessionService.getActiveSession(from);
      
      if (!session) {
        // No hay sesión activa y no hay slug, preguntar al usuario
        await sendMessage(from, '👋 ¡Hola! ¿Con qué comercio querés continuar? Por favor, envía el nombre o usa el link que te compartieron.');
        return;
      }
      
      clientSlug = session.client_slug;
    }

    // Obtener configuración del comercio
    const client = await ClientService.getBySlug(clientSlug);
    if (!client || client.status !== 'active') {
      await sendMessage(from, '❌ Lo siento, ese comercio no está disponible en este momento.');
      return;
    }

    // Procesar mensaje con el bot
    await BotService.processMessage({
      userPhone: from,
      messageText,
      clientSlug,
      session,
      client,
      messageId,
    });

  } catch (error) {
    console.error('[Webhook] Error procesando mensaje:', error);
    // Intentar enviar mensaje de error al usuario
    try {
      await sendMessage(message.from, '❌ Ocurrió un error. Por favor, intenta de nuevo más tarde.');
    } catch (sendError) {
      console.error('[Webhook] Error enviando mensaje de error:', sendError);
    }
  }
}

/**
 * Envía un mensaje usando la API de Meta
 */
async function sendMessage(to, text) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error('WhatsApp credentials not configured');
  }

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: text },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send message: ${error}`);
  }

  return await response.json();
}

