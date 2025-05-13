import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/database';
import { createLogger } from '../../shared/src/utils/logger';
import { env } from './config/env';
import fs from 'fs';

const logger = createLogger({ serviceName: 'document-service' });
const PORT = env.port;

// Iniciar o servidor
const startServer = async () => {
  try {
    // Conectar ao banco de dados
    await connectDB();

    // Iniciar o servidor Express somente após conectar ao banco de dados
    const server = app.listen(PORT, () => {
      logger.info(`Document Service rodando na porta ${PORT} em modo ${env.nodeEnv}`);
    });

    // Tratamento de erros não tratados
    process.on('unhandledRejection', (err) => {
      logger.error('UNHANDLED REJECTION:', err);
      // Fechar o servidor graciosamente
      server.close(() => {
        process.exit(1);
      });
    });

    // Tratamento de encerramento do processo
    process.on('SIGTERM', () => {
      logger.info('SIGTERM recebido. Encerrando graciosamente.');
      server.close(() => {
        logger.info('Servidor encerrado.');
        process.exit(0);
      });
    });

    // Adicional para o document-service: tratamento do SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      logger.info('SIGINT recebido. Encerrando graciosamente.');
      server.close(() => {
        logger.info('Servidor encerrado.');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Falha ao iniciar o Document Service:', error);
    process.exit(1);
  }
};

startServer();