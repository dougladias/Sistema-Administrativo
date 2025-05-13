import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import documentRoutes from './routes/document.routes';
import { createLogger } from '../../shared/src/utils/logger';
import { env } from './config/env';
import path from 'path';

// Criar logger usando o utilitário compartilhado
const logger = createLogger({ serviceName: 'document-service' });
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
app.use(cors({
  origin: ['http://localhost:3000'], // Removido o duplicado
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos de upload (para desenvolvimento)
if (env.nodeEnv === 'development') {
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
}

// Rota de verificação de saúde
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'UP', 
    service: 'document-service',
    timestamp: new Date().toISOString()
  });
});

// Rotas da API
// Usar o mesmo padrão do worker-service
app.use('/api/documents', documentRoutes);

// Handler para rotas não encontradas
app.use((req: Request, res: Response) => {
  res.status(404).json({
    message: 'Rota não encontrada',
    path: req.originalUrl
  });
});

// Handler global de erros usando o mesmo padrão do worker-service
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Erro na aplicação:', err);
  
  // Se o erro for uma instância de ApiError, use seu método toResponse
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Erro interno do servidor'
  });
});

export default app;