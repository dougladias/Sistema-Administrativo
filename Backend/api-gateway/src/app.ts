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
      endpoints: ['/api/workers', '/api/auth', '/api/admin']
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

  // ROTAS AUTH - Definidas diretamente para contornar o problema
  
  // Rota de registro
  app.post('/api/auth/register', async (req, res) => {
    try {
      logger.debug('Processando registro diretamente');
      const result = await httpClient.post(`${env.AUTH_SERVICE_URL}/api/auth/register`, req.body);
      res.status(201).json(result);
    } catch (error) {
      logger.error('Erro ao processar registro:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Erro ao processar registro',
          details: errorMessage
        }
      });
    }
  });

  // Rota de login
  app.post('/api/auth/login', async (req, res) => {
    try {
      logger.debug('Processando login diretamente');
      const result = await httpClient.post(`${env.AUTH_SERVICE_URL}/api/auth/login`, req.body);
      res.json(result);
    } catch (error) {
      logger.error('Erro ao processar login:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Erro ao processar login',
          details: errorMessage
        }
      });
    }
  });

  // Rota refresh token
  app.post('/api/auth/refresh-token', async (req, res) => {
    try {
      logger.debug('Processando refresh token diretamente');
      const result = await httpClient.post(`${env.AUTH_SERVICE_URL}/api/auth/refresh-token`, req.body);
      res.json(result);
    } catch (error) {
      logger.error('Erro ao processar refresh token:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Erro ao processar refresh token',
          details: errorMessage
        }
      });
    }
  });

  // Rota validate token
  app.post('/api/auth/validate-token', async (req, res) => {
    try {
      logger.debug('Validando token diretamente');
      const result = await httpClient.post(`${env.AUTH_SERVICE_URL}/api/auth/validate-token`, req.body);
      res.json(result);
    } catch (error) {
      logger.error('Erro ao processar validação de token:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Erro ao processar validação de token',
          details: errorMessage
        }
      });
    }
  });

  // Rota para obter perfil do usuário
  app.get('/api/auth/me', async (req, res) => {
    try {
      logger.debug('Obtendo perfil do usuário diretamente');
      const result = await httpClient.get(`${env.AUTH_SERVICE_URL}/api/auth/me`, {
        headers: {
          Authorization: req.headers.authorization
        }
      });
      res.json(result);
    } catch (error) {
      logger.error('Erro ao obter perfil do usuário:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Erro ao obter perfil do usuário',
          details: errorMessage
        }
      });
    }
  });

  // Rota de logout
  app.post('/api/auth/logout', async (req, res) => {
    try {
      logger.debug('Processando logout diretamente');
      const result = await httpClient.post(`${env.AUTH_SERVICE_URL}/api/auth/logout`, req.body, {
        headers: {
          Authorization: req.headers.authorization
        }
      });
      res.json(result);
    } catch (error) {
      logger.error('Erro ao processar logout:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Erro ao processar logout',
          details: errorMessage
        }
      });
    }
  });

  // Funções admin
  app.get('/api/auth/users', async (req, res) => {
    try {
      logger.debug('Obtendo lista de usuários diretamente');
      const result = await httpClient.get(`${env.AUTH_SERVICE_URL}/api/auth/users`, {
        headers: {
          Authorization: req.headers.authorization
        }
      });
      res.json(result);
    } catch (error) {
      logger.error('Erro ao obter lista de usuários:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Erro ao obter lista de usuários',
          details: errorMessage
        }
      });
    }
  });

  // Rota para listar todas as rotas disponíveis
  app.get('/routes', (req, res) => {
    // Construir uma lista de rotas a partir do _router do Express
    const availableRoutes = [];

    // Rotas explícitas
    availableRoutes.push('GET /');
    availableRoutes.push('GET /health');
    availableRoutes.push('GET /services');
    availableRoutes.push('GET /routes');
    
    // Rotas de autenticação
    availableRoutes.push('POST /api/auth/register');
    availableRoutes.push('POST /api/auth/login');
    availableRoutes.push('POST /api/auth/refresh-token');
    availableRoutes.push('POST /api/auth/validate-token');
    availableRoutes.push('GET /api/auth/me');
    availableRoutes.push('POST /api/auth/logout');
    availableRoutes.push('GET /api/auth/users');
    
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