import { Options as ProxyOptions } from 'http-proxy-middleware';
import { env } from './env';
import logger from '../utils/logger';

// Configurações de proxy para cada microserviço
export const proxyConfigs: Record<string, ProxyOptions> = {
  // Configuração para o serviço de Workers
  workerService: {
    target: env.WORKER_SERVICE_URL,
    pathRewrite: { '^/api/workers': '/api/workers' },
    changeOrigin: true,
    logLevel: 'debug',
    logProvider: () => logger,
    timeout: env.WORKER_SERVICE_TIMEOUT,
    onProxyReq: (proxyReq, req, res) => {
      // Opcionalmente adicionar headers para o serviço de destino
      proxyReq.setHeader('x-gateway-timestamp', new Date().toISOString());
      proxyReq.setHeader('x-forwarded-by', 'api-gateway');
      
      // Se houver um usuário autenticado, pode passar informações relevantes
      if ((req as any).user) {
        proxyReq.setHeader('x-user-id', (req as any).user.id);
        proxyReq.setHeader('x-user-role', (req as any).user.role || 'user');
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      // Ações ao receber a resposta do microserviço
      proxyRes.headers['x-powered-by'] = 'API-Gateway';
    },
    // Tratamento de erro de proxy
    onError: (err, req, res) => {
      logger.error(`Proxy error (Worker Service): ${err.message}`);
      res.status(502).json({
        status: 'error',
        message: 'Não foi possível se conectar ao serviço de funcionários',
        error: env.NODE_ENV === 'production' ? undefined : err.message
      });
    }
  },  
  // Configuração para o serviço de Documentos
  documentService: {
    target: env.DOCUMENT_SERVICE_URL,
    pathRewrite: { '^/api/documents': '/api/documents' },
    changeOrigin: true,
    logLevel: 'debug',
    logProvider: () => logger,
    timeout: env.DOCUMENT_SERVICE_TIMEOUT,
    onProxyReq: (proxyReq, req, res) => {
      // Adicionar header de timestamp e origem
      proxyReq.setHeader('x-gateway-timestamp', new Date().toISOString());
      proxyReq.setHeader('x-forwarded-by', 'api-gateway');
      
      // IMPORTANTE: Propagar o header de autorização explicitamente
      if (req.headers.authorization) {
        proxyReq.setHeader('Authorization', req.headers.authorization);
      }
      
      // Se houver um usuário autenticado, passar informações relevantes
      if ((req as any).user) {
        proxyReq.setHeader('x-user-id', (req as any).user.id);
        proxyReq.setHeader('x-user-role', (req as any).user.role || 'user');
      }
    },
    // Adicionar onProxyRes para consistência com o Worker Service
    onProxyRes: (proxyRes, req, res) => {
      // Ações ao receber a resposta do microserviço
      proxyRes.headers['x-powered-by'] = 'API-Gateway';
    },
    onError: (err, req, res) => {
      logger.error(`Proxy error (Document Service): ${err.message}`);
      res.status(502).json({
        status: 'error',
        message: 'Não foi possível se conectar ao serviço de documentos',
        error: env.NODE_ENV === 'production' ? undefined : err.message
      });
    }
  },  
  // Configuração para o serviço de Autenticação
  authService: {
    target: env.AUTH_SERVICE_URL,
    pathRewrite: { '^/api/auth': '/api/auth' },
    changeOrigin: true,
    logLevel: 'debug',
    logProvider: () => logger,
    timeout: env.AUTH_SERVICE_TIMEOUT,
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('x-gateway-timestamp', new Date().toISOString());
      proxyReq.setHeader('x-forwarded-by', 'api-gateway');
    },
    // Adicionar onProxyRes para consistência com os outros serviços
    onError: (err, req, res) => {
      logger.error(`Proxy error (Auth Service): ${err.message}`);
      res.status(502).json({
        status: 'error',
        message: 'Serviço de autenticação indisponível',
        error: env.NODE_ENV === 'production' ? undefined : err.message
      });
    }
  }
};
// Função auxiliar para obter configuração de proxy por nome do serviço
export const getProxyConfig = (serviceName: keyof typeof proxyConfigs): ProxyOptions => {
  return proxyConfigs[serviceName];
}