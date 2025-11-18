import { Business } from '../../../database/models/Business.js';
import { BusinessSettings } from '../../../database/models/BusinessSettings.js';
import { Service } from '../../../database/models/Service.js';
import { Booking } from '../../../database/models/Booking.js';
import { AvailabilityService } from '../../services/availabilityService.js';
import { PaymentConfigService } from '../../services/paymentConfigService.js';
import { PaymentService } from '../../services/paymentService.js';

export class MessageHandler {
  constructor(bot, businessId) {
    this.bot = bot;
    this.businessId = businessId;
    this.business = null;
    this.settings = null;
    this.userState = new Map(); // Para manejar estados de conversación
  }

  async initialize() {
    await this.reloadSettings();
  }

  // Recargar configuración desde la base de datos
  async reloadSettings() {
    this.business = await Business.findById(this.businessId);
    this.settings = await BusinessSettings.findByBusiness(this.businessId);
  }

  /**
   * Obtiene el número de teléfono real del contacto desde un mensaje de WhatsApp
   * @param {Message} msg - Mensaje de whatsapp-web.js
   * @returns {Promise<string>} - Número de teléfono en formato +XXXXXXXXXX
   */
  async getCustomerPhone(msg) {
    try {
      const fromId = msg.from.split('@')[0];
      
      // Intentar obtener el contacto
      let contact = null;
      try {
        contact = await msg.getContact();
      } catch (err) {
        console.warn(`[MessageHandler] No se pudo obtener contacto para ${fromId}:`, err.message);
      }
      
      // Si el contacto tiene un número válido y no es el mismo ID, usarlo
      if (contact && contact.number && contact.number !== fromId) {
        let phone = contact.number;
        
        // Remover espacios y caracteres especiales
        phone = phone.replace(/[\s\-\(\)]/g, '');
        
        // Verificar que sea un número válido (solo dígitos después de +)
        if (phone.match(/^\+?\d+$/)) {
          // Si no empieza con +, agregarlo
          if (!phone.startsWith('+')) {
            // Si empieza con 0, removerlo (código local)
            if (phone.startsWith('0')) {
              phone = phone.substring(1);
            }
            // Agregar código de país por defecto (Argentina: 54)
            // Si el número tiene 10 dígitos o menos, probablemente es local
            if (!phone.startsWith('54') && phone.length <= 10) {
              phone = `54${phone}`;
            }
            phone = `+${phone}`;
          }
          
          // Validar que el número tenga formato correcto (al menos 10 dígitos)
          if (phone.replace('+', '').length >= 10) {
            console.log(`[MessageHandler] Número obtenido del contacto: ${phone} (desde ${fromId})`);
            return phone;
          }
        }
      }
      
      // Si el ID parece un número de teléfono válido (empieza con código de país conocido)
      // Para Argentina, los números suelen empezar con 54
      if (fromId.startsWith('54') && fromId.length >= 10 && fromId.length <= 13) {
        console.log(`[MessageHandler] Usando ID como número (formato válido): +${fromId}`);
        return `+${fromId}`;
      }
      
      // Intentar obtener el número usando el cliente de WhatsApp
      try {
        // getNumberId puede convertir un ID a número, pero a veces no funciona
        // Intentar obtener información del contacto desde el cliente
        const chats = await this.bot.client.getChats();
        const chat = chats.find(c => c.id._serialized === msg.from);
        
        if (chat && chat.id && chat.id.user) {
          const userId = chat.id.user;
          // Si el user es diferente del fromId y parece un número válido
          if (userId !== fromId && userId.match(/^\d+$/) && userId.length >= 10) {
            // Verificar si empieza con código de país
            if (userId.startsWith('54') || userId.length === 10) {
              const phone = userId.startsWith('54') ? `+${userId}` : `+54${userId}`;
              console.log(`[MessageHandler] Número obtenido del chat: ${phone} (desde ID ${fromId})`);
              return phone;
            }
          }
        }
      } catch (err) {
        console.warn(`[MessageHandler] No se pudo obtener número desde chat para ${fromId}:`, err.message);
      }
      
      // Si el fromId tiene formato de número argentino (10 dígitos sin código de país)
      // o número con código de país (12-13 dígitos)
      if (fromId.match(/^\d+$/) && (fromId.length === 10 || (fromId.length >= 12 && fromId.length <= 13))) {
        if (fromId.length === 10) {
          // Número local, agregar código de país
          console.log(`[MessageHandler] Formateando número local: +54${fromId}`);
          return `+54${fromId}`;
        } else if (fromId.startsWith('54')) {
          // Ya tiene código de país
          console.log(`[MessageHandler] Usando ID con código de país: +${fromId}`);
          return `+${fromId}`;
        }
      }
      
      // Último fallback: devolver el ID con + (aunque puede no ser el número real)
      console.warn(`[MessageHandler] Usando ID como fallback (puede no ser número real): +${fromId}`);
      return `+${fromId}`;
    } catch (error) {
      console.error('[MessageHandler] Error obteniendo número de teléfono:', error);
      // Fallback final
      const fromId = msg.from.split('@')[0];
      return `+${fromId}`;
    }
  }

  async handleMessage(msg) {
    try {
      // Ignorar mensajes de grupos y estados
      if (msg.from.includes('@g.us') || msg.isStatus) {
        return;
      }

      // Ignorar mensajes propios
      if (msg.fromMe) {
        return;
      }

      const from = msg.from;
      const body = msg.body?.toLowerCase().trim() || '';
      const userId = from.split('@')[0];

      console.log(`[MessageHandler] Received message from ${userId}: "${body}"`);

      // Obtener estado del usuario
      const userState = this.userState.get(userId) || { step: 'menu' };

      // Comandos rápidos
      if (body === 'menu' || body === 'inicio' || body === 'start') {
        await this.showMainMenu(msg);
        this.userState.set(userId, { step: 'menu' });
        return;
      }

      // Navegación según estado
      switch (userState.step) {
        case 'menu':
          await this.handleMenuSelection(msg, body, userId);
          break;
        case 'viewing_services':
          await this.handleMenuSelection(msg, body, userId);
          break;
        case 'booking_service':
          await this.handleServiceSelection(msg, body, userId);
          break;
        case 'booking_date':
        case 'booking_date_from_availability':
          await this.handleDateSelection(msg, body, userId);
          break;
        case 'booking_time':
          await this.handleTimeSelection(msg, body, userId);
          break;
        case 'booking_name':
          await this.handleNameInput(msg, body, userId);
          break;
        case 'booking_confirm':
          await this.handleBookingConfirmation(msg, body, userId);
          break;
        default:
          await this.showMainMenu(msg);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      await msg.reply('Lo siento, ocurrió un error. Por favor intenta de nuevo.');
    }
  }

  async showMainMenu(msg) {
    // Recargar settings para obtener los más recientes
    await this.reloadSettings();
    
    const welcomeMessage = this.settings?.welcome_message || 
      `¡Hola! Bienvenido a ${this.business?.name || 'nuestro negocio'}. ¿En qué puedo ayudarte?`;

    const menu = `
${welcomeMessage}

*Menú Principal:*
1️⃣ *Servicios* - Ver servicios disponibles
2️⃣ *Disponibilidad* - Consultar horarios disponibles
3️⃣ *Reservar* - Hacer una reserva
4️⃣ *Mis Reservas* - Ver mis reservas

Escribe el número o el nombre de la opción que deseas.
    `.trim();

    await msg.reply(menu);
  }

  async handleMenuSelection(msg, body, userId) {
    const userState = this.userState.get(userId) || { step: 'menu' };
    
    // Si está viendo servicios y escribe un número, iniciar reserva con ese servicio
    if (userState.step === 'viewing_services') {
      const numberMatch = body.match(/^(\d+)$/);
      if (numberMatch) {
        // Iniciar flujo de reserva con selección de servicio
        await this.handleServiceSelection(msg, body, userId);
        return;
      }
    }
    
    if (body.includes('servicio') || body === '1' || body === '1️⃣') {
      await this.showServices(msg);
      this.userState.set(userId, { step: 'viewing_services' });
    } else if (body.includes('disponibilidad') || body === '2' || body === '2️⃣') {
      await this.showAvailability(msg);
      this.userState.set(userId, { step: 'menu' });
    } else if (body.includes('reservar') || body === '3' || body === '3️⃣') {
      await this.startBookingFlow(msg, userId);
    } else if (body.includes('reserva') || body === '4' || body === '4️⃣') {
      await this.showUserBookings(msg);
      this.userState.set(userId, { step: 'menu' });
    } else {
      await this.showMainMenu(msg);
    }
  }

  async showServices(msg) {
    try {
      const services = await Service.findByBusiness(this.businessId);
      
      if (services.length === 0) {
        await msg.reply('❌ No hay servicios disponibles en este momento.');
        return;
      }

      let message = '📋 *Servicios Disponibles:*\n\n';
      services.forEach((service, index) => {
        message += `${index + 1}️⃣ *${service.name}*\n`;
        if (service.description) {
          message += `   ${service.description}\n`;
        }
        message += `   ⏱️ ${service.duration_minutes} min | 💰 $${service.price.toFixed(2)}\n\n`;
      });

      message += '💡 *Opciones:*\n';
      message += '• Escribe el *número* del servicio para *reservar* (ej: 1, 2, 3)\n';
      message += '• Escribe *"menu"* para volver al menú principal';
      
      await msg.reply(message);
    } catch (error) {
      console.error('Error showing services:', error);
      await msg.reply('Error al obtener servicios. Por favor intenta más tarde.');
    }
  }

  async startBookingFlow(msg, userId) {
    try {
      const services = await Service.findByBusiness(this.businessId);
      
      if (services.length === 0) {
        await msg.reply('❌ No hay servicios disponibles para reservar en este momento.');
        this.userState.set(userId, { step: 'menu' });
        return;
      }

      let message = '📋 *Selecciona un servicio:*\n\n';
      services.forEach((service, index) => {
        message += `${index + 1}️⃣ *${service.name}*\n`;
        if (service.description) {
          message += `   ${service.description}\n`;
        }
        message += `   ⏱️ ${service.duration_minutes} min | 💰 $${service.price.toFixed(2)}\n\n`;
      });

      message += '💡 *Opciones:*\n';
      message += '• Escribe el *número* del servicio (ej: 1, 2, 3)\n';
      message += '• Escribe *"menu"* para volver al inicio';
      
      await msg.reply(message);
      this.userState.set(userId, { step: 'booking_service' });
    } catch (error) {
      console.error('Error starting booking flow:', error);
      await msg.reply('Error al iniciar la reserva. Por favor intenta más tarde.');
    }
  }

  async handleServiceSelection(msg, body, userId) {
    try {
      // Manejar comandos de navegación
      if (body === 'menu' || body === 'inicio' || body === 'cancelar') {
        await this.showMainMenu(msg);
        this.userState.set(userId, { step: 'menu' });
        return;
      }

      const services = await Service.findByBusiness(this.businessId);
      const serviceIndex = parseInt(body) - 1;
      
      if (isNaN(serviceIndex) || serviceIndex < 0 || serviceIndex >= services.length) {
        await msg.reply(
          `❌ Número inválido. Por favor selecciona un número entre 1 y ${services.length}.\n\n` +
          `💡 Escribe *"menu"* para volver al inicio`
        );
        return;
      }

      const selectedService = services[serviceIndex];
      
      // Mostrar disponibilidad de los próximos días para este servicio
      await msg.reply('Consultando disponibilidad... ⏳');
      
      const availability = {};
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysToShow = 7; // Mostrar próximos 7 días

      for (let i = 0; i < daysToShow; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        date.setHours(0, 0, 0, 0);
        // Generar dateStr usando fecha local, no UTC
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        // Obtener horarios disponibles para este día y servicio
        const times = await AvailabilityService.getAvailableTimes(
          this.businessId,
          dateStr,
          selectedService.duration_minutes
        );
        if (times.length > 0) {
          availability[dateStr] = times;
        }
      }

      if (Object.keys(availability).length === 0) {
        await msg.reply(
          `❌ No hay horarios disponibles para *${selectedService.name}* en los próximos ${daysToShow} días.\n\n` +
          `💡 Escribe *"menu"* para volver al inicio`
        );
        return;
      }

      // Guardar servicio seleccionado y disponibilidad
      this.userState.set(userId, {
        step: 'booking_date_from_availability',
        selectedService: selectedService,
        availability: availability, // Guardar disponibilidad para mostrar días
      });

      // Formatear mensaje con disponibilidad
      let message = `✅ Servicio seleccionado: *${selectedService.name}*\n`;
      message += `💰 Precio: $${selectedService.price.toFixed(2)}\n`;
      message += `⏱️ Duración: ${selectedService.duration_minutes} minutos\n\n`;
      message += `📅 *Disponibilidad de los próximos días:*\n\n`;

      const entries = Object.entries(availability).slice(0, daysToShow);
      entries.forEach(([date, times]) => {
        const dateObj = new Date(date);
        const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'short' });
        const day = dateObj.getDate();
        const month = dateObj.toLocaleDateString('es-ES', { month: 'short' });
        
        message += `📅 *${dayName} ${day} ${month}*\n`;
        
        // Mostrar primeros 6 horarios
        const timesToShow = times.slice(0, 6);
        message += `   ${timesToShow.join(' | ')}`;
        if (times.length > 6) {
          message += ` ... (+${times.length - 6} más)`;
        }
        message += `\n\n`;
      });

      message += `💡 *Opciones:*\n`;
      message += `• Escribe la *fecha* para ver todos los horarios y reservar (ej: ${entries[0] ? new Date(entries[0][0]).toLocaleDateString('es-ES', { day: 'numeric', month: 'numeric' }) : '25/12'})\n`;
      message += `• O escribe "mañana" para el día siguiente\n`;
      message += `• Escribe *"volver"* para elegir otro servicio\n`;
      message += `• Escribe *"menu"* para volver al inicio`;

      await msg.reply(message);
    } catch (error) {
      console.error('Error handling service selection:', error);
      await msg.reply('Error al procesar la selección. Por favor intenta de nuevo.');
    }
  }

  async handleDateSelection(msg, body, userId) {
    try {
      const userState = this.userState.get(userId);
      const isFromAvailability = userState.step === 'booking_date_from_availability';

      // Manejar comandos de navegación
      if (body === 'volver' || body === 'atras' || body === 'anterior') {
        if (isFromAvailability) {
          // Volver a mostrar servicios
          await this.showServices(msg);
          this.userState.set(userId, { step: 'viewing_services' });
        } else {
          await this.startBookingFlow(msg, userId);
        }
        return;
      }

      if (body === 'menu' || body === 'inicio' || body === 'cancelar') {
        await this.showMainMenu(msg);
        this.userState.set(userId, { step: 'menu' });
        return;
      }

      let bookingDate = null;
      let dateObj = null;

      // Manejar palabras especiales
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (body.includes('mañana') || body.includes('manana')) {
        dateObj = new Date(today);
        dateObj.setDate(today.getDate() + 1);
        dateObj.setHours(0, 0, 0, 0);
        // Generar bookingDate usando fecha local, no UTC
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        bookingDate = `${year}-${month}-${day}`;
      } else if (body.includes('hoy')) {
        dateObj = new Date(today);
        dateObj.setHours(0, 0, 0, 0);
        // Generar bookingDate usando fecha local, no UTC
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        bookingDate = `${year}-${month}-${day}`;
      } else {
        // Parsear fecha (formato DD/MM/YYYY o DD/MM)
        const dateMatch = body.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
        if (!dateMatch) {
          await msg.reply(
            `❌ Formato de fecha inválido.\n\n` +
            `💡 *Opciones:*\n` +
            `• Escribe la fecha en formato DD/MM/YYYY (ej: 25/12/2024)\n` +
            `• O DD/MM para el año actual (ej: 25/12)\n` +
            `• O escribe "mañana" para el día siguiente\n` +
            `• Escribe *"volver"* para elegir otro servicio\n` +
            `• Escribe *"menu"* para volver al inicio`
          );
          return;
        }

        const [, day, month, year] = dateMatch;
        const currentYear = today.getFullYear();
        const selectedYear = year ? parseInt(year) : currentYear;
        
        bookingDate = `${selectedYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        dateObj = new Date(bookingDate);
      }

      if (!dateObj || isNaN(dateObj.getTime())) {
        await msg.reply('❌ Fecha inválida. Por favor intenta con otro formato.');
        return;
      }

      dateObj.setHours(0, 0, 0, 0);
      if (dateObj < today) {
        await msg.reply('❌ Por favor selecciona una fecha en el futuro. No se pueden hacer reservas para fechas pasadas.');
        return;
      }

      // bookingDate ya debería estar definido en todos los casos
      if (!bookingDate) {
        // Fallback: usar fecha local si por alguna razón no se definió
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        bookingDate = `${year}-${month}-${day}`;
      }

      // userState ya está declarado arriba, reutilizamos
      const { selectedService } = userState;

      // Obtener horarios disponibles para esta fecha
      const availableTimes = await AvailabilityService.getAvailableTimes(
        this.businessId,
        bookingDate,
        selectedService.duration_minutes
      );

      if (availableTimes.length === 0) {
        const formattedDate = dateObj.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'numeric',
          year: 'numeric'
        });
        await msg.reply(
          `❌ Lo siento, no hay horarios disponibles para el ${formattedDate}.\n\n` +
          `💡 *Opciones:*\n` +
          `• Escribe otra fecha (ej: mañana, 25/12)\n` +
          `• Escribe *"volver"* para elegir otro servicio\n` +
          `• Escribe *"menu"* para volver al inicio`
        );
        return;
      }

      // Guardar horarios disponibles en el estado para selección por número
      this.userState.set(userId, {
        ...userState,
        step: 'booking_time',
        bookingDate: bookingDate,
        availableTimes: availableTimes, // Guardar para selección por número
      });

      // Formatear fecha para mostrar - usar bookingDate parseado, no dateObj
      const [year, month, day] = bookingDate.split('-').map(Number);
      const dateObjForDisplay = new Date(year, month - 1, day);
      const formattedDate = dateObjForDisplay.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      // Formatear horarios disponibles con números para selección
      let timeMessage = `📅 *Fecha seleccionada: ${formattedDate}*\n\n`;
      timeMessage += `*Selecciona un horario disponible:*\n\n`;
      
      // Mostrar horarios numerados (máximo 12 para no saturar)
      const timesToShow = availableTimes.slice(0, 12);
      timesToShow.forEach((time, index) => {
        timeMessage += `${index + 1}️⃣ ${time}\n`;
      });
      
      if (availableTimes.length > 12) {
        timeMessage += `\n... y ${availableTimes.length - 12} horarios más\n`;
      }
      
      timeMessage += `\n💡 *Opciones:*\n`;
      timeMessage += `• Escribe el *número* del horario (ej: 1, 2, 3)\n`;
      timeMessage += `• O escribe la *hora* directamente (ej: 14:30)\n`;
      timeMessage += `• Escribe *"volver"* para elegir otra fecha\n`;
      timeMessage += `• Escribe *"menu"* para volver al inicio`;

      await msg.reply(timeMessage);
    } catch (error) {
      console.error('Error handling date selection:', error);
      await msg.reply('Error al procesar la fecha. Por favor intenta de nuevo.');
    }
  }

  async handleTimeSelection(msg, body, userId) {
    try {
      const userState = this.userState.get(userId);
      const { selectedService, bookingDate, availableTimes } = userState;

      // Manejar comandos de navegación
      if (body === 'volver' || body === 'atras' || body === 'anterior') {
        this.userState.set(userId, {
          ...userState,
          step: 'booking_date',
          availableTimes: undefined,
        });
        await msg.reply('Por favor escribe la fecha deseada en formato DD/MM/YYYY\nEjemplo: 25/12/2024');
        return;
      }

      if (body === 'menu' || body === 'inicio' || body === 'cancelar') {
        await this.showMainMenu(msg);
        this.userState.set(userId, { step: 'menu' });
        return;
      }

      let bookingTime = null;

      // Intentar selección por número primero
      const numberMatch = body.match(/^(\d+)$/);
      if (numberMatch && availableTimes && availableTimes.length > 0) {
        const selectedIndex = parseInt(numberMatch[1]) - 1;
        if (selectedIndex >= 0 && selectedIndex < availableTimes.length) {
          bookingTime = availableTimes[selectedIndex];
        } else {
          await msg.reply(
            `❌ Número inválido. Por favor selecciona un número entre 1 y ${availableTimes.length}.\n\n` +
            `O escribe la hora directamente (ej: 14:30)`
          );
          return;
        }
      } else {
        // Intentar parsear como hora (HH:MM)
        const timeMatch = body.match(/(\d{1,2}):(\d{2})/);
        if (!timeMatch) {
          await msg.reply(
            `❌ Formato inválido. Por favor:\n` +
            `• Escribe el *número* del horario (ej: 1, 2, 3)\n` +
            `• O escribe la *hora* en formato HH:MM (ej: 14:30)\n` +
            `• Escribe *"volver"* para elegir otra fecha`
          );
          return;
        }

        const [, hours, minutes] = timeMatch;
        bookingTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
      }

      // Validar que el horario esté disponible
      const isAvailable = await AvailabilityService.isTimeAvailable(
        this.businessId,
        bookingDate,
        bookingTime,
        selectedService.duration_minutes
      );

      if (!isAvailable) {
        await msg.reply(
          `❌ El horario ${bookingTime} no está disponible para esa fecha.\n\n` +
          `Por favor selecciona otro horario o escribe "menu" para volver al inicio.`
        );
        return;
      }

      // Guardar el horario y solicitar nombre
      this.userState.set(userId, {
        ...userState,
        step: 'booking_name',
        bookingTime: bookingTime,
      });

      await msg.reply(
        `✅ Horario *${bookingTime}* disponible\n\n` +
        `👤 *Ahora necesitamos tu nombre:*\n\n` +
        `Por favor escribe tu nombre completo para la reserva.\n\n` +
        `💡 Escribe *"volver"* para elegir otro horario o *"menu"* para volver al inicio`
      );
    } catch (error) {
      console.error('Error handling time selection:', error);
      await msg.reply('Error al procesar la hora. Por favor intenta de nuevo.');
    }
  }

  async handleNameInput(msg, body, userId) {
    try {
      // Manejar comandos de navegación
      if (body === 'volver' || body === 'atras' || body === 'anterior') {
        const userState = this.userState.get(userId);
        const { bookingDate, availableTimes } = userState;
        
        // Volver a mostrar horarios disponibles
        if (availableTimes && availableTimes.length > 0) {
          // Parsear bookingDate (YYYY-MM-DD) y crear Date en zona horaria local
          const [year, month, day] = bookingDate.split('-').map(Number);
          const dateObj = new Date(year, month - 1, day);
          const formattedDate = dateObj.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });

          let timeMessage = `📅 *Fecha seleccionada: ${formattedDate}*\n\n`;
          timeMessage += `*Selecciona un horario disponible:*\n\n`;
          
          const timesToShow = availableTimes.slice(0, 12);
          timesToShow.forEach((time, index) => {
            timeMessage += `${index + 1}️⃣ ${time}\n`;
          });
          
          if (availableTimes.length > 12) {
            timeMessage += `\n... y ${availableTimes.length - 12} horarios más\n`;
          }
          
          timeMessage += `\n💡 *Opciones:*\n`;
          timeMessage += `• Escribe el *número* del horario (ej: 1, 2, 3)\n`;
          timeMessage += `• O escribe la *hora* directamente (ej: 14:30)\n`;
          timeMessage += `• Escribe *"volver"* para elegir otra fecha\n`;
          timeMessage += `• Escribe *"menu"* para volver al inicio`;

          this.userState.set(userId, {
            ...userState,
            step: 'booking_time',
            customerName: undefined,
          });
          await msg.reply(timeMessage);
        } else {
          await msg.reply('Por favor escribe la fecha deseada en formato DD/MM/YYYY\nEjemplo: 25/12/2024');
          this.userState.set(userId, {
            ...userState,
            step: 'booking_date',
            customerName: undefined,
            bookingTime: undefined,
          });
        }
        return;
      }

      if (body === 'menu' || body === 'inicio' || body === 'cancelar') {
        await this.showMainMenu(msg);
        this.userState.set(userId, { step: 'menu' });
        return;
      }

      const customerName = body.trim();
      
      if (customerName.length < 2) {
        await msg.reply(
          `❌ Por favor ingresa un nombre válido (mínimo 2 caracteres).\n\n` +
          `💡 Escribe *"volver"* para elegir otro horario o *"menu"* para volver al inicio`
        );
        return;
      }

      const userState = this.userState.get(userId);
      this.userState.set(userId, {
        ...userState,
        step: 'booking_confirm',
        customerName: customerName,
      });

      const { selectedService, bookingDate, bookingTime } = userState;
      // Parsear bookingDate (YYYY-MM-DD) y crear Date en zona horaria local
      const [year, month, day] = bookingDate.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      const formattedDate = dateObj.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Mostrar resumen y solicitar confirmación
      await msg.reply(
        `📋 *Resumen de tu Reserva:*\n\n` +
        `👤 Nombre: ${customerName}\n` +
        `💼 Servicio: ${selectedService.name}\n` +
        `📅 Fecha: ${formattedDate}\n` +
        `🕐 Hora: ${bookingTime}\n` +
        `⏱️ Duración: ${selectedService.duration_minutes} minutos\n` +
        `💰 Precio: $${selectedService.price.toFixed(2)}\n\n` +
        `¿Confirmas esta reserva? Responde:\n` +
        `✅ *Sí* o *Confirmar* para confirmar\n` +
        `❌ *No* o *Cancelar* para cancelar`
      );
    } catch (error) {
      console.error('Error handling name input:', error);
      await msg.reply('Error al procesar el nombre. Por favor intenta de nuevo.');
    }
  }

  async handleBookingConfirmation(msg, body, userId) {
    try {
      const confirmation = body.toLowerCase().trim();
      const isConfirmed = confirmation === 'sí' || 
                         confirmation === 'si' || 
                         confirmation === 'confirmar' || 
                         confirmation === 'confirmo' ||
                         confirmation === 'yes';

      if (!isConfirmed) {
        await msg.reply('Reserva cancelada. Escribe "menu" para volver al inicio.');
        this.userState.set(userId, { step: 'menu' });
        return;
      }

      const userState = this.userState.get(userId);
      const { selectedService, bookingDate, bookingTime, customerName } = userState;

      // Validar nuevamente disponibilidad antes de crear
      const isAvailable = await AvailabilityService.isTimeAvailable(
        this.businessId,
        bookingDate,
        bookingTime,
        selectedService.duration_minutes
      );

      if (!isAvailable) {
        await msg.reply(
          `❌ Lo siento, el horario ${bookingTime} ya no está disponible.\n\n` +
          `Por favor inicia una nueva reserva escribiendo "reservar" o "menu".`
        );
        this.userState.set(userId, { step: 'menu' });
        return;
      }

      // Crear la reserva
      const customerPhone = await this.getCustomerPhone(msg);
      
      const paymentsEnabled = await PaymentConfigService.isEnabled(this.businessId);

      console.log('[MessageHandler] Creating booking:', {
        business_id: this.businessId,
        service_id: selectedService.id,
        customer_phone: customerPhone,
        customer_name: customerName,
        booking_date: bookingDate,
        booking_time: bookingTime,
        amount: selectedService.price,
        paymentsEnabled,
      });
      
      const booking = await Booking.create({
        business_id: this.businessId,
        service_id: selectedService.id,
        customer_phone: customerPhone,
        customer_name: customerName,
        booking_date: bookingDate,
        booking_time: bookingTime,
        amount: selectedService.price,
        status: paymentsEnabled ? 'pending_payment' : 'pending',
        payment_status: 'pending',
      });
      
      console.log('[MessageHandler] Booking created successfully:', {
        id: booking.id,
        status: booking.status,
        customer_phone: booking.customer_phone,
      });

      if (paymentsEnabled) {
        try {
          const business = this.business || await Business.findById(this.businessId);
          const preference = await PaymentService.createPreference({
            business,
            booking,
            service: selectedService,
          });

          await Booking.update(booking.id, {
            payment_preference_id: preference.id,
            payment_init_point: preference.init_point,
            payment_sandbox_init_point: preference.sandbox_init_point,
          });

          // En v2, init_point puede estar en preference.init_point o preference.sandbox_init_point
          const paymentLink = preference.init_point || preference.sandbox_init_point || preference.init_point;

          await msg.reply(
            `✅ *Reserva registrada*\n\n` +
            `Para confirmar tu turno realiza el pago en el siguiente enlace:\n${paymentLink}\n\n` +
            `Apenas se acredite recibirás la confirmación.`
          );
        } catch (paymentError) {
          console.error('Error creating MercadoPago preference:', paymentError);
          await msg.reply(
            'Registramos tu reserva pero no pudimos generar el link de pago. Intenta nuevamente en unos minutos o contacta al negocio.'
          );
        }

        this.userState.set(userId, { step: 'menu' });
        return;
      }

      // Parsear bookingDate (YYYY-MM-DD) y crear Date en zona horaria local
      const [year, month, day] = bookingDate.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      const formattedDate = dateObj.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Recargar settings para obtener mensaje más reciente
      await this.reloadSettings();
      
      const confirmationMessage = this.settings?.booking_confirmation_message || 
        'Tu reserva ha sido registrada exitosamente.';

      await msg.reply(
        `✅ *¡Reserva Confirmada!*\n\n` +
        `📋 *Detalles:*\n` +
        `👤 Nombre: ${customerName}\n` +
        `💼 Servicio: ${selectedService.name}\n` +
        `📅 Fecha: ${formattedDate}\n` +
        `🕐 Hora: ${bookingTime}\n` +
        `💰 Monto: $${selectedService.price.toFixed(2)}\n\n` +
        `${confirmationMessage}\n\n` +
        `🆔 ID de reserva: ${booking.id}\n\n` +
        `Escribe "menu" para ver más opciones.`
      );

      // Resetear estado
      this.userState.set(userId, { step: 'menu' });
    } catch (error) {
      console.error('Error handling booking confirmation:', error);
      await msg.reply('Error al crear la reserva. Por favor intenta más tarde.');
      this.userState.set(userId, { step: 'menu' });
    }
  }

  async showAvailability(msg) {
    try {
      await msg.reply('Consultando disponibilidad... ⏳');
      
      const availability = await AvailabilityService.getAvailabilityForNextDays(
        this.businessId,
        7 // Próximos 7 días
      );

      if (Object.keys(availability).length === 0) {
        await msg.reply('No hay horarios disponibles en los próximos 7 días.');
        return;
      }

      const message = AvailabilityService.formatAvailabilityMessage(availability, 7);
      await msg.reply(message);
    } catch (error) {
      console.error('Error showing availability:', error);
      await msg.reply('Error al consultar disponibilidad. Por favor intenta más tarde.');
    }
  }

  async showUserBookings(msg) {
    try {
      const customerPhone = await this.getCustomerPhone(msg);
      const bookings = await Booking.findByCustomer(customerPhone);

      if (bookings.length === 0) {
        await msg.reply('No tienes reservas registradas.');
        return;
      }

      let message = '*📋 Tus Reservas:*\n\n';
      bookings.slice(0, 10).forEach((booking, index) => {
        // Parsear booking_date (YYYY-MM-DD) y crear Date en zona horaria local
        const [year, month, day] = booking.booking_date.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        const formattedDate = dateObj.toLocaleDateString('es-ES', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });

        const statusEmoji = {
          'pending': '⏳',
          'confirmed': '✅',
          'cancelled': '❌',
          'completed': '✔️'
        };

        message += `${index + 1}. ${statusEmoji[booking.status] || '📌'} *${booking.service_name}*\n`;
        message += `   📅 ${formattedDate} a las ${booking.booking_time}\n`;
        message += `   💰 $${booking.amount.toFixed(2)}\n`;
        message += `   Estado: ${booking.status === 'pending' ? 'Pendiente' : 
                              booking.status === 'confirmed' ? 'Confirmada' :
                              booking.status === 'cancelled' ? 'Cancelada' :
                              booking.status === 'completed' ? 'Completada' : booking.status}\n\n`;
      });

      message += 'Escribe "menu" para volver al menú principal.';
      await msg.reply(message);
    } catch (error) {
      console.error('Error showing user bookings:', error);
      await msg.reply('Error al obtener tus reservas. Por favor intenta más tarde.');
    }
  }
}

