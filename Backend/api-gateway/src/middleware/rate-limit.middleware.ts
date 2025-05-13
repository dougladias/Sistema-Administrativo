import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import { env } from '../config/env';
import { ApiResponse, ErrorCode } from '../utils/response.utils';
import { logger } from '../config/logger';

// Opções de configuração Redis (se estiver usando)
const redisOptions = {
  host: env.REDIS_HOST || 'localhost',
  port: parseInt((env.REDIS_PORT || '6379').toString()),
  password: env.REDIS_PASSWORD,
  database: parseInt(env.REDIS_DB || '0'),
};

// Criar store baseado no ambiente
let store: any;
if (env.NODE_ENV === 'production' && env.REDIS_HOST) {
  try {
    const redisClient = createClient({
      url: `redis://${redisOptions.password ? `:${redisOptions.password}@` : ''}${redisOptions.host}:${redisOptions.port}/${redisOptions.database}`,
    });
    
    redisClient.on('error', (err) => {
      logger.error('Erro na conexão Redis para rate limiting:', err);
    });
    
    store = new RedisStore({
      sendCommand: (...args: string[]) => redisClient.sendCommand(args),
      prefix: 'ratelimit:',
    });
    
    logger.info('Rate limiter configurado com Redis');
  } catch (error) {
    logger.error('Falha ao configurar Redis para rate limiting, usando armazenamento em memória');
    store = undefined;
  }
}

// Configuração padrão de rate limiting
export const defaultRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS || 60 * 1000, // 1 minuto por padrão   
  standardHeaders: true, // Inclui 'RateLimit-*' headers
  legacyHeaders: false, // Desativa cabeçalhos 'X-RateLimit-*'
  store, // Usar Redis em produção, memória em desenvolvimento
  // Função de chave de identificação (IP por padrão)
  keyGenerator: (req) => {
    // Priorizar cabeçalho IP X-Forwarded-For para uso com proxies
    const ip = req.headers['x-forwarded-for'] || 
               req.socket.remoteAddress || 
               'unknown';
    return `${ip}`;
  },
  // Handler personalizado
  handler: (req, res) => {
    const requestId = req.requestId || 'unknown';
    logger.warn(`Rate limit excedido para: ${req.ip}`, { requestId });
    
    return ApiResponse.error(
      res,
      'RATE_LIMIT_EXCEEDED',
      'Limite de requisições excedido. Por favor, tente novamente mais tarde.',
      429,
      {
        retryAfter: Math.ceil(((env.RATE_LIMIT_WINDOW_MS ?? 60000) as number) / 1000),
      },
      requestId
    );
  },
  skip: (req) => {
    // Ignorar healthchecks
    return req.path === '/health' || req.path === '/api/health';
  },
});

// Rate limiter mais restritivo para rotas de autenticação
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 tentativas por 15 minutos
  standardHeaders: true,
  legacyHeaders: false,
  store,
  keyGenerator: (req) => {
    // Usar email ou username para limitar tentativas por usuário
    const identifier = req.body.email || req.body.username || req.ip;
    return `auth:${identifier}`;
  },
  handler: (req, res) => {
    const requestId = req.requestId || 'unknown';
    logger.warn(`Rate limit de autenticação excedido para: ${req.body.email || req.ip}`, { requestId });
    
    return ApiResponse.error(
      res,
      'RATE_LIMIT_EXCEEDED',
      'Muitas tentativas de login. Por favor, tente novamente mais tarde.',
      429,
      {
        retryAfter: Math.ceil(15 * 60),
      },
      requestId
    );
  },
});

// Rate limiter para APIs sensíveis
export const sensitiveRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50, // 50 requisições por hora
  standardHeaders: true,
  legacyHeaders: false,
  store,
  handler: (req, res) => {
    const requestId = req.requestId || 'unknown';
    
    return ApiResponse.error(
      res,
      'RATE_LIMIT_EXCEEDED',
      'Limite de requisições para operações sensíveis excedido.',
      429,
      {
        retryAfter: Math.ceil(60 * 60),
      },
      requestId
    );
  },
});

// Limiter padrão para rotas da API
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutos por padrão
  max: env.RATE_LIMIT_MAX || 100, // limite de 100 requisições por janela
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Muitas requisições, por favor tente novamente mais tarde',
  }
});

// Limiter específico para rotas de autenticação (mais restritivo)
export const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
  max: env.AUTH_RATE_LIMIT_MAX || 10, // limite mais restrito para tentativas de login
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Muitas tentativas de autenticação, por favor tente novamente mais tarde',
  }
});

// Você pode adicionar outros limitadores específicos conforme necessário