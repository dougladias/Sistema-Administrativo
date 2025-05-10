import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { env } from './env';
import { errorHandler } from '../middleware/error-handler.middleware';
import { requestLogger } from '../middleware/request-logger.middleware';
import { corsMiddleware } from '../middleware/cors.middleware';
import routes from '../routes/app';

export function createApp() {
  const app = express();

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
    res.status(200).json({ status: 'ok', service: env.APP_NAME });
  });

  // Handler de erros global
  app.use(errorHandler);

  return app;
}