import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import { env, isDev } from './config/env';
import routes from './routes';
import errorHandler from './middleware/error';
import logger from './utils/logger';
import notFoundHandler from './middleware/error';

export const createApp = () => {
  const app = express();
  
  // Adiciona um ID único para cada requisição
  app.use((req, res, next) => {
    (req as any).id = uuidv4();
    next();
  });
  
  // Configurações de segurança
  app.use(helmet());
  
  // Configuração de CORS
  app.use(cors({
    origin: env.CORS_ORIGIN,
    methods: env.CORS_METHODS,
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
  // Compressão de respostas
  if (env.ENABLE_COMPRESSION) {
    app.use(compression());
  }
  
  // Parsers
  app.use(express.json());  
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  
  // Logging de requisições HTTP
  if (env.ENABLE_REQUEST_LOGGING) {
    // Em desenvolvimento, usar formato detalhado
    if (isDev) {
      app.use(morgan('dev'));
    } else {
      // Em produção, formato mais compacto e log para winston
      app.use(morgan('combined', {
        stream: {
          write: (message) => logger.http(message.trim())
        }
      }));
    }
  }
  
  // Middleware para logging de tempo de resposta
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (duration > 1000) { 
        logger.warn(`Requisição lenta [${duration}ms]: ${req.method} ${req.originalUrl}`);
      }
    });
    next();
  });
  
  // Rota de status básica
  app.get('/', (req, res) => {
    res.json({
      name: 'API Gateway',
      status: 'online',
      version: process.env.npm_package_version || '1.0.0',
      env: env.NODE_ENV
    });
  });
  
  // Montagem de todas as rotas
  app.use(routes);
  
  // Handler para rotas não encontradas
  app.use(notFoundHandler);
  
  // Handler para erros
  app.use(errorHandler);
  
  return app;
};