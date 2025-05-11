import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.utils';

// Interface para estender o objeto Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      }
    }
  }
}

export function authenticate(options: { optional?: boolean } = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        if (options.optional) {
          return next(); // Continuar sem usuário se for opcional
        }
        return res.status(401).json({ 
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Token de autenticação não fornecido'
          },
          timestamp: new Date().toISOString()
        });
      }
      
      const parts = authHeader.split(' ');
      
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ 
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Formato de token inválido'
          },
          timestamp: new Date().toISOString()
        });
      }
      
      const token = parts[1];
      const decoded = verifyToken(token);
      
      req.user = decoded;
      next();
    } catch (error) {
      if (options.optional) {
        return next(); // Continuar sem usuário se for opcional
      }
      
      return res.status(401).json({ 
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Token inválido ou expirado'
        },
        timestamp: new Date().toISOString()
      });
    }
  };
}

// Middleware para verificar papéis/permissões
export function authorize(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Usuário não autenticado'
        },
        timestamp: new Date().toISOString()
      });
    }
    
    if (roles.includes(req.user.role)) {
      next();
    } else {
      return res.status(403).json({ 
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Acesso não autorizado'
        },
        timestamp: new Date().toISOString()
      });
    }
  };
}