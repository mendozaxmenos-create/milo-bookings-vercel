import bcrypt from 'bcrypt';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
export async function seed(knex) {
  // Verificar si ya existe un super admin
  const existing = await knex('system_users').where({ email: 'admin@milobookings.com' }).first();
  
  if (!existing) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    await knex('system_users').insert({
      id: 'super-admin-001',
      email: 'admin@milobookings.com',
      password_hash: passwordHash,
      name: 'Super Administrador',
      role: 'super_admin',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    
    console.log('✅ Super admin creado: admin@milobookings.com / admin123');
  } else {
    console.log('ℹ️ Super admin ya existe');
  }
}

