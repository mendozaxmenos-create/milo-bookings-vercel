/**
 * Servicio para almacenar QR codes de WhatsApp por negocio
 * Los QR codes se almacenan temporalmente en memoria
 */

// Almacenar QR codes por businessId
// Formato: { businessId: { qr: string, timestamp: Date, expiresAt: Date } }
const qrCodes = new Map();

// Tiempo de expiración del QR code (5 minutos)
const QR_EXPIRATION_TIME = 5 * 60 * 1000;

/**
 * Guardar QR code para un negocio
 * @param {string} businessId - ID del negocio
 * @param {string} qr - Código QR
 */
export function saveQRCode(businessId, qr) {
  const expiresAt = new Date(Date.now() + QR_EXPIRATION_TIME);
  qrCodes.set(businessId, {
    qr,
    timestamp: new Date(),
    expiresAt,
  });
  
  console.log(`[QRStorage] QR code guardado para negocio ${businessId}`);
}

/**
 * Obtener QR code de un negocio
 * @param {string} businessId - ID del negocio
 * @returns {Object|null} - QR code y metadata, o null si no existe/expirado
 */
export function getQRCode(businessId) {
  const qrData = qrCodes.get(businessId);
  
  if (!qrData) {
    return null;
  }
  
  // Verificar si expiró
  if (new Date() > qrData.expiresAt) {
    qrCodes.delete(businessId);
    return null;
  }
  
  return {
    qr: qrData.qr,
    timestamp: qrData.timestamp,
    expiresAt: qrData.expiresAt,
  };
}

/**
 * Eliminar QR code de un negocio
 * @param {string} businessId - ID del negocio
 */
export function deleteQRCode(businessId) {
  qrCodes.delete(businessId);
}

/**
 * Limpiar QR codes expirados
 */
export function cleanupExpiredQRCodes() {
  const now = new Date();
  for (const [businessId, qrData] of qrCodes.entries()) {
    if (now > qrData.expiresAt) {
      qrCodes.delete(businessId);
    }
  }
}

// Limpiar QR codes expirados cada minuto
setInterval(cleanupExpiredQRCodes, 60 * 1000);

