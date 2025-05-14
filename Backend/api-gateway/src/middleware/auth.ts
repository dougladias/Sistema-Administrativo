import { Request, Response, NextFunction } from 'express';
import jwt, { Secret } from 'jsonwebtoken';
import { env } from '../config/env';
import logger from '../utils/logger';
import { formatErrorResponse } from '../utils/response.utils';


// Interface que representa o payload do token JWT
interface TokenPayload {
  id: string;
  role: string;  
}

// Interface que representa o formato do erro de resposta
export interface AuthRequest extends Request {
  user?: any;
}

// Middleware de autenticação que verifica se o token JWT é válido
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): any {
  try {
    const authHeader = req.headers.authorization;
    
    // Log para depuração
    logger.debug(`Auth header: ${authHeader ? 'presente' : 'ausente'}`);
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Autenticação necessária',
          code: 'UNAUTHORIZED'
        }
      });
    }
    
    // Verifica se o header de autorização está no formato correto
    const [type, token] = authHeader.split(' ');
    
    // Log para depuração
    logger.debug(`Auth type: ${type}, Token existe: ${!!token}`);
    
    if (type !== 'Bearer' || !token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Formato de token inválido',
          code: 'INVALID_TOKEN_FORMAT'
        }
      });
    }
    
    try {
      // Log para depuração da chave secreta (apenas desenvolvimento)
      logger.debug(`JWT_SECRET length: ${env.JWT_SECRET?.length || 0}`);
      
      const decoded = jwt.verify(token, env.JWT_SECRET as Secret) as TokenPayload;
      req.user = decoded;
      next();
    } catch (error) {
      // Log mais detalhado do erro
      logger.warn(`Falha de autenticação: ${(error as Error).message}`, { error });
      
      // Resposta de erro com código 401
      return res.status(401).json({
        success: false,
        error: {
          message: 'Token inválido',
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  } catch (error) {
    logger.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno de autenticação',
        code: 'INTERNAL_SERVER_ERROR'
      }
    });
  }
}


// Middleware que verifica se o usuário tem um determinado papel
export const hasRole = (roles: string | string[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json(formatErrorResponse('Usuário não autenticado'));
    }
    
    const userRole = req.user.role;
     
    // Log para depuração
    if (!userRole || !allowedRoles.includes(userRole)) {
      logger.warn(`Acesso negado: usuário ${req.user.id} com papel ${userRole} tentou acessar rota que requer ${allowedRoles.join(' ou ')}`);
      return res.status(403).json(formatErrorResponse('Acesso negado'));
    }
    
    return next();
  };
};