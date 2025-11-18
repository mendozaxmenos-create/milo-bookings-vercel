import Joi from 'joi';

export const validateBusiness = (data, isUpdate = false) => {
  const schema = Joi.object({
    name: isUpdate ? Joi.string().min(1).max(255).optional() : Joi.string().min(1).max(255).required(),
    phone: isUpdate ? Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional() : Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
    email: Joi.string().email().optional().allow('', null),
    whatsapp_number: isUpdate ? Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional() : Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
    owner_phone: isUpdate ? Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional() : Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
    is_active: Joi.boolean().optional(),
    is_trial: Joi.boolean().optional(),
  });

  return schema.validate(data);
};

export const validateService = (data, isUpdate = false) => {
  const schema = Joi.object({
    name: isUpdate ? Joi.string().min(1).max(255).optional() : Joi.string().min(1).max(255).required(),
    description: Joi.string().max(1000).optional().allow('', null),
    duration_minutes: isUpdate ? Joi.number().integer().min(1).max(1440).optional() : Joi.number().integer().min(1).max(1440).required(),
    price: isUpdate ? Joi.number().min(0).precision(2).optional() : Joi.number().min(0).precision(2).required(),
    display_order: Joi.number().integer().min(0).optional(),
    is_active: Joi.boolean().optional(),
  });

  return schema.validate(data);
};

export const validateBooking = (data, isUpdate = false) => {
  const schema = Joi.object({
    service_id: isUpdate ? Joi.string().uuid().optional() : Joi.string().uuid().required(),
    customer_phone: isUpdate ? Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional() : Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
    customer_name: Joi.string().max(255).optional().allow('', null),
    booking_date: isUpdate ? Joi.date().iso().optional() : Joi.date().iso().required(),
    booking_time: isUpdate ? Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional() : Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).required(),
    status: Joi.string().valid('pending', 'pending_payment', 'confirmed', 'cancelled', 'completed').optional(),
    payment_status: Joi.string().valid('pending', 'paid', 'refunded').optional(),
    payment_id: Joi.string().optional().allow('', null),
    amount: isUpdate ? Joi.number().min(0).precision(2).optional() : Joi.number().min(0).precision(2).required(),
    notes: Joi.string().max(1000).optional().allow('', null),
  });

  return schema.validate(data);
};

export const validateLogin = (data) => {
  // Para super admin: email + password
  // Para business user: business_id + phone + password
  const schema = Joi.object({
    email: Joi.string().email().optional(),
    business_id: Joi.string().when('email', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required(),
    }),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).when('email', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required(),
    }),
    password: Joi.string().min(6).required(),
  }).or('email', 'business_id');

  return schema.validate(data);
};

export const validateRegister = (data) => {
  const schema = Joi.object({
    business_id: Joi.string().required(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('owner', 'admin', 'staff').optional(),
  });

  return schema.validate(data);
};

export const validatePaymentConfig = (data) => {
  const schema = Joi.object({
    accessToken: Joi.string().min(10).required(),
    publicKey: Joi.string().min(10).required(),
    refreshToken: Joi.string().optional().allow('', null),
    userId: Joi.string().optional().allow('', null),
    isActive: Joi.boolean().optional(),
  });

  return schema.validate(data);
};

