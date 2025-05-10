import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/database';
import logger from './utils/logger';
import { env } from './config/env';

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