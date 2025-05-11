import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../../../shared/src/utils/logger';
import { env } from '../config/env';
import * as os from 'os';

// Inicializar logger
const logger = createLogger({ 
  serviceName: 'auth-service',
  customMetadata: { 
    module: 'logging-middleware',
    hostname: os.hostname()
  } 
});

/**
 * Middleware para logging de requisições HTTP
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Gerar ID único para a requisição (para correlação)
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  
  // Definir o ID no header da resposta para correlação
  res.setHeader('X-Request-ID', requestId);
  
  // Registrar o início da requisição
  const startTime = Date.now();
  
  // Informações básicas da requisição
  const requestInfo = {
    id: requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    referer: req.headers.referer,
    // Não incluir userId ainda, será definido depois se autenticado
  };
  
  // Log de início da requisição
  logger.info(`${req.method} ${req.originalUrl} iniciado`, requestInfo);
  
  // Em ambiente de desenvolvimento, logar detalhes adicionais
  if (env.nodeEnv === 'development') {
    // Sanitizar informações sensíveis
    const sanitizedHeaders = { ...req.headers };
    if (sanitizedHeaders.authorization) {
      sanitizedHeaders.authorization = '[REDACTED]';
    }
    if (sanitizedHeaders.cookie) {
      sanitizedHeaders.cookie = '[REDACTED]';
    }
    
    // Sanitizar corpo da requisição
    const sanitizedBody = sanitizeRequestBody(req.body);
    
    logger.debug('Detalhes da requisição', {
      ...requestInfo,
      headers: sanitizedHeaders,
      query: req.query,
      params: req.params,
      body: sanitizedBody
    });
  }
  
  // Interceptar a finalização da resposta para logar o tempo de resposta
  const originalSend = res.send;
  res.send = function(body) {
    // Restaurar a função original
    res.send = originalSend;
    
    // Calcular a duração da requisição
    const duration = Date.now() - startTime;
    
    // Informações da resposta
    const responseInfo = {
      ...requestInfo,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentType: res.getHeader('content-type'),
      contentLength: res.getHeader('content-length'),
      responseTime: duration,
      // Adicionar userId se disponível após processamento
      userId: req.user?.id
    };
    
    // Adicionar cabeçalhos de performance (para métricas no lado do cliente)
    res.setHeader('X-Response-Time', `${duration}ms`);
    
    // Escolher nível de log baseado no status code
    if (res.statusCode >= 500) {
      logger.error(`${req.method} ${req.originalUrl} finalizado - ${res.statusCode} (${duration}ms)`, responseInfo);
      
      // Em desenvolvimento, incluir o corpo da resposta para erros 500
      if (env.nodeEnv === 'development' && typeof body === 'string') {
        try {
          const parsedBody = JSON.parse(body);
          logger.debug('Corpo da resposta de erro:', { 
            error: parsedBody.error || parsedBody 
          });
        } catch (e) {
          // Se não for JSON, ignorar
        }
      }
    } else if (res.statusCode >= 400) {
      logger.warn(`${req.method} ${req.originalUrl} finalizado - ${res.statusCode} (${duration}ms)`, responseInfo);
    } else {
      logger.info(`${req.method} ${req.originalUrl} finalizado - ${res.statusCode} (${duration}ms)`, responseInfo);
    }
    
    // Registrar métricas de performance
    recordPerformanceMetrics(req, res, duration);
    
    // Chamar a função original
    return originalSend.call(this, body);
  };
  
  // Anexar o requestId à requisição para uso nos controladores
  req.requestId = requestId;
  
  // Criar um logger simples para esta requisição - NÃO usar child() para evitar recursão
  // Em vez disso, simplesmente armazenar o requestId que será usado em mensagens de log
  req.logger = requestId;
  
  next();
};

/**
 * Middleware para logging de erros
 */
export const errorLogger = (err: any, req: Request, res: Response, next: NextFunction) => {
  const requestId = req.requestId || 'unknown';
  
  // Formatar o erro para logging
  const errorDetails = {
    name: err.name,
    message: err.message,
    code: err.code || err.statusCode,
    stack: env.nodeEnv === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    requestId
  };
  
  // Erros conhecidos vs. desconhecidos
  const isOperationalError = err.isOperational === true;
  
  if (isOperationalError) {
    // Erro operacional (esperado)
    logger.warn(`Erro operacional: ${err.message}`, errorDetails);
  } else {
    // Erro de programação ou desconhecido (não esperado)
    logger.error(`Erro não operacional: ${err.message}`, errorDetails);
    
    // Em produção, poderia enviar notificação à equipe
    if (env.nodeEnv === 'production') {
      // Enviar alerta, notificação, etc.
    }
  }
  
  // Passar para o próximo middleware de erro
  next(err);
};

/**
 * Middleware para logging de atividade de usuário (login, alterações de senha, etc.)
 */
export const auditLogger = (action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Interceptar o método send para capturar o status da resposta
    const originalSend = res.send;
    res.send = function(body) {
      // Restaurar a função original
      res.send = originalSend;
      
      // Logar apenas se a resposta for bem-sucedida
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const auditInfo = {
          action,
          userId: req.user?.id,
          email: req.user?.email,
          ip: req.ip || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
          timestamp: new Date().toISOString(),
          requestId: req.requestId
        };
        
        // Se for uma ação de login, adicionar informações específicas
        if (action === 'login' && req.body?.email) {
          auditInfo.email = req.body.email;
        }
        
        logger.info(`Ação do usuário: ${action}`, auditInfo);
      }
      
      // Chamar a função original
      return originalSend.call(this, body);
    };
    
    next();
  };
};

// Estender a interface Request para incluir o requestId e o logger
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      logger?: any;
      startTime?: number;
    }
  }
}

/**
 * Sanitiza o corpo da requisição para logging, removendo dados sensíveis
 */
function sanitizeRequestBody(body: any): any {
  if (!body) return undefined;
  
  // Lista de campos sensíveis a serem redatados
  const sensitiveFields = [
    'password', 'senha', 'currentPassword', 'newPassword', 'confirmPassword',
    'token', 'refreshToken', 'accessToken', 'secret', 'apiKey',
    'creditCard', 'cardNumber', 'cvv', 'ccv', 'ssn', 'socialSecurity'
  ];
  
  // Se for string, retornar diretamente
  if (typeof body !== 'object') return body;
  
  // Se for array, sanitizar cada item
  if (Array.isArray(body)) {
    return body.map(item => sanitizeRequestBody(item));
  }
  
  // Clonar o objeto para não modificar o original
  const sanitized = { ...body };
  
  // Substituir campos sensíveis
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  // Verificar objetos aninhados
  for (const [key, value] of Object.entries(sanitized)) {
    if (value && typeof value === 'object') {
      sanitized[key] = sanitizeRequestBody(value);
    }
  }
  
  return sanitized;
}

/**
 * Registra métricas de performance para análise
 */
function recordPerformanceMetrics(req: Request, res: Response, duration: number): void {
  // Aqui você pode integrar com sistema de métricas (Prometheus, etc.)
  // Exemplo: registrar tempo de resposta médio, contagem de requisições, etc.
  
  // Exemplo simples: classificar por endpoint
  const endpoint = req.route?.path || 'unknown';
  const statusCode = res.statusCode.toString();
  const method = req.method;
  
  // Métricas que você pode coletar:
  // - Tempo de resposta por endpoint
  // - Contagem de requisições por endpoint
  // - Taxa de erro por endpoint
  // - Etc.
  
  if (duration > 1000) {
    // Log de alerta para requisições lentas
    logger.warn(`Requisição lenta: ${method} ${endpoint} (${duration}ms)`, {
      method,
      endpoint,
      duration,
      statusCode,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      userId: req.user?.id,
      requestId: req.requestId
    });
  }
}