/**
 * Endpoint interno para enviar mensajes por WhatsApp
 * 
 * Este endpoint puede ser usado por otros servicios para enviar mensajes
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, text, phoneNumberId, accessToken } = req.body;

    if (!to || !text) {
      return res.status(400).json({ error: 'Missing required fields: to, text' });
    }

    // Usar credenciales del body o de las variables de entorno
    const finalPhoneNumberId = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
    const finalAccessToken = accessToken || process.env.WHATSAPP_ACCESS_TOKEN;

    if (!finalPhoneNumberId || !finalAccessToken) {
      return res.status(500).json({ error: 'WhatsApp credentials not configured' });
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${finalPhoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${finalAccessToken}`,
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
      console.error('[SendMessage] Error:', error);
      return res.status(response.status).json({ error: 'Failed to send message', details: error });
    }

    const result = await response.json();
    return res.status(200).json({ success: true, messageId: result.messages?.[0]?.id });
  } catch (error) {
    console.error('[SendMessage] Error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

