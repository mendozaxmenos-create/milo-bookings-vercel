import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import { MessageHandler } from './handlers/messageHandler.js';
import { SessionStorage } from '../services/sessionStorage.js';
import { saveQRCode } from '../services/qrStorage.js';

export class BookingBot {
  constructor(businessId, whatsappNumber) {
    this.businessId = businessId;
    this.whatsappNumber = whatsappNumber;
    this.sessionStorage = new SessionStorage(businessId);
    
    // Configuración de Puppeteer para entornos cloud
    const puppeteerOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions',
      ],
    };
    
    // Usar ejecutable de Chromium del sistema si está disponible (para Docker/cloud)
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      puppeteerOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    // Usar LocalAuth con path personalizado para sesiones persistentes
    const authStrategy = new LocalAuth({
      clientId: `business-${businessId}`,
      dataPath: this.sessionStorage.getLocalAuthPath(),
    });

    this.client = new Client({
      authStrategy,
      puppeteer: puppeteerOptions,
      webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2413.51.html',
      },
    });
    
    this.messageHandler = new MessageHandler(this, businessId);
  }

  async initialize() {
    console.log(`🚀 [Bot ${this.businessId}] Starting initialization...`);
    console.log(`🚀 [Bot ${this.businessId}] WhatsApp number: ${this.whatsappNumber}`);
    console.log(`🚀 [Bot ${this.businessId}] Session path: ${this.sessionStorage.getLocalAuthPath()}`);
    
    // Setup de eventos
    this.client.on('qr', (qr) => {
      console.log(`\n📱 [Bot ${this.businessId}] QR Code generated:`);
      console.log(`📱 [Bot ${this.businessId}] Escanea este código QR con WhatsApp para conectar el bot\n`);
      console.log(`📱 [Bot ${this.businessId}] QR length: ${qr.length} characters`);
      console.log(`📱 [Bot ${this.businessId}] Timestamp: ${new Date().toISOString()}\n`);
      
      // Guardar QR code para acceso via API
      saveQRCode(this.businessId, qr);
      console.log(`💾 [Bot ${this.businessId}] QR code saved to storage`);
      
      // En producción, también podemos enviar el QR a un webhook o almacenarlo
      if (process.env.QR_WEBHOOK_URL) {
        this.sendQRToWebhook(qr);
      }
      
      // Mostrar QR en consola (útil para desarrollo)
      if (process.env.NODE_ENV !== 'production' || process.env.SHOW_QR === 'true') {
        qrcode.generate(qr, { small: true });
      }
    });

    this.client.on('ready', async () => {
      console.log(`✅ [Bot ${this.businessId}] Bot ready and authenticated!`);
      console.log(`✅ [Bot ${this.businessId}] Client info:`, {
        wid: this.client.info?.wid,
        pushname: this.client.info?.pushname,
        platform: this.client.info?.platform,
      });
      // Limpiar QR cuando el bot está listo
      const { deleteQRCode } = await import('../services/qrStorage.js');
      deleteQRCode(this.businessId);
    });

    this.client.on('authenticated', () => {
      console.log(`🔐 [Bot ${this.businessId}] Bot authenticated successfully!`);
      console.log(`🔐 [Bot ${this.businessId}] Session saved, waiting for ready event...`);
    });

    this.client.on('auth_failure', (msg) => {
      console.error(`❌ [Bot ${this.businessId}] Auth failure:`, msg);
      console.error(`❌ [Bot ${this.businessId}] Error details:`, JSON.stringify(msg, null, 2));
    });

    this.client.on('disconnected', (reason) => {
      console.log(`⚠️ [Bot ${this.businessId}] Bot disconnected. Reason:`, reason);
      console.log(`⚠️ [Bot ${this.businessId}] Disconnection details:`, JSON.stringify(reason, null, 2));
    });

    this.client.on('loading_screen', (percent, message) => {
      console.log(`⏳ [Bot ${this.businessId}] Loading: ${percent}% - ${message}`);
    });

    this.client.on('change_state', (state) => {
      console.log(`🔄 [Bot ${this.businessId}] State changed to: ${state}`);
    });

    this.client.on('message', async (msg) => {
      console.log(`📨 [Bot ${this.businessId}] Message received from ${msg.from}`);
      console.log(`📨 [Bot ${this.businessId}] Message body: "${msg.body?.substring(0, 100)}"`);
      console.log(`📨 [Bot ${this.businessId}] Message type: ${msg.type}`);
      console.log(`📨 [Bot ${this.businessId}] Is from me: ${msg.fromMe}`);
      console.log(`📨 [Bot ${this.businessId}] Is status: ${msg.isStatus}`);
      try {
        await this.messageHandler.handleMessage(msg);
        console.log(`✅ [Bot ${this.businessId}] Message handled successfully`);
      } catch (error) {
        console.error(`❌ [Bot ${this.businessId}] Error handling message:`, error);
        console.error(`❌ [Bot ${this.businessId}] Error stack:`, error.stack);
      }
    });

    try {
      console.log(`🔄 [Bot ${this.businessId}] Calling client.initialize()...`);
      
      // Inicializar con timeout para detectar si se queda colgado
      const initPromise = this.client.initialize();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: client.initialize() took more than 60 seconds')), 60000);
      });
      
      await Promise.race([initPromise, timeoutPromise]);
      console.log(`✅ [Bot ${this.businessId}] Client initialized successfully`);
      
      console.log(`🔄 [Bot ${this.businessId}] Initializing message handler...`);
      await this.messageHandler.initialize();
      console.log(`✅ [Bot ${this.businessId}] Message handler initialized successfully`);
      
      // Verificar estado del cliente inmediatamente después de inicializar
      try {
        const clientInfo = this.client.info;
        if (clientInfo) {
          console.log(`✅ [Bot ${this.businessId}] Client is already authenticated!`);
          console.log(`✅ [Bot ${this.businessId}] Client info:`, {
            wid: clientInfo.wid,
            pushname: clientInfo.pushname,
            platform: clientInfo.platform,
          });
          // Limpiar QR si ya está autenticado
          const { deleteQRCode } = await import('../services/qrStorage.js');
          deleteQRCode(this.businessId);
          console.log(`🗑️ [Bot ${this.businessId}] QR code deleted (bot already authenticated)`);
        } else {
          console.log(`⏳ [Bot ${this.businessId}] Client not authenticated yet, waiting for QR scan...`);
          console.log(`⏳ [Bot ${this.businessId}] QR should be generated soon if not already available`);
        }
      } catch (err) {
        console.log(`⏳ [Bot ${this.businessId}] Client info not available yet (this is normal if waiting for QR)`);
        console.log(`⏳ [Bot ${this.businessId}] Error accessing client.info:`, err.message);
      }
      
      // Esperar un poco para que los eventos se disparen
      console.log(`⏳ [Bot ${this.businessId}] Waiting 3 seconds for events to fire...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verificar estado nuevamente después de esperar
      try {
        const clientInfo = this.client.info;
        if (clientInfo) {
          console.log(`✅ [Bot ${this.businessId}] After wait: Client is authenticated!`);
        } else {
          console.log(`⏳ [Bot ${this.businessId}] After wait: Still waiting for authentication...`);
        }
      } catch (err) {
        console.log(`⏳ [Bot ${this.businessId}] After wait: Client info still not available`);
      }
      
      console.log(`✅ [Bot ${this.businessId}] Initialization complete!`);
    } catch (error) {
      console.error(`❌ [Bot ${this.businessId}] Error during initialization:`, error);
      console.error(`❌ [Bot ${this.businessId}] Error message:`, error.message);
      console.error(`❌ [Bot ${this.businessId}] Error stack:`, error.stack);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.destroy();
      }
    } catch (error) {
      console.error(`Error desconectando bot para ${this.businessId}:`, error);
    }
  }

  /**
   * Elimina la sesión guardada para forzar nueva autenticación
   */
  async clearSession() {
    try {
      // Desconectar primero
      await this.disconnect();
      
      // Eliminar directorio de sesión
      const sessionPath = this.sessionStorage.getLocalAuthPath();
      const fs = await import('fs/promises');
      const path = await import('path');
      
      try {
        await fs.rm(sessionPath, { recursive: true, force: true });
        console.log(`🗑️ Sesión eliminada para negocio ${this.businessId}`);
      } catch (err) {
        // Si el directorio no existe, está bien
        if (err.code !== 'ENOENT') {
          console.warn(`Advertencia al eliminar sesión: ${err.message}`);
        }
      }
    } catch (error) {
      console.error(`Error eliminando sesión para ${this.businessId}:`, error);
    }
  }

  async sendMessage(to, message) {
    try {
      return await this.client.sendMessage(to, message);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async disconnect() {
    await this.client.destroy();
  }

  async sendQRToWebhook(qr) {
    try {
      const response = await fetch(process.env.QR_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: this.businessId,
          qr: qr,
          timestamp: new Date().toISOString(),
        }),
      });
      
      if (!response.ok) {
        console.error(`Failed to send QR to webhook: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error sending QR to webhook: ${error.message}`);
    }
  }
}

