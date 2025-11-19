import crypto from 'crypto';
import { BusinessUser } from '../../database/models/BusinessUser.js';
import { SystemUser } from '../../database/models/SystemUser.js';
import { Business } from '../../database/models/Business.js';
import { activeBots } from '../index.js';

/**
 * Genera un token de recuperación de contraseña
 */
export function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Envía el token de recuperación por WhatsApp
 */
export async function sendPasswordResetToken(businessId, phone) {
  try {
    // Buscar usuario
    const user = await BusinessUser.findByBusinessAndPhone(businessId, phone);
    if (!user) {
      // Por seguridad, no revelamos si el usuario existe o no
      return { success: true };
    }

    // Generar token
    const resetToken = generateResetToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Válido por 1 hora

    // Guardar token en la base de datos
    await BusinessUser.setResetToken(user.id, resetToken, expiresAt.toISOString());

    // Obtener información del negocio
    const business = await Business.findById(businessId);
    if (!business) {
      console.error(`[PasswordReset] Negocio no encontrado: ${businessId}`);
      return { success: false, error: 'Business not found' };
    }

    // Obtener bot activo
    const bot = activeBots.get(businessId);
    if (!bot) {
      console.warn(`[PasswordReset] Bot no disponible para negocio ${businessId}`);
      // Aún así guardamos el token, el usuario puede usar el link directo
      return { success: true, token: resetToken };
    }

    // Formatear número de teléfono para WhatsApp
    let userPhone = phone.replace(/[\s\+]/g, '');
    if (!userPhone.includes('@')) {
      userPhone = `${userPhone}@c.us`;
    }

    // Crear mensaje con el token
    const resetMessage = `🔐 *Recuperación de Contraseña*

Hola! Has solicitado recuperar tu contraseña para ${business.name}.

Tu código de recuperación es:
*${resetToken}*

Este código expira en 1 hora.

Si no solicitaste este código, ignora este mensaje.

Para restablecer tu contraseña, usa este código en la página de recuperación.`;

    // Enviar mensaje
    await bot.sendMessage(userPhone, resetMessage);

    console.log(`[PasswordReset] ✅ Token enviado a ${phone} para negocio ${businessId}`);
    return { success: true, token: resetToken };
  } catch (error) {
    console.error(`[PasswordReset] Error enviando token a ${phone}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Envía el token de recuperación para super admin por email
 * (Por ahora retorna el token para mostrarlo en el frontend, en producción debería enviarse por email)
 */
export async function sendSystemUserPasswordResetToken(email) {
  try {
    // Buscar usuario
    const user = await SystemUser.findByEmail(email);
    if (!user) {
      // Por seguridad, no revelamos si el usuario existe o no
      return { success: true };
    }

    if (!user.is_active) {
      return { success: true }; // No revelamos que existe pero está inactivo
    }

    // Generar token
    const resetToken = generateResetToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Válido por 1 hora

    // Guardar token en la base de datos
    await SystemUser.setResetToken(user.id, resetToken, expiresAt.toISOString());

    // TODO: En producción, enviar por email usando un servicio de email (SendGrid, Resend, etc.)
    // Por ahora, retornamos el token para mostrarlo en el frontend
    // En producción, deberías configurar un servicio de email real
    console.log(`[PasswordReset] Token generado para super admin ${email}: ${resetToken}`);
    console.warn(`[PasswordReset] ⚠️ En producción, esto debería enviarse por email. Token: ${resetToken}`);

    return { success: true, token: resetToken };
  } catch (error) {
    console.error(`[PasswordReset] Error generando token para ${email}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Resetea la contraseña usando el token
 */
export async function resetPasswordWithToken(token, newPassword) {
  try {
    // Intentar buscar en business users primero
    let user = await BusinessUser.findByResetToken(token);
    let userType = 'business';

    // Si no está en business users, buscar en system users
    if (!user) {
      user = await SystemUser.findByResetToken(token);
      userType = 'system';
    }

    if (!user) {
      return { success: false, error: 'Token inválido o expirado' };
    }

    // Actualizar contraseña según el tipo de usuario
    if (userType === 'business') {
      await BusinessUser.update(user.id, { password: newPassword });
      await BusinessUser.clearResetToken(user.id);
    } else {
      await SystemUser.update(user.id, { password: newPassword });
      await SystemUser.clearResetToken(user.id);
    }

    console.log(`[PasswordReset] ✅ Contraseña reseteada para usuario ${userType} ${user.id}`);
    return { success: true, userId: user.id, userType };
  } catch (error) {
    console.error(`[PasswordReset] Error reseteando contraseña:`, error);
    return { success: false, error: error.message };
  }
}

