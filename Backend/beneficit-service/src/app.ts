import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { benefitTypeRoutes } from './routes/benefitTypeRoutes';
import { employeeBenefitRoutes } from './routes/employeeBenefitRoutes';
import { errorHandler, notFound } from './middleware/errorMiddleware';
import logger from './config/logger';
import { env } from './config/env';

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: env.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging de requisições
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'UP', 
    service: 'benefits-service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Rotas API
app.use('/api/benefit-types', benefitTypeRoutes);
app.use('/api/employee-benefits', employeeBenefitRoutes);

// Middleware para rotas não encontradas
app.use(notFound);

// Middleware de tratamento de erros
app.use(errorHandler);

export default app;