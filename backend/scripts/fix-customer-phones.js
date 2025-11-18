/**
 * Script para corregir números de teléfono en reservas existentes
 * 
 * Este script corrige números de teléfono que son IDs de WhatsApp (muy largos)
 * a números reales basándose en patrones comunes.
 * 
 * NOTA: Este script hace correcciones básicas. Para correcciones más precisas,
 * se recomienda usar el bot activo que ya tiene acceso a los contactos.
 * 
 * Uso: npm run fix:phones
 */

import dotenv from 'dotenv';
import db from '../database/index.js';

dotenv.config();

/**
 * Intenta corregir un número de teléfono que es un ID de WhatsApp
 * 
 * Este método hace correcciones básicas basadas en patrones comunes.
 * Para correcciones más precisas, se necesita acceso al bot de WhatsApp.
 */
function tryFixPhoneNumber(phone) {
  // Remover el + si existe
  let cleanPhone = phone.replace(/^\+/, '');
  
  // Si el número es muy largo (15+ dígitos), probablemente es un ID de WhatsApp
  // Los IDs de WhatsApp suelen tener 15-17 dígitos y no empiezan con códigos de país comunes
  if (cleanPhone.length > 14) {
    // Intentar extraer un número válido del ID
    // A veces el número real está al final del ID
    
    // Si termina con un número de 10 dígitos (formato argentino)
    const last10 = cleanPhone.slice(-10);
    if (last10.match(/^\d{10}$/)) {
      return `+54${last10}`;
    }
    
    // Si termina con un número de 12-13 dígitos que empieza con 54
    const last13 = cleanPhone.slice(-13);
    if (last13.match(/^54\d{10,11}$/)) {
      return `+${last13}`;
    }
    
    // No se puede corregir automáticamente
    return null;
  }
  
  // Si el número tiene 10 dígitos, agregar código de país argentino
  if (cleanPhone.length === 10 && cleanPhone.match(/^\d{10}$/)) {
    return `+54${cleanPhone}`;
  }
  
  // Si el número ya tiene formato correcto, devolverlo
  if (cleanPhone.startsWith('54') && cleanPhone.length >= 12) {
    return `+${cleanPhone}`;
  }
  
  return null;
}

/**
 * Corrige los números de teléfono en las reservas
 */
async function fixCustomerPhones() {
  try {
    console.log('🔍 Buscando reservas con números de teléfono incorrectos...\n');
    
    // Obtener todas las reservas
    const bookings = await db('bookings')
      .orderBy('created_at', 'desc');
    
    console.log(`📋 Encontradas ${bookings.length} reservas en total\n`);
    
    let totalFixed = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    let totalNeedsManualFix = 0;
    
    for (const booking of bookings) {
      const currentPhone = booking.customer_phone;
      
      // Verificar si el número parece un ID de WhatsApp
      // IDs típicos: 15+ dígitos, no empiezan con códigos de país conocidos
      const phoneDigits = currentPhone.replace(/^\+/, '');
      const isLikelyWhatsAppId = 
        phoneDigits.length > 14 || 
        (!currentPhone.startsWith('+54') && phoneDigits.length > 11 && phoneDigits.length < 15);
      
      if (!isLikelyWhatsAppId) {
        // El número parece válido, saltarlo
        totalSkipped++;
        continue;
      }
      
      console.log(`🔧 Analizando reserva ${booking.id}:`);
      console.log(`   Cliente: ${booking.customer_name || 'Sin nombre'}`);
      console.log(`   Teléfono actual: ${currentPhone} (${phoneDigits.length} dígitos)`);
      
      try {
        // Intentar corregir el número
        const fixedPhone = tryFixPhoneNumber(currentPhone);
        
        if (fixedPhone && fixedPhone !== currentPhone) {
          // Actualizar la reserva
          await db('bookings')
            .where({ id: booking.id })
            .update({
              customer_phone: fixedPhone,
              updated_at: new Date().toISOString(),
            });
          
          console.log(`   ✅ Corregido: ${currentPhone} → ${fixedPhone}\n`);
          totalFixed++;
        } else {
          console.log(`   ⚠️  No se pudo corregir automáticamente`);
          console.log(`   💡 Este número necesita corrección manual\n`);
          totalNeedsManualFix++;
        }
      } catch (error) {
        console.error(`   ❌ Error procesando reserva:`, error.message);
        totalErrors++;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Resumen:');
    console.log(`  ✅ Corregidas automáticamente: ${totalFixed}`);
    console.log(`  ⏭️  Omitidas (ya correctas): ${totalSkipped}`);
    console.log(`  ⚠️  Necesitan corrección manual: ${totalNeedsManualFix}`);
    console.log(`  ❌ Errores: ${totalErrors}`);
    console.log('='.repeat(60));
    
    if (totalNeedsManualFix > 0) {
      console.log('\n💡 Para corregir números que no se pudieron corregir automáticamente:');
      console.log('   1. Identifica el número real del cliente');
      console.log('   2. Actualiza manualmente en la base de datos o desde el panel');
    }
    
  } catch (error) {
    console.error('❌ Error en el script:', error);
    process.exit(1);
  }
}

// Ejecutar el script
fixCustomerPhones()
  .then(() => {
    console.log('\n✅ Script completado.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });

