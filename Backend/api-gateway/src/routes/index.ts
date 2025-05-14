import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { env } from '../config/env';
import { apiLimiter } from '../middleware/rate';
import logger from '../utils/logger';
import { Request, Response, NextFunction } from 'express';
import { Buffer } from 'buffer';

// Extende o tipo Request para incluir o campo 'user'
declare global {
  namespace Express {
    interface User {
      id: string;
      role: string;
      [key: string]: any;
    }
    interface Request {
      user?: User;
    }
  }
}

// Cria uma instância do roteador
const router = Router();

// Middleware de logging para todas as requisições
interface LogRequest extends Request {}
interface LogResponse extends Response {}
interface LogNextFunction extends NextFunction {}

const logRequest = (req: LogRequest, res: LogResponse, next: LogNextFunction): void => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
};

// Configuração proxy para Worker Service
const workerServiceProxy = createProxyMiddleware({
  target: env.WORKER_SERVICE_URL,
  pathRewrite: { '^/api/workers': '/api/workers' },
  changeOrigin: true,
  logLevel: 'debug',
  selfHandleResponse: false, 
  logProvider: () => logger,
  onProxyReq: (proxyReq, req, res) => {    
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }    
    proxyReq.setHeader('x-api-gateway', 'true');    
    if (
      req.method === 'POST' ||
      req.method === 'PUT' ||
      req.method === 'PATCH'
    ) {
      if (req.body && Object.keys(req.body).length) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    }    
  },
  onError: (err, req, res) => {
    logger.error(`Proxy error: ${err.message}`);
    res.status(500).json({ error: 'Serviço indisponível' });
  }
});

// Configuração proxy para Document Service
const documentServiceProxy = createProxyMiddleware({
  target: env.DOCUMENT_SERVICE_URL,
  pathRewrite: { '^/api/documents': '/api/documents' },
  changeOrigin: true,
  logLevel: 'debug',
  logProvider: () => logger,
  onProxyReq: (proxyReq, req, res) => {    
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }    
    proxyReq.setHeader('x-api-gateway', 'true');
  },
  onError: (err, req, res) => {
    logger.error(`Proxy error: ${err.message}`);
    res.status(500).json({ error: 'Serviço indisponível' });
  }
});
// Rotas públicas 
router.use('/api/auth', logRequest, createProxyMiddleware({
  target: env.AUTH_SERVICE_URL,
  pathRewrite: { '^/api/auth': '/api/auth' },
  changeOrigin: true
}));



// Rotas Serviço Worker
router.get('/api/workers', workerServiceProxy);
// POST 
router.post('/api/workers', logRequest, apiLimiter, (req, res, next) => {  
  next();
}, workerServiceProxy);
// PUT 
router.put('/api/workers/:id', logRequest, apiLimiter, workerServiceProxy);
// DELETE 
router.delete('/api/workers/:id', logRequest, apiLimiter, workerServiceProxy);

// Rotas Serviço Document terminar de Integrar
router.use('/api/documents', logRequest, apiLimiter, documentServiceProxy);


// Rota para verificação de saúde dos serviços (monitoramento)
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      worker: `${env.WORKER_SERVICE_URL}`,
      document: `${env.DOCUMENT_SERVICE_URL}`,
      auth: `${env.AUTH_SERVICE_URL}`
    }
  });
});

export default router;