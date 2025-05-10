import { Request, Response, NextFunction } from 'express';
import { ApiResponse, ErrorCode } from '../utils/response.utils';
import { logger } from '../config/logger';
import { env } from '../config/env';

// Classe base para erros da API
export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: any;

  constructor(message: string, statusCode: number = 500, code: string = ErrorCode.INTERNAL_ERROR, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Classe para erros de validação
export class ValidationError extends ApiError {
  constructor(message: string = 'Erro de validação', details?: any) {
    super(message, 422, ErrorCode.VALIDATION_ERROR, details);
  }
}

// Classe para recursos não encontrados
export class NotFoundError extends ApiError {
  constructor(message: string = 'Recurso não encontrado') {
    super(message, 404, ErrorCode.RESOURCE_NOT_FOUND);
  }
}

// Classe para erros de autenticação
export class AuthenticationError extends ApiError {
  constructor(message: string = 'Não autenticado') {
    super(message, 401, ErrorCode.AUTHENTICATION_ERROR);
  }
}

// Classe para erros de autorização
export class AuthorizationError extends ApiError {
  constructor(message: string = 'Não autorizado') {
    super(message, 403, ErrorCode.AUTHORIZATION_ERROR);
  }
}

// Middleware de tratamento de erros
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = err.statusCode || 500;
  let errorCode = err.code || ErrorCode.INTERNAL_ERROR;
  let message = err.message || 'Erro interno do servidor';
  let details = err.details;

  // Obter o ID da requisição
  const requestId = req.requestId || 'unknown';

  // Log do erro
  const logError = {
    requestId,
    statusCode,
    errorCode,
    message,
    details: env.NODE_ENV === 'production' ? undefined : details,
    stack: env.NODE_ENV === 'production' ? undefined : err.stack,
    path: req.path,
    method: req.method,
  };

  if (statusCode >= 500) {
    logger.error(`Erro no processamento da requisição: ${message}`, logError);
  } else {
    logger.warn(`Erro cliente: ${message}`, logError);
  }

  // Mapeamento de erros comuns
  if (err.name === 'SyntaxError' && err.message.includes('JSON')) {
    statusCode = 400;
    errorCode = ErrorCode.VALIDATION_ERROR;
    message = 'JSON inválido na requisição';
  }

  // Erros do Axios (requisições para microsserviços)
  if (err.isAxiosError) {
    const axiosResponse = err.response;
    if (axiosResponse) {
      statusCode = axiosResponse.status;
      message = axiosResponse.data?.error?.message || 'Erro no serviço';
      errorCode = axiosResponse.data?.error?.code || ErrorCode.SERVICE_UNAVAILABLE;
      details = axiosResponse.data?.error?.details;
    } else {
      statusCode = 503;
      errorCode = ErrorCode.SERVICE_UNAVAILABLE;
      message = 'Serviço temporariamente indisponível';
    }
  }

  // Tratamento de erros de timeout
  if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
    statusCode = 504;
    errorCode = ErrorCode.SERVICE_UNAVAILABLE;
    message = 'Tempo limite de resposta excedido';
  }

  // Em produção, não expor detalhes internos de erros 500
  if (env.NODE_ENV === 'production' && statusCode >= 500) {
    details = undefined;
    message = 'Erro interno do servidor';
  }

  // Enviar resposta de erro padronizada
  return ApiResponse.error(
    res,
    errorCode,
    message,
    statusCode,
    details,
    requestId
  );
};