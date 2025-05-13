import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import ApiError from '../utils/apiError';
import { TokenPayload } from '../services/authService';

// Estender a interface Request para incluir o usuário
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        permissions?: string[];
      };
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  // Buscar o token no header Authorization
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return next(new ApiError('Token de autenticação não fornecido', 401));
  }
  
  try {
    // Verificar o token
    const decoded = jwt.verify(token, env.jwtSecret) as TokenPayload;
    
    // Adicionar usuário ao objeto de requisição
    req.user = decoded;
    
    next();
  } catch (error) {
    return next(new ApiError('Token inválido ou expirado', 401));
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError('Não autorizado', 401));
    }
    
    const userRole = req.user.role;
    
    if (!roles.includes(userRole)) {
      return next(new ApiError('Acesso negado - permissão insuficiente', 403));
    }
    
    next();
  };
};