import express, { Express, Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import workerRoutes from './routes/worker.routes';
import errorMiddleware from './middleware/error.middleware';
import logger from './utils/logger';

const app: Express = express();

// Middleware para logging
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Middleware de segurança
app.use(helmet());

// Habilitar CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Rota de verificação de saúde
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP', service: 'worker-service' });
});

// Rotas da API
app.use('/api/workers', workerRoutes);

// Handler para rotas não encontradas
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    message: 'Rota não encontrada',
    path: req.originalUrl
  });
});

// Middleware de tratamento de erros
app.use(errorMiddleware as unknown as ErrorRequestHandler);

export default app;