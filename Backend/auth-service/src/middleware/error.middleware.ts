import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../../../shared/src/utils/logger';
import { ApiError, ErrorCode } from '../../../shared/src/utils/apiError';
import { env } from '../config/env';
import { ZodError } from 'zod';

const logger = createLogger({ 
  serviceName: 'auth-service',
  customMetadata: { module: 'error-middleware' } 
});

/**
 * Middleware para tratamento de erros da API
 */
export const errorHandler = (
  err: Error | ApiError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Definir valores padrão
  let statusCode = 500;
  let errorCode = ErrorCode.INTERNAL_ERROR;
  let message = 'Erro interno do servidor';
  let details: any = undefined;
  
  // Log detalhado do erro
  logger.error(`${req.method} ${req.path} - Erro:`, { 
    error: err.message, 
    stack: err.stack,
    userId: req.user?.id 
  });
  
  // Mapeamento de erros conhecidos
  
  // ApiError (nossos erros personalizados)
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
    details = err.details;
  }
  // Erros de validação do Zod
  else if (err instanceof ZodError) {
    statusCode = 422;
    errorCode = ErrorCode.VALIDATION_ERROR;
    message = 'Erro de validação de dados';
    
    // Formatar detalhes dos erros
    details = err.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message
    }));
  }
  // Erros de JWT
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = ErrorCode.AUTHENTICATION_ERROR;
    message = 'Token inválido';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = ErrorCode.AUTHENTICATION_ERROR;
    message = 'Token expirado';
  }
  // Erros do Mongoose
  else if (err.name === 'ValidationError') {
    statusCode = 422;
    errorCode = ErrorCode.VALIDATION_ERROR;
    message = 'Erro de validação do banco de dados';
    details = err.message;
  }
  else if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = ErrorCode.INVALID_REQUEST;
    message = 'ID inválido ou mal formatado';
  }
  else if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    statusCode = 409;
    errorCode = ErrorCode.RESOURCE_ALREADY_EXISTS;
    message = 'Recurso já existe';
    
    // Extrair detalhes sobre o campo duplicado
    const keyValue = (err as any).keyValue;
    if (keyValue) {
      details = keyValue;
    }
  }
  
  // Em produção, ocultar detalhes de erros internos
  if (env.nodeEnv === 'production' && statusCode >= 500) {
    details = undefined;
  }
  
  // Enviar resposta de erro
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      details
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * Middleware para capturar rotas não encontradas
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  logger.warn(`Rota não encontrada: ${req.method} ${req.originalUrl}`);
  
  res.status(404).json({
    success: false,
    error: {
      code: ErrorCode.RESOURCE_NOT_FOUND,
      message: `Rota não encontrada: ${req.method} ${req.originalUrl}`
    },
    timestamp: new Date().toISOString()
  });
};