import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env';
import { errorHandler } from './middleware/error-handler.middleware';
import { requestLogger } from './middleware/request-logger.middleware';
import { corsMiddleware } from './middleware/cors.middleware';
import { initializeServiceRegistry, registerService } from './services/service-registry';
import { routeBasedProxy } from './services/proxy.service';
import routes from './routes/app';
import { logger } from './config/logger';

export function createApp() {
  const app = express();

  // Inicializar o registro de serviços
  initializeServiceRegistry();

  // Registrar serviços com caminhos de health check corretos
  registerService({
    id: 'auth',
    name: 'Authentication Service',
    url: env.AUTH_SERVICE_URL,
    healthCheck: '/health'  // Apenas o caminho, sem repetir a URL base
  });

  registerService({
    id: 'worker',
    name: 'Worker Service',
    url: env.WORKER_SERVICE_URL,
    healthCheck: '/health'  // Apenas o caminho, sem repetir a URL base
  });
  
  // Middlewares de segurança e otimização
  app.use(helmet());
  app.use(compression());
  app.use(express.json());
  app.use(corsMiddleware);

  // Middleware para detectar e corrigir URLs duplicados
  app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/api/api/')) {
      const correctedUrl = req.originalUrl.replace('/api/api/', '/api/');
      logger.warn(`Redirecionando URL duplicada: ${req.originalUrl} -> ${correctedUrl}`);
      return res.redirect(correctedUrl);
    }
    next();
  });

  app.use(requestLogger);

  // Middleware para logging de diagnóstico
  app.use((req, res, next) => {
    logger.debug(`Requisição recebida: ${req.method} ${req.originalUrl}`, {
      path: req.path,
      baseUrl: req.baseUrl,
      url: req.url
    });
    next();
  });

  // Rotas da API
  app.use('/api', routes);  // Prefixo /api para todas as rotas

  // Rota de diagnóstico
  app.get('/api/diagnostic', (req, res) => {
    const servicesList = require('./services/service-registry').getAllServices();
    res.status(200).json({
      timestamp: new Date().toISOString(),
      app: {
        name: env.APP_NAME,
        version: process.env.npm_package_version || '1.0.0',
        env: env.NODE_ENV,
        port: env.PORT
      },
      services: servicesList,
      envVars: {
        AUTH_SERVICE_URL: env.AUTH_SERVICE_URL,
        WORKER_SERVICE_URL: env.WORKER_SERVICE_URL
      }
    });
  });

  // Adicionar o proxy baseado em rotas como fallback
  // app.use('/api', routeBasedProxy);

  // Health check
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      service: env.APP_NAME,
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // Rota para status dos serviços registrados
  app.get('/services', (req, res) => {
    const servicesList = require('./services/service-registry').getAllServices();
    res.status(200).json({ 
      services: servicesList,
      count: servicesList.length,
      timestamp: new Date().toISOString()
    });
  });

  // Rota principal
  app.get('/', (req, res) => {
    res.json({ 
      message: 'API Gateway funcionando!',
      versao: '1.0.0',
      endpoints: ['/api/workers', '/api/auth', '/api/admin']
    });
  });

  // Capturar rotas não encontradas
  app.use((req, res, next) => {
    logger.warn(`Rota não encontrada: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Rota não encontrada: ${req.method} ${req.originalUrl}`
      },
      timestamp: new Date().toISOString()
    });
  });

  // Handler de erros global
  app.use(errorHandler);

  return app;
}

// Se o arquivo for executado diretamente
if (require.main === module) {
  const app = createApp();
  const port = env.PORT || 4000;
  
  app.listen(port, () => {
    logger.info(`API Gateway iniciado na porta ${port} em modo ${env.NODE_ENV}`);
  });
}

export default createApp;