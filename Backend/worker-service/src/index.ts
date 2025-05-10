import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from 'shared/src/database/app';
import { createLogger } from 'shared/src/utils/logger.utils';
import { env } from './config/env';

const logger = createLogger({ serviceName: 'worker-service' });
const PORT = env.port;

// Iniciar o servidor
const startServer = async () => {
  try {
    // Conectar ao banco de dados
    await connectDB();

    // Iniciar o servidor Express
    const server = app.listen(PORT, () => {
      logger.info(`Worker Service rodando na porta ${PORT} em modo ${env.nodeEnv}`);
    });

    // Tratamento de erros não tratados
    process.on('unhandledRejection', (err) => {
      logger.error('UNHANDLED REJECTION:', err);
      // Fechar o servidor graciosamente
      server.close(() => {
        process.exit(1);
      });
    });

    process.on('SIGTERM', () => {
      logger.info('SIGTERM recebido. Encerrando graciosamente.');
      server.close(() => {
        logger.info('Servidor encerrado.');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Falha ao iniciar o servidor:', error);
    process.exit(1);
  }
};

startServer();