import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import logger from '../utils/logger';
import { formatErrorResponse } from '../utils/response.utils';


// Configuração padrão do limitador de taxa de requisições
export const apiLimiter = rateLimit({
  windowMs: env.API_RATE_LIMIT_WINDOW_MS,
  max: env.API_RATE_LIMIT, 
  standardHeaders: true,
  legacyHeaders: false, 
  skipSuccessfulRequests: false, 
  
  // Função personalizada para respostas de limite excedido
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit excedido para ${req.ip} em ${req.method} ${req.originalUrl}`);
    
    res.status(options.statusCode).json(formatErrorResponse(
      'Limite de requisições excedido. Por favor, tente novamente mais tarde.',
      'TOO_MANY_REQUESTS'
    ));
  },
  
  // Função para identificar requisições (por padrão usa IP)
  keyGenerator: (req, res) => {    
    return req.ip + ((req as any).user?.id ? `:${(req as any).user.id}` : '');
  },
  
  // Função para pular o rate limit para certas requisições (ex: admins)
  skip: (req, res) => {
    // Se não estiver habilitado, pula sempre
    if (!env.ENABLE_RATE_LIMIT) return true;
    
    // Exemplo: Skip para administradores
    if ((req as any).user?.role === 'admin') return true;
    
    // Não pular para outros casos
    return false;
  }
});


// Limitador mais restrito para rotas sensíveis como login e cadastro
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  standardHeaders: true,
  legacyHeaders: false,
  
  // Função personalizada para respostas de limite excedido
  handler: (req, res, next, options) => {
    logger.warn(`Auth rate limit excedido para ${req.ip} em ${req.originalUrl}`);
    
    // Resposta personalizada para limite excedido
    res.status(options.statusCode).json(formatErrorResponse(
      'Muitas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente.',
      'TOO_MANY_AUTH_ATTEMPTS'
    ));
  }
});