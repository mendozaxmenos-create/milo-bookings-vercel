import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production';

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.warn('JWT verification failed:', error.message);
    return null;
  }
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    console.log('[Auth] No token provided for:', req.path);
    return res.status(401).json({ error: 'No token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    console.log('[Auth] Invalid or expired token for:', req.path);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  console.log('[Auth] Authenticated user:', {
    path: req.path,
    user_id: decoded.user_id,
    business_id: decoded.business_id,
    role: decoded.role,
    is_system_user: decoded.is_system_user,
  });

  req.user = decoded;
  next();
}

/**
 * Middleware para verificar que el usuario es super admin
 */
export function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'super_admin' || !req.user.is_system_user) {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
}

