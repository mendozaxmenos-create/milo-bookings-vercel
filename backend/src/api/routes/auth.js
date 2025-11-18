import express from 'express';
import { BusinessUser } from '../../../database/models/BusinessUser.js';
import { SystemUser } from '../../../database/models/SystemUser.js';
import { generateToken } from '../../utils/auth.js';
import { validateLogin, validateRegister } from '../../utils/validators.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('[Auth] Login attempt:', {
      hasEmail: !!req.body.email,
      hasBusinessId: !!req.body.business_id,
      hasPhone: !!req.body.phone,
      timestamp: new Date().toISOString(),
    });
    
    const { error, value } = validateLogin(req.body);
    if (error) {
      console.log('[Auth] Login validation error:', error.details[0].message);
      return res.status(400).json({ error: error.details[0].message });
    }

    const { business_id, phone, password, email } = value;

    // Intentar login como super admin primero (si viene email)
    if (email) {
      const systemUser = await SystemUser.findByEmail(email);
      if (systemUser && systemUser.is_active) {
        const isValid = await SystemUser.verifyPassword(systemUser, password);
        if (isValid) {
          const token = generateToken({
            user_id: systemUser.id,
            business_id: null,
            email: systemUser.email,
            role: 'super_admin',
            is_system_user: true,
          });

          return res.json({
            token,
            user: {
              id: systemUser.id,
              business_id: null,
              email: systemUser.email,
              name: systemUser.name,
              role: systemUser.role,
              is_system_user: true,
            },
          });
        }
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Login como business user
    if (!business_id || !phone) {
      console.log('[Auth] Missing business_id or phone for business user login');
      return res.status(400).json({ error: 'business_id and phone are required for business users' });
    }

    console.log('[Auth] Looking for business user:', { business_id, phone });
    const user = await BusinessUser.findByBusinessAndPhone(business_id, phone);
    if (!user) {
      console.log('[Auth] Business user not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('[Auth] Business user found, verifying password...');
    const isValid = await BusinessUser.verifyPassword(user, password);
    if (!isValid) {
      console.log('[Auth] Invalid password for business user');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('[Auth] Login successful for business user:', { user_id: user.id, business_id: user.business_id });

    const token = generateToken({
      user_id: user.id,
      business_id: user.business_id,
      phone: user.phone,
      role: user.role,
      is_system_user: false,
    });

    res.json({
      token,
      user: {
        id: user.id,
        business_id: user.business_id,
        phone: user.phone,
        role: user.role,
        is_system_user: false,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register (solo para desarrollo, en producción debería ser por invitación)
router.post('/register', async (req, res) => {
  try {
    const { error, value } = validateRegister(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { business_id, phone, password, role } = value;

    // Verificar si el usuario ya existe
    const existing = await BusinessUser.findByBusinessAndPhone(business_id, phone);
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const user = await BusinessUser.create({
      business_id,
      phone,
      password,
      role: role || 'staff',
    });

    const token = generateToken({
      user_id: user.id,
      business_id: user.business_id,
      phone: user.phone,
      role: user.role,
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        business_id: user.business_id,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

