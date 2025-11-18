import db from '../index.js';
import { v4 as uuidv4 } from 'uuid';

export class Business {
  static async create(data) {
    const id = data.id || uuidv4();
    const now = new Date();
    
    // Calcular fechas de trial si se solicita
    let trialStartDate = null;
    let trialEndDate = null;
    if (data.is_trial) {
      trialStartDate = now.toISOString();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 7); // 7 días de prueba
      trialEndDate = endDate.toISOString();
    }
    
    const business = {
      id,
      name: data.name,
      phone: data.phone,
      email: data.email,
      whatsapp_number: data.whatsapp_number,
      owner_phone: data.owner_phone,
      is_active: data.is_active ?? true,
      is_trial: data.is_trial ?? false,
      trial_start_date: trialStartDate,
      trial_end_date: trialEndDate,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    await db('businesses').insert(business);
    return this.findById(id);
  }

  static async findById(id) {
    return db('businesses').where({ id }).first();
  }

  static async findByPhone(phone) {
    return db('businesses').where({ phone }).first();
  }

  static async findByWhatsAppNumber(whatsappNumber) {
    return db('businesses').where({ whatsapp_number: whatsappNumber }).first();
  }

  static async update(id, data) {
    await db('businesses')
      .where({ id })
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      });
    return this.findById(id);
  }

  static async delete(id) {
    return db('businesses').where({ id }).delete();
  }

  static async list(limit = 100, offset = 0, includeInactive = false) {
    let query = db('businesses');
    
    if (!includeInactive) {
      query = query.where({ is_active: true });
    }
    
    return query
      .limit(limit)
      .offset(offset)
      .orderBy('created_at', 'desc');
  }
  
  static async findAllWithTrials() {
    return db('businesses')
      .where({ is_trial: true })
      .whereNotNull('trial_end_date')
      .orderBy('created_at', 'desc');
  }

  static async findAllActive() {
    return db('businesses')
      .where({ is_active: true })
      .orderBy('created_at', 'desc');
  }
}

