import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger';
import * as winston from 'winston';
import { env } from '../config/env';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Gerar ou reutilizar o ID da requisição
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  
  // Adicionar o requestId aos headers de resposta
  res.setHeader('X-Request-ID', requestId);
  
  // Armazenar o tempo de início para calcular a duração
  const start = Date.now();
  
  // Informações básicas da requisição
  const requestInfo = {
    id: requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  };
  
  // Criar um logger específico para esta requisição
  const requestLogger = logger.child({
    requestId,
    ...requestInfo,
  });
  
  // Anexar o logger e o requestId à requisição para uso nos controladores
  req.requestId = requestId;
  req.logger = requestLogger;
  
  // Log de início da requisição
  requestLogger.info(`${req.method} ${req.originalUrl} iniciado`);
  
  // Log detalhado em ambiente de desenvolvimento
  if (env.NODE_ENV === 'development') {
    const sanitizedHeaders = { ...req.headers };
    
    // Remover informações sensíveis dos logs
    if (sanitizedHeaders.authorization) {
      sanitizedHeaders.authorization = '[REDACTED]';
    }
    if (sanitizedHeaders.cookie) {
      sanitizedHeaders.cookie = '[REDACTED]';
    }
    
    // Log completo da requisição
    requestLogger.debug('Detalhes da requisição', {
      headers: sanitizedHeaders,
      query: req.query,
      params: req.params,
      // Evitar logging de dados sensíveis no body
      body: req.method !== 'GET' ? sanitizeRequestBody(req.body) : undefined,
    });
  }
  
  // Interceptar a finalização da resposta para logar
  res.on('finish', () => {
    const duration = Date.now() - start;
    const responseInfo = {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    };
    
    const logMethod = res.statusCode >= 400 ? 'warn' : 'info';
    
    requestLogger[logMethod](
      `${req.method} ${req.originalUrl} completado - ${res.statusCode} (${duration}ms)`
    );
    
    // Log detalhado para respostas com erro
    if (res.statusCode >= 400 && env.NODE_ENV === 'development') {
      requestLogger.debug('Detalhes da resposta', responseInfo);
    }
  });
  
  next();
};

// Função para remover dados sensíveis do body
function sanitizeRequestBody(body: any): any {
  if (!body) return undefined;
  
  const sensitiveFields = ['password', 'senha', 'token', 'secret', 'credit_card', 'cartao', 'cvv'];
  const sanitized = { ...body };
  
  // Substituir campos sensíveis
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

// Estender a definição da interface Request para incluir nossos campos
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      logger?: winston.Logger;
      startTime?: number;
    }
  }
}