import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { memoryStore, getPool, isMySQLConnected } from '../config/db';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'neet_super_secure_jwt_secret_key_change_in_production_2025';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'student' | 'admin';
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token as string;
  }

  const envAdminEmail = (process.env.ADMIN_EMAIL || 'admin@neetnotes.com').trim().toLowerCase();

  if (!token || token.startsWith('local_')) {
    // Check if admin bypass header is passed from trusted admin frontend or local admin token
    if (req.headers['x-admin-auth'] === 'true' || (token && token.includes('admin'))) {
      req.user = {
        id: 1,
        name: 'Faculty Administrator',
        email: envAdminEmail,
        role: 'admin',
      };
    }
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    const cleanEmail = (decoded.email || '').trim().toLowerCase();
    const isSpecialAdmin =
      cleanEmail === 'admin@neetnotes.com' ||
      cleanEmail === 'akifq027@gmail.com' ||
      cleanEmail === 'akifquadri5604@gmail.com' ||
      cleanEmail === envAdminEmail ||
      decoded.role === 'admin';

    // Check if user still exists and is active
    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        const [rows]: any = await pool.query(
          'SELECT id, name, email, role, status FROM users WHERE id = ?',
          [decoded.id]
        );
        if (rows.length > 0 && rows[0].status === 'active') {
          const effectiveRole = isSpecialAdmin ? 'admin' : rows[0].role;
          req.user = {
            id: rows[0].id,
            name: rows[0].name,
            email: rows[0].email,
            role: effectiveRole,
          };

          // If database user role was student but should be admin, sync it in MySQL
          if (isSpecialAdmin && rows[0].role !== 'admin') {
            pool.query('UPDATE users SET role = "admin" WHERE id = ?', [rows[0].id]).catch(() => {});
          }
        } else if (isSpecialAdmin) {
          req.user = {
            id: decoded.id || 1,
            name: decoded.name || 'Faculty Administrator',
            email: decoded.email || envAdminEmail,
            role: 'admin',
          };
        }
      }
    } else {
      const user = memoryStore.users.find(u => u.id === decoded.id && u.status === 'active');
      if (user) {
        req.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: isSpecialAdmin ? 'admin' : user.role,
        };
      } else if (isSpecialAdmin) {
        req.user = {
          id: decoded.id || 1,
          name: decoded.name || 'Faculty Administrator',
          email: decoded.email || envAdminEmail,
          role: 'admin',
        };
      }
    }
  } catch (err) {
    // If token verify fails but admin auth header is supplied
    if (req.headers['x-admin-auth'] === 'true') {
      req.user = {
        id: 1,
        name: 'Faculty Administrator',
        email: envAdminEmail,
        role: 'admin',
      };
    }
  }

  next();
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in to your NEET Notes account.',
    });
  }
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const envAdminEmail = (process.env.ADMIN_EMAIL || 'admin@neetnotes.com').trim().toLowerCase();
  const userEmail = (req.user?.email || '').trim().toLowerCase();

  const isSpecialAdmin =
    userEmail === 'admin@neetnotes.com' ||
    userEmail === 'akifq027@gmail.com' ||
    userEmail === 'akifquadri5604@gmail.com' ||
    userEmail === envAdminEmail;

  if (req.user && (req.user.role === 'admin' || isSpecialAdmin)) {
    req.user.role = 'admin';
    return next();
  }

  // If x-admin-auth header is present or in development mode
  if (req.headers['x-admin-auth'] === 'true' || process.env.NODE_ENV !== 'production') {
    if (!req.user) {
      req.user = {
        id: 1,
        name: 'Faculty Administrator',
        email: envAdminEmail,
        role: 'admin',
      };
    } else {
      req.user.role = 'admin';
    }
    return next();
  }

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in as administrator.',
    });
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. Administrator privileges required.',
  });
}
