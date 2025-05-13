import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import ApiError from '../utils/apiError';
import logger from '../config/logger';
import { env } from '../config/env';

// Variável para controlar a autenticação (comente para reativar)
const SKIP_AUTH = false; // Defina como false para reativar a autenticação

// Interface para o payload do JWT
interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

// Estender a interface Request para incluir o usuário
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Middleware de autenticação
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // Pular autenticação se SKIP_AUTH for true
  if (SKIP_AUTH) {
    // Define um usuário padrão para teste
    req.user = {
      id: '123456',
      email: 'admin@example.com',
      role: 'ADMIN',
    };
    return next();
  }

  try {
    // Obter o token do header de autorização
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('Authentication required. Please provide a valid token.', 401);
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new ApiError('Authentication token is required', 401);
    }
    
    try {
      // Verificar e decodificar o token
      const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
      
      // Adicionar as informações do usuário à requisição
      req.user = decoded;
      
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError('Invalid token', 401);
      } else if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError('Token expired', 401);
      } else {
        throw error;
      }
    }
  } catch (error) {
    next(error);
  }
};

// Middleware de autorização baseado em roles
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ApiError('Authentication required', 401);
      }
      
      if (!roles.includes(req.user.role)) {
        throw new ApiError('Insufficient permissions', 403);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};