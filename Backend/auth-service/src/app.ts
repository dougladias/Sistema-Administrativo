import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import { 
  errorHandler, 
  notFoundHandler
} from './middleware/error.middleware';
import { requestLogger } from './middleware/logging.middleware';
import { securityHeaders } from './middleware/security.middleware';
import { createLogger } from '../../shared/src/utils/logger';
import { env } from './config/env';

// Inicializar logger diretamente sem child loggers
const logger = createLogger({ serviceName: 'auth-service' });

// Criar aplicação Express
const app: Express = express();

// Middlewares básicos de segurança e parsing
app.use(helmet());

// Configuração de CORS
app.use(cors({
  origin: env.corsOrigin === '*' ? '*' : env.corsOrigin.split(','),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Parsers para JSON e form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting global para todas as rotas
const globalRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Muitas requisições deste IP, por favor tente novamente mais tarde'
    },
    timestamp: new Date().toISOString()
  }
});

// Aplicar rate limiter a todas as rotas
app.use(globalRateLimiter);

// Middlewares globais de segurança e logging (cuidado com ordem)
app.use(requestLogger);  // Primeiro logging
app.use(securityHeaders); // Depois headers de segurança

// Logging de requisições simples que não usa child loggers
app.use((req: Request, res: Response, next) => {
  logger.info(`Requisição recebida: ${req.method} ${req.path}`);
  next();
});

// Rota de verificação de saúde (health check)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);

// Middleware para capturar rotas não encontradas
app.use(notFoundHandler);

// Middleware de tratamento de erros
app.use(errorHandler);

export default app;