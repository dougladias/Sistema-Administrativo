import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

// Configurações personalizadas do Helmet
export const helmetMiddleware = helmet({
  contentSecurityPolicy: env.NODE_ENV === 'production', // Habilitar CSP apenas em produção
  crossOriginEmbedderPolicy: env.NODE_ENV === 'production',
  crossOriginOpenerPolicy: env.NODE_ENV === 'production',
  crossOriginResourcePolicy: env.NODE_ENV === 'production',
  dnsPrefetchControl: true,
  frameguard: true,
  hidePoweredBy: true,
  hsts: env.NODE_ENV === 'production',
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: true,
  referrerPolicy: true,
  xssFilter: true,
});

// Middleware para evitar poluição de parâmetros
export const parameterPollutionProtection = (req: Request, res: Response, next: NextFunction) => {
  // Converte arrays para único valor nos query parameters
  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (Array.isArray(value)) {
        req.query[key] = value[value.length - 1];
      }
    }
  }
  next();
};

// Middleware para limitar o tamanho dos payloads
export const payloadSizeLimit = (limit: string = '1mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.headers['content-length'] && parseInt(req.headers['content-length']) > 1048576) { // 1MB
      return res.status(413).json({
        success: false,
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: 'Tamanho da requisição excede o limite permitido',
        },
        timestamp: new Date().toISOString(),
      });
    }
    next();
  };
};

// Middleware para verificar a presença do cabeçalho API Key (quando necessário)
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'MISSING_API_KEY',
        message: 'API Key não fornecida',
      },
      timestamp: new Date().toISOString(),
    });
  }
  
  // Verificar a API Key contra lista de chaves válidas
  if (apiKey !== env.API_KEY) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INVALID_API_KEY',
        message: 'API Key inválida',
      },
      timestamp: new Date().toISOString(),
    });
  }
  
  next();
};