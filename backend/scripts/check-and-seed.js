/**
 * Script para verificar si hay datos y ejecutar seeds si es necesario
 * Se ejecuta desde docker-entrypoint.sh
 */
import knex from 'knex';
import config from '../knexfile.js';
import { seed as seedDemo } from '../database/seeds/001_demo_data.js';
import { seed as seedSystemUsers } from '../database/seeds/003_system_users.js';

async function checkAndSeed() {
  let db;
  try {
    const environment = process.env.NODE_ENV || 'development';
    db = knex(config[environment]);

    // Verificar si hay negocios en la base de datos
    const businessesCount = await db('businesses').count('* as count').first();
    const count = parseInt(businessesCount?.count || 0, 10);

    console.log(`[SeedCheck] Negocios en la base de datos: ${count}`);

    if (count === 0) {
      console.log('[SeedCheck] No hay datos iniciales, ejecutando seeds...');
      
      // Ejecutar seeds directamente
      await seedDemo(db);
      await seedSystemUsers(db);
      
      console.log('[SeedCheck] ✅ Seeds ejecutados correctamente');
    } else {
      console.log('[SeedCheck] ✅ Ya hay datos en la base de datos, saltando seeds');
    }

    await db.destroy();
    process.exit(0);
  } catch (error) {
    console.error('[SeedCheck] Error:', error);
    if (db) {
      try {
        await db.destroy();
      } catch (e) {
        // Ignore
      }
    }
    // No fallar el deploy si hay error en seeds
    process.exit(0);
  }
}

checkAndSeed();

