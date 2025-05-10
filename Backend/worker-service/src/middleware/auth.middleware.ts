import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import ApiError from '../utils/apiError';
import logger from '../utils/logger';
import { env } from '../config/env';

// Variável para controlar a autenticação (comente para reativar)
const SKIP_AUTH = true; // Defina como false para reativar a autenticação

// Extender a interface Request para incluir o usuário autenticado
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // Pular autenticação se SKIP_AUTH for true
  if (SKIP_AUTH) {
    // Define um usuário padrão para teste
    req.user = {
      id: "123456",
      role: "ADMIN"
    };
    return next();
  }
  
  try {
    // Obter o token do cabeçalho de autorização
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new ApiError(401, 'Token de autenticação não fornecido');
    }
    
    // Verificar se o cabeçalho está no formato correto
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new ApiError(401, 'Token mal formatado');
    }
    
    const token = parts[1];
    
    // Verificar se o token é válido
    if (!token) {
      throw new ApiError(401, 'Token não fornecido');
    }
    
    // Verificar e decodificar o token
    try {
      const secret = env.jwtSecret;
      const decoded = jwt.verify(token, secret) as { id: string; role: string };
      
      // Adicionar usuário decodificado à requisição
      req.user = {
        id: decoded.id,
        role: decoded.role
      };
      
      return next();
    } catch (error) {
      logger.error('Erro ao verificar token JWT:', error);
      throw new ApiError(401, 'Token inválido');
    }
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    return next(new ApiError(500, 'Erro interno no servidor'));
  }
};

// Middleware para verificar permissões
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Usuário não autenticado');
      }
      
      if (!roles.includes(req.user.role)) {
        throw new ApiError(403, 'Acesso negado: permissão insuficiente');
      }
      
      next();
    } catch (error) {
      if (error instanceof ApiError) {
        return next(error);
      }
      return next(new ApiError(500, 'Erro interno no servidor'));
    }
  };
};