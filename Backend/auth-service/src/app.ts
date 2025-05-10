import express, { Application, ErrorRequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import { errorHandler } from './middleware/errorHandler';
import logger from './config/logger';
import { env } from './config/env';

const app: Application = express();

// Configuração básica
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração de segurança
app.use(helmet());

// Configuração de CORS
app.use(cors({
  origin: env.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Limitador de taxa de requisições
const limiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas requisições deste IP, por favor tente novamente após 15 minutos'
});

// Aplicar limitador em todas as requisições
app.use(limiter);

// Rota de verificação de saúde
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'auth-service' });
});

// Rotas da API
app.use('/api/auth', authRoutes);

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: `Rota não encontrada: ${req.originalUrl}` });
});

// Middleware de tratamento de erros
app.use(errorHandler as unknown as ErrorRequestHandler);

export default app;