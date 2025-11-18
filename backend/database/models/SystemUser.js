import db from '../index.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

export class SystemUser {
  static async create(data) {
    const id = data.id || uuidv4();
    const passwordHash = await bcrypt.hash(data.password, 10);
    
    const user = {
      id,
      email: data.email,
      password_hash: passwordHash,
      name: data.name,
      role: data.role || 'super_admin',
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db('system_users').insert(user);
    return this.findById(id);
  }

  static async findById(id) {
    return db('system_users').where({ id }).first();
  }

  static async findByEmail(email) {
    return db('system_users').where({ email }).first();
  }

  static async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password_hash);
  }

  static async update(id, data) {
    const updateData = { ...data };
    if (data.password) {
      updateData.password_hash = await bcrypt.hash(data.password, 10);
      delete updateData.password;
    }
    
    await db('system_users')
      .where({ id })
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      });
    return this.findById(id);
  }

  static async delete(id) {
    return db('system_users').where({ id }).delete();
  }

  static async list() {
    return db('system_users')
      .orderBy('created_at', 'desc');
  }

  static async listActive() {
    return db('system_users')
      .where({ is_active: true })
      .orderBy('created_at', 'desc');
  }
}

