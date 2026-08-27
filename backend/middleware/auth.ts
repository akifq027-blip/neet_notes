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
  role: 'student' | 'admin';
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
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

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    
    // Check if user still exists and is active
    if (isMySQLConnected()) {
      const pool = getPool();
      if (pool) {
        const [rows]: any = await pool.query(
          'SELECT id, name, email, role, status FROM users WHERE id = ?',
          [decoded.id]
        );
        if (rows.length > 0 && rows[0].status === 'active') {
          req.user = {
            id: rows[0].id,
            name: rows[0].name,
            email: rows[0].email,
            role: rows[0].role,
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
          role: user.role,
        };
      }
    }
  } catch (err) {
    // Invalid or expired token, proceed without user
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
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in as administrator.',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrator privileges required.',
    });
  }

  next();
}
