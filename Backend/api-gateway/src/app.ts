import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './config/env';
import { errorHandler } from './middleware/error-handler.middleware';
import { requestLogger } from './middleware/request-logger.middleware';
import { corsMiddleware } from './middleware/cors.middleware';
import { initializeServiceRegistry } from './services/service-registry';
import routes from './routes/app';

export function createApp() {
  const app = express();

  // Inicializar o registro de serviços
  initializeServiceRegistry();

  // Middlewares de segurança e otimização
  app.use(helmet());
  app.use(compression());
  app.use(express.json());
  app.use(corsMiddleware);
  app.use(requestLogger);

  // Rotas da API
  app.use('/api', routes);

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

  // Handler de erros global
  app.use(errorHandler);

  return app;
}