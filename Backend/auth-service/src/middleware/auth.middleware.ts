// Backend/auth-service/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../../../shared/src/utils/apiError';
import { createLogger } from '../../../shared/src/utils/logger';
import { UserRole } from '../../../shared/src/models/user.model';
import authService from '../services/authService';

// Inicializar logger diretamente sem usar child loggers
const logger = createLogger({ 
  serviceName: 'auth-service',
  customMetadata: { module: 'auth-middleware' } 
});

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

/**
 * Middleware para verificar autenticação via token JWT
 * @param requireAuth Se falso, apenas anexa o usuário à requisição se o token for válido, sem bloquear a requisição caso não tenha token
 */
export const authenticate = (requireAuth: boolean = true) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Buscar o token no header Authorization
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        // Se autenticação for obrigatória, retorna erro
        if (requireAuth) {
          return next(ApiError.authentication('Token de autenticação não fornecido'));
        }
        // Se não for obrigatória, continua sem usuário
        return next();
      }
      
      // Formato: Bearer TOKEN
      const parts = authHeader.split(' ');
      
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return next(ApiError.authentication('Formato de token inválido'));
      }
      
      const token = parts[1];
      
      // Verificar o token no serviço
      const result = await authService.validateToken(token);
      
      if (!result.isValid || !result.payload) {
        if (requireAuth) {
          return next(ApiError.authentication('Token inválido ou expirado'));
        }
        return next();
      }
      
      // Anexar usuário à requisição
      req.user = {
        id: result.payload.id,
        email: result.payload.email,
        role: result.payload.role
      };
      
      // Log de autenticação bem-sucedida - use logger diretamente
      logger.debug(`Usuário autenticado: ${req.user.id}, role: ${req.user.role}`);
      
      next();
    } catch (error) {
      // Log de erro - use logger diretamente
      logger.error(`Erro ao autenticar token: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      
      // Verificar tipo de erro do JWT
      if (error instanceof jwt.JsonWebTokenError) {
        return next(ApiError.authentication('Token inválido'));
      }
      
      if (error instanceof jwt.TokenExpiredError) {
        return next(ApiError.authentication('Token expirado'));
      }
      
      if (requireAuth) {
        return next(ApiError.authentication('Falha na autenticação'));
      }
      
      next();
    }
  };
};

/**
 * Middleware para autorização baseada em papéis
 * @param roles Array de papéis permitidos
 */
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.authentication('Usuário não autenticado'));
    }
    
    // Verificar se o usuário tem um dos papéis permitidos
    if (!roles.includes(req.user.role)) {
      // Log de tentativa de acesso não autorizado - use logger diretamente
      logger.warn(`Tentativa de acesso não autorizado: userId=${req.user.id}, role=${req.user.role}, requiredRoles=${roles.join(',')}, path=${req.path}`);
      
      return next(ApiError.authorization(`Acesso negado. Papel necessário: ${roles.join(' ou ')}`));
    }
    
    next();
  };
};

/**
 * Middleware para verificar se o usuário é o mesmo do recurso ou tem papel adequado
 * @param roles Array de papéis alternativos permitidos
 * @param idParam Nome do parâmetro de rota que contém o ID do recurso
 */
export const authorizeOwnerOrRole = (roles: string[], idParam: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.authentication('Usuário não autenticado'));
    }
    
    // Verificar se é o proprietário do recurso
    const resourceId = req.params[idParam];
    const isOwner = resourceId === req.user.id;
    
    // Permitir acesso se for o proprietário ou tiver um dos papéis especificados
    if (isOwner || roles.includes(req.user.role)) {
      return next();
    }
    
    // Log de tentativa de acesso não autorizado - use logger diretamente
    logger.warn(`Tentativa de acesso não autorizado a recurso: userId=${req.user.id}, resourceId=${resourceId}, role=${req.user.role}, path=${req.path}`);
    
    return next(ApiError.authorization('Acesso negado. Você não tem permissão para acessar este recurso.'));
  };
};

/**
 * Middleware para verificar permissões específicas
 * @param permissions Array de permissões necessárias
 * @param requireAll Se verdadeiro, o usuário deve ter todas as permissões. Caso contrário, basta ter uma.
 */
export const checkPermissions = (permissions: string[], requireAll: boolean = true) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.authentication('Usuário não autenticado'));
    }
    
    // Se o usuário for CEO ou ADMIN, permitir acesso irrestrito
    if (req.user.role === UserRole.CEO || req.user.role === UserRole.ADMIN) {
      return next();
    }
    
    try {
      // Buscar permissões do usuário se ainda não estiverem na requisição
      if (!req.user.permissions) {
        const user = await authService.getUserById(req.user.id);
        req.user.permissions = user.permissions || [];
      }
      
      const userPermissions = req.user.permissions || [];
      
      // Verificar permissões
      if (requireAll) {
        // Deve ter todas as permissões
        const hasAllPermissions = permissions.every(permission => 
          userPermissions.includes(permission)
        );
        
        if (!hasAllPermissions) {
          // Log de falta de permissões - use logger diretamente
          logger.warn(`Usuário não tem todas as permissões necessárias: userId=${req.user.id}, userPermissions=${userPermissions.join(',')}, requiredPermissions=${permissions.join(',')}`);
          
          return next(ApiError.authorization('Acesso negado. Permissões insuficientes.'));
        }
      } else {
        // Basta ter uma das permissões
        const hasAnyPermission = permissions.some(permission => 
          userPermissions.includes(permission)
        );
        
        if (!hasAnyPermission) {
          // Log de falta de permissões - use logger diretamente
          logger.warn(`Usuário não tem nenhuma das permissões necessárias: userId=${req.user.id}, userPermissions=${userPermissions.join(',')}, requiredPermissions=${permissions.join(',')}`);
          
          return next(ApiError.authorization('Acesso negado. Permissões insuficientes.'));
        }
      }
      
      next();
    } catch (error) {
      // Log de erro - use logger diretamente
      logger.error(`Erro ao verificar permissões: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      next(error);
    }
  };
};

/**
 * Middleware para verificar token de ativação (usado em fluxos de confirmação de email, reset de senha, etc.)
 */
export const validateActivationToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return next(ApiError.badRequest('Token de ativação não fornecido'));
    }
    
    // Verificar o token
    const decoded = jwt.verify(token, env.jwtSecret) as { 
      id: string; 
      action: string;
      exp: number;
    };
    
    // Verificar se o token ainda não expirou
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      return next(ApiError.badRequest('Token de ativação expirado'));
    }
    
    // Anexar informações do token à requisição
    req.user = {
      id: decoded.id,
      email: '',
      role: '',
      // @ts-ignore
      action: decoded.action // Adicionar ação específica (reset de senha, ativação de conta, etc.)
    };
    
    next();
  } catch (error) {
    // Log de erro - use logger diretamente
    logger.error(`Erro ao validar token de ativação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return next(ApiError.badRequest('Token de ativação inválido'));
    }
    
    next(error);
  }
};