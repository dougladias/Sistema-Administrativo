import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env';
import { errorHandler } from './middleware/error-handler.middleware';
import { requestLogger } from './middleware/request-logger.middleware';
import { corsMiddleware } from './middleware/cors.middleware';
import { initializeServiceRegistry, registerService } from './services/service-registry';
import routes from './routes/app';
import { logger } from './config/logger';
import httpClient from './utils/http-client';

export function createApp() {
  const app = express();

  // Inicializar o registro de serviços
  initializeServiceRegistry();

  // Registrar serviços com caminhos de health check corretos
  registerService({
    id: 'auth',
    name: 'Authentication Service',
    url: env.AUTH_SERVICE_URL,
    healthCheck: '/health'
  });

  registerService({
    id: 'worker',
    name: 'Worker Service',
    url: env.WORKER_SERVICE_URL,
    healthCheck: '/health'
  });

  registerService({
    id: 'document',
    name: 'Document Service',
    url: env.DOCUMENT_SERVICE_URL,
    healthCheck: '/health'
  });
  
  // Middlewares de segurança e otimização
  app.use(helmet({
    contentSecurityPolicy: false
  }));
  app.use(compression());
  
  app.use(express.json({ 
    limit: '10mb', 
    strict: false 
  }));
  app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
  }));

  app.use(corsMiddleware);
  app.use(requestLogger);

  // Lista de rotas registradas manualmente - para ajudar na depuração
  // Declara fora das funções para ser compartilhada entre rotas
  const registeredRoutes = [];

  // Rotas da API
  app.use('/api', routes);

  // Rota principal
  app.get('/', (req, res) => {
    res.json({ 
      message: 'API Gateway funcionando!',
      versao: '1.0.0',
      endpoints: ['/api/workers', '/api/auth', '/api/documents'] 
    });
  });

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

  // Rotas para listar todas as rotas disponíveis
  app.get('/routes', (req, res) => {
    // Construir uma lista de rotas a partir do _router do Express
    const availableRoutes = [];

    // Rotas explícitas
    availableRoutes.push('GET /');
    availableRoutes.push('GET /health');
    availableRoutes.push('GET /services');
    availableRoutes.push('GET /routes');
    availableRoutes.push('POST /api');
    
    // Rotas de autenticação
    availableRoutes.push('GET /api/auth');
    availableRoutes.push('POST /api/auth/login');
    availableRoutes.push('POST /api/auth/register');
    availableRoutes.push('GET /api/auth/refresh');
    availableRoutes.push('POST /api/auth/logout');  

    // Rotas de Worker
    availableRoutes.push('GET /api/workers');
    availableRoutes.push('POST /api/workers');
    availableRoutes.push('GET /api/workers/:id');
    availableRoutes.push('PUT /api/workers/:id');
    availableRoutes.push('DELETE /api/workers/:id');
    availableRoutes.push('POST /api/workers/:id/activate');
    availableRoutes.push('POST /api/workers/:id/deactivate');    
    availableRoutes.push('GET /api/workers/:id/documents');
    availableRoutes.push('GET /api/workers/:id/health');  
    
    // Rotas de Documentos
    availableRoutes.push('GET /api/documents'); 
    availableRoutes.push('POST /api/documents');
    availableRoutes.push('GET /api/documents/:id');
    availableRoutes.push('PUT /api/documents/:id');
    availableRoutes.push('DELETE /api/documents/:id');
    availableRoutes.push('GET /api/documents/:id/download');
    availableRoutes.push('GET /api/documents/:id/view');
    availableRoutes.push('GET /api/documents/worker/:workerId');
    availableRoutes.push('GET /api/documents/department/:departmentId');    
    availableRoutes.push('GET /api/documents/expiring');
    availableRoutes.push('POST /api/documents/:id/status');
    availableRoutes.push('POST /api/documents/:id/validate');

    res.json({
      count: availableRoutes.length,
      routes: availableRoutes,
      timestamp: new Date().toISOString()
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
  const port = env.PORT || 3005;
  
  app.listen(port, () => {
    logger.info(`API Gateway iniciado na porta ${port} em modo ${env.NODE_ENV}`);
  });
}

export default createApp;