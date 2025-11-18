import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Servicio para gestionar almacenamiento de sesiones de WhatsApp
 * Soporta almacenamiento local y remoto (S3, etc.)
 */
export class SessionStorage {
  constructor(businessId, storageType = 'local') {
    this.businessId = businessId;
    this.storageType = storageType || process.env.SESSION_STORAGE_TYPE || 'local';
    this.sessionPath = this.getSessionPath();
  }

  getSessionPath() {
    // Si hay una variable de entorno que apunta a la sesión de Milo Bot, usarla
    if (process.env.MILO_BOT_SESSION_PATH) {
      console.log(`[SessionStorage] Using Milo Bot session path: ${process.env.MILO_BOT_SESSION_PATH}`);
      return process.env.MILO_BOT_SESSION_PATH;
    }
    
    if (this.storageType === 's3' || this.storageType === 'remote') {
      // Para storage remoto, usar una ruta temporal que se sincronizará
      const basePath = process.env.SESSION_STORAGE_PATH || '/tmp/whatsapp-sessions';
      return path.join(basePath, `business-${this.businessId}`);
    }
    
    // Almacenamiento local
    const basePath = process.env.WHATSAPP_SESSION_PATH || 
                     path.join(__dirname, '../../data/whatsapp-sessions');
    return path.join(basePath, `business-${this.businessId}`);
  }

  async ensureDirectory() {
    try {
      await fs.mkdir(this.sessionPath, { recursive: true });
    } catch (error) {
      console.error(`Error creating session directory: ${error.message}`);
    }
  }

  async saveSession(sessionData) {
    await this.ensureDirectory();
    const sessionFile = path.join(this.sessionPath, 'session.json');
    
    try {
      await fs.writeFile(sessionFile, JSON.stringify(sessionData, null, 2));
      
      // Si está configurado para storage remoto, sincronizar
      if (this.storageType === 's3' && process.env.AWS_S3_BUCKET) {
        await this.syncToS3();
      }
    } catch (error) {
      console.error(`Error saving session: ${error.message}`);
      throw error;
    }
  }

  async loadSession() {
    const sessionFile = path.join(this.sessionPath, 'session.json');
    
    try {
      const data = await fs.readFile(sessionFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // No hay sesión guardada
      }
      console.error(`Error loading session: ${error.message}`);
      return null;
    }
  }

  async deleteSession() {
    try {
      const sessionFile = path.join(this.sessionPath, 'session.json');
      await fs.unlink(sessionFile).catch(() => {}); // Ignorar si no existe
      
      // Limpiar directorio si está vacío
      try {
        const files = await fs.readdir(this.sessionPath);
        if (files.length === 0) {
          await fs.rmdir(this.sessionPath);
        }
      } catch (cleanupError) {
        console.warn(`Session directory cleanup skipped: ${cleanupError.message}`);
      }
    } catch (error) {
      console.error(`Error deleting session: ${error.message}`);
    }
  }

  async syncToS3() {
    // Implementación futura para sincronizar con S3
    // Por ahora, solo log
    if (process.env.AWS_S3_BUCKET) {
      console.log(`[SessionStorage] S3 sync not yet implemented for business ${this.businessId}`);
    }
  }

  getLocalAuthPath() {
    // Retornar el path que whatsapp-web.js espera
    return this.sessionPath;
  }
}

