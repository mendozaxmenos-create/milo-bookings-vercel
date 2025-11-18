/**
 * Script para mostrar las credenciales de acceso de los negocios
 * 
 * Uso: node scripts/show-credentials.js
 */

import dotenv from 'dotenv';
import db from '../database/index.js';

dotenv.config();

async function showCredentials() {
  try {
    console.log('🔐 Credenciales de acceso a Milo Bookings\n');
    console.log('='.repeat(60));
    
    // Obtener todos los negocios
    const businesses = await db('businesses').select('*');
    
    if (businesses.length === 0) {
      console.log('⚠️  No hay negocios en la base de datos.');
      console.log('   Ejecuta: npm run db:seed');
      process.exit(0);
    }
    
    for (const business of businesses) {
      console.log(`\n📋 Negocio: ${business.name}`);
      console.log(`   ID: ${business.id}`);
      console.log(`   Teléfono: ${business.phone}`);
      console.log(`   Email: ${business.email || 'N/A'}`);
      console.log(`   Estado: ${business.is_active ? '✅ Activo' : '❌ Inactivo'}`);
      
      // Obtener usuarios del negocio
      const users = await db('business_users')
        .where({ business_id: business.id })
        .select('id', 'phone', 'role', 'created_at');
      
      if (users.length === 0) {
        console.log('   ⚠️  No hay usuarios configurados para este negocio.');
      } else {
        console.log(`\n   👤 Usuarios:`);
        users.forEach(user => {
          console.log(`      - Teléfono: ${user.phone}`);
          console.log(`        Rol: ${user.role}`);
          console.log(`        ID Usuario: ${user.id}`);
        });
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📝 CREDENCIALES DE ACCESO:');
    console.log('\nPara iniciar sesión en el panel de administración:');
    console.log('   1. Selecciona "Negocio" en el login');
    console.log('   2. Ingresa el Business ID');
    console.log('   3. Ingresa el Teléfono del usuario');
    console.log('   4. Ingresa la contraseña');
    
    // Mostrar credenciales del seed demo
    const demoBusiness = businesses.find(b => b.id === 'demo-business-001');
    if (demoBusiness) {
      const demoUser = await db('business_users')
        .where({ business_id: 'demo-business-001' })
        .first();
      
      if (demoUser) {
        console.log('\n🔑 CREDENCIALES DEMO (del seed):');
        console.log(`   Business ID: ${demoBusiness.id}`);
        console.log(`   Teléfono: ${demoUser.phone}`);
        console.log(`   Contraseña: demo123`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n💡 NOTA: Si no recuerdas la contraseña, puedes:');
    console.log('   1. Verificar en el seed file: backend/database/seeds/001_demo_data.js');
    console.log('   2. O crear un nuevo usuario desde el panel de super admin');
    console.log('   3. O resetear la contraseña desde la base de datos\n');
    
  } catch (error) {
    console.error('❌ Error obteniendo credenciales:', error);
    process.exit(1);
  }
}

showCredentials()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });

