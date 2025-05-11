import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, z } from 'zod';
import { createLogger } from '../../../shared/src/utils/logger';
import { ApiError, ErrorCode } from '../../../shared/src/utils/apiError';
import mongoose from 'mongoose';

// Inicializar logger
const logger = createLogger({ 
  serviceName: 'auth-service',
  customMetadata: { module: 'validation-middleware' } 
});

/**
 * Middleware para validar corpo da requisição com Zod
 * @param schema - Schema Zod para validação
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validar o corpo da requisição com o schema fornecido
      const validatedData = schema.parse(req.body);
      
      // Substituir o corpo da requisição com os dados validados
      req.body = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Erro de validação do corpo da requisição:', { 
          path: req.path,
          errors: error.errors
        });
        
        // Formatar erros para uma resposta amigável
        const formattedErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        next(ApiError.validation('Erro de validação de dados', formattedErrors));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Middleware para validar parâmetros de query com Zod
 * @param schema - Schema Zod para validação
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validar os parâmetros de query com o schema fornecido
      const validatedData = schema.parse(req.query);
      
      // Substituir os parâmetros de query com os dados validados
      req.query = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Erro de validação de query:', { 
          path: req.path,
          errors: error.errors
        });
        
        const formattedErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        next(ApiError.validation('Erro de validação de parâmetros de query', formattedErrors));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Middleware para validar parâmetros de rota com Zod
 * @param schema - Schema Zod para validação
 */
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validar os parâmetros de rota com o schema fornecido
      const validatedData = schema.parse(req.params);
      
      // Substituir os parâmetros de rota com os dados validados
      req.params = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Erro de validação de parâmetros:', { 
          path: req.path,
          errors: error.errors
        });
        
        const formattedErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        next(ApiError.validation('Erro de validação de parâmetros de rota', formattedErrors));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Schema Zod para validação de ID do MongoDB
 */
export const mongoIdSchema = z.string().refine(
  (id) => mongoose.Types.ObjectId.isValid(id),
  {
    message: 'ID inválido ou mal formatado'
  }
);

/**
 * Middleware para validar IDs do MongoDB
 * @param paramName - Nome do parâmetro que contém o ID (default: 'id')
 */
export const validateMongoId = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params[paramName];
      
      if (!id) {
        return next(ApiError.badRequest(`Parâmetro '${paramName}' não fornecido`));
      }
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(ApiError.badRequest(`ID '${id}' inválido ou mal formatado`));
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware para sanitizar entrada (prevenir XSS, etc)
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Funções de sanitização
    const sanitizeString = (str: string): string => {
      if (typeof str !== 'string') return str;
      
      // Substituir caracteres especiais HTML para prevenir XSS
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    };
    
    const sanitizeObject = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;
      
      // Sanitizar cada propriedade do objeto
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Pular sanitização de senha e campos sensíveis
        if (['password', 'newPassword', 'currentPassword', 'confirmPassword'].includes(key)) {
          sanitized[key] = value;
          continue;
        }
        
        if (typeof value === 'string') {
          sanitized[key] = sanitizeString(value);
        } else if (Array.isArray(value)) {
          sanitized[key] = value.map(item => {
            if (typeof item === 'string') return sanitizeString(item);
            if (typeof item === 'object') return sanitizeObject(item);
            return item;
          });
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
      
      return sanitized;
    };
    
    // Sanitizar body, query e params
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }
    
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }
    
    next();
  } catch (error) {
    logger.error('Erro ao sanitizar entrada:', error);
    next(error);
  }
};

/**
 * Schema comum para parâmetros de paginação
 */
export const paginationSchema = z.object({
  page: z.preprocess(
    (val) => parseInt(val as string, 10),
    z.number().positive().default(1)
  ),
  limit: z.preprocess(
    (val) => parseInt(val as string, 10),
    z.number().positive().max(100).default(10)
  ),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('asc')
}).passthrough();

/**
 * Middleware para validar e processar parâmetros de paginação
 */
export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, sort, order } = paginationSchema.parse(req.query);
    
    // Adicionar parâmetros processados à requisição
    req.query = {
      ...req.query,
      page: String(page),
      limit: String(limit),
      sort,
      order
    };
    
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message
      }));
      
      next(ApiError.validation('Erro de validação de parâmetros de paginação', formattedErrors));
    } else {
      next(error);
    }
  }
};

/**
 * Middleware para verificar campos obrigatórios
 * @param fields - Array de campos obrigatórios
 * @param location - Local onde os campos devem estar (body, query, params)
 */
export const requireFields = (fields: string[], location: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[location];
      const missingFields = fields.filter(field => !data[field]);
      
      if (missingFields.length > 0) {
        return next(ApiError.badRequest(`Campos obrigatórios não fornecidos: ${missingFields.join(', ')}`));
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};