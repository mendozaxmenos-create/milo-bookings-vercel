/**
 * Script para verificar que los datos no se hayan perdido
 * 
 * Este script verifica:
 * - Cuántas reservas hay en total
 * - Cuántas reservas por negocio
 * - Si hay reservas huérfanas (sin servicio asociado)
 * - Si hay servicios sin negocio
 * 
 * Uso: node scripts/verify-data.js
 */

import dotenv from 'dotenv';
import db from '../database/index.js';

dotenv.config();

async function verifyData() {
  try {
    console.log('🔍 Verificando datos en la base de datos...\n');
    
    // Verificar negocios
    const businesses = await db('businesses').select('*');
    console.log(`📊 Negocios: ${businesses.length}`);
    businesses.forEach(b => {
      console.log(`  - ${b.id}: ${b.name} (activo: ${b.is_active})`);
    });
    
    // Verificar servicios
    const services = await db('services').select('*');
    console.log(`\n📊 Servicios: ${services.length} total`);
    
    const servicesByBusiness = {};
    services.forEach(s => {
      if (!servicesByBusiness[s.business_id]) {
        servicesByBusiness[s.business_id] = { total: 0, active: 0 };
      }
      servicesByBusiness[s.business_id].total++;
      if (s.is_active) {
        servicesByBusiness[s.business_id].active++;
      }
    });
    
    Object.entries(servicesByBusiness).forEach(([businessId, counts]) => {
      const business = businesses.find(b => b.id === businessId);
      console.log(`  - ${businessId} (${business?.name || 'Unknown'}): ${counts.total} total, ${counts.active} activos`);
    });
    
    // Verificar reservas
    const bookings = await db('bookings').select('*');
    console.log(`\n📊 Reservas: ${bookings.length} total`);
    
    const bookingsByBusiness = {};
    const bookingsByStatus = {};
    
    bookings.forEach(b => {
      // Por negocio
      if (!bookingsByBusiness[b.business_id]) {
        bookingsByBusiness[b.business_id] = 0;
      }
      bookingsByBusiness[b.business_id]++;
      
      // Por estado
      if (!bookingsByStatus[b.status]) {
        bookingsByStatus[b.status] = 0;
      }
      bookingsByStatus[b.status]++;
    });
    
    console.log('\n📊 Reservas por negocio:');
    Object.entries(bookingsByBusiness).forEach(([businessId, count]) => {
      const business = businesses.find(b => b.id === businessId);
      console.log(`  - ${businessId} (${business?.name || 'Unknown'}): ${count} reservas`);
    });
    
    console.log('\n📊 Reservas por estado:');
    Object.entries(bookingsByStatus).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}`);
    });
    
    // Verificar reservas huérfanas (sin servicio)
    const orphanBookings = await db('bookings')
      .leftJoin('services', 'bookings.service_id', 'services.id')
      .whereNull('services.id')
      .select('bookings.*');
    
    if (orphanBookings.length > 0) {
      console.log(`\n⚠️  ADVERTENCIA: ${orphanBookings.length} reservas sin servicio asociado:`);
      orphanBookings.forEach(b => {
        console.log(`  - Reserva ${b.id}: servicio_id=${b.service_id}, negocio=${b.business_id}`);
      });
    } else {
      console.log('\n✅ Todas las reservas tienen servicio asociado');
    }
    
    // Verificar servicios huérfanos (sin negocio)
    const orphanServices = await db('services')
      .leftJoin('businesses', 'services.business_id', 'businesses.id')
      .whereNull('businesses.id')
      .select('services.*');
    
    if (orphanServices.length > 0) {
      console.log(`\n⚠️  ADVERTENCIA: ${orphanServices.length} servicios sin negocio asociado:`);
      orphanServices.forEach(s => {
        console.log(`  - Servicio ${s.id}: ${s.name}, business_id=${s.business_id}`);
      });
    } else {
      console.log('\n✅ Todos los servicios tienen negocio asociado');
    }
    
    // Resumen
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN:');
    console.log(`  Negocios: ${businesses.length}`);
    console.log(`  Servicios: ${services.length}`);
    console.log(`  Reservas: ${bookings.length}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error verificando datos:', error);
    process.exit(1);
  }
}

verifyData()
  .then(() => {
    console.log('\n✅ Verificación completada.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });

