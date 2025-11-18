import db from '../index.js';

export class SystemConfig {
  static async get(key) {
    const config = await db('system_config').where({ key }).first();
    return config ? config.value : null;
  }

  static async set(key, value, description = null) {
    const existing = await db('system_config').where({ key }).first();
    
    if (existing) {
      await db('system_config')
        .where({ key })
        .update({
          value,
          description: description || existing.description,
          updated_at: new Date().toISOString(),
        });
    } else {
      await db('system_config').insert({
        key,
        value,
        description,
        updated_at: new Date().toISOString(),
      });
    }
    
    return this.get(key);
  }

  static async getAll() {
    return db('system_config').orderBy('key');
  }

  static async delete(key) {
    return db('system_config').where({ key }).delete();
  }
}

