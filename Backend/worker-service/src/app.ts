import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import workerRoutes from './routes/worker.routes';
import { createLogger } from '../../shared/src/utils/logger';

const logger = createLogger({ serviceName: 'worker-service' });
const app: Express = express();

// Middleware básico de segurança e parsing
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de verificação de saúde
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'UP', 
    service: 'worker-service',
    timestamp: new Date().toISOString()
  });
});

// Rotas da API 
app.use('/api/workers', workerRoutes);

// Handler para rotas não encontradas
app.use((req: Request, res: Response) => {
  res.status(404).json({
    message: 'Rota não encontrada',
    path: req.originalUrl
  });
});

// Handler básico de erros
app.use((err: any, req: Request, res: Response) => {
  logger.error('Erro na aplicação:', err);
  
  // Se o erro for uma instância de ApiError, use seu método toResponse
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Erro interno do servidor'
  });
});

export default app;