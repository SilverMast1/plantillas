import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username?: string; // Para usuarios internos (Admin/Vendedor)
    email: string;
    type: 'INTERNAL' | 'CLIENT'; // Identificar si es personal del club o un socio
    roles?: string[]; // Roles asociados para usuarios internos
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'campestre_jwt_secret_token_key_2026_super_strong';

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token de autorización ausente o inválido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

export function requireRoles(rolesPermitidos: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Si el usuario es un cliente externo (socio), no tiene roles de personal
    if (req.user.type === 'CLIENT' && rolesPermitidos.includes('CLIENTE')) {
      return next();
    }

    if (req.user.type === 'INTERNAL' && req.user.roles) {
      const tieneRol = req.user.roles.some((rol) => rolesPermitidos.includes(rol));
      if (tieneRol) {
        return next();
      }
    }

    return res.status(403).json({ error: 'Acceso denegado: permisos insuficientes' });
  };
}
