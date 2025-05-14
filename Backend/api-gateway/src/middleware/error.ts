import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { getProxyConfig } from '../config/proxy-config';
import { authenticate, hasRole } from '../middleware/auth';
import { apiLimiter, authLimiter } from '../middleware/rate';
import logger from '../utils/logger';
import { formatResponse } from '../utils/response.utils';
import { Request, Response, NextFunction } from 'express';

const router = Router();

// Middleware de logging para todas as requisições
interface LogRequest extends Request {}
interface LogResponse extends Response {}
type LogNextFunction = NextFunction;

const logRequest = (req: LogRequest, res: LogResponse, next: LogNextFunction): void => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
};

// Rota de verificação de saúde dos serviços (monitoramento)
router.get('/health', (req, res) => {
  res.json(formatResponse({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  }));
});

// Rota para documentação da API (opcional, pode ser expandida)
router.get('/api-docs', (req, res) => {
  res.json(formatResponse({
    message: 'Documentação da API',
    docs: {
      swagger: '/swagger',
      redoc: '/redoc'
    }
  }));
});

// Rotas de autenticação - sem middleware de autenticação, mas com limitador específico
router.use('/api/auth', 
  logRequest,
  authLimiter,
  createProxyMiddleware(getProxyConfig('authService'))
);

// Rotas de funcionários - protegidas por autenticação e limitador de taxa
router.use('/api/workers',
  logRequest,
  apiLimiter,
  authenticate,
  createProxyMiddleware(getProxyConfig('workerService'))
);

// Rotas de documentos - protegidas por autenticação e limitador de taxa
router.use('/api/documents',
  logRequest,
  apiLimiter,
  authenticate,
  createProxyMiddleware(getProxyConfig('documentService'))
);

// Rotas administrativas - exigem autenticação e papel de admin
router.use('/api/admin',
  logRequest,
  apiLimiter,
  authenticate, 
  hasRole(['admin']), // Middleware adicional que verifica se o usuário é admin
  (req, res, next) => {
    // Aqui você pode implementar rotas administrativas específicas
    // ou encaminhar para um microserviço admin
    res.json(formatResponse({
      message: 'Área administrativa acessada com sucesso'
    }));
  }
);

export default router;