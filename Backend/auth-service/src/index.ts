import app from './app';
import { connectDB } from './config/database';
import { createLogger } from '../../shared/src/utils/logger';
import { env } from './config/env';

// Inicializar logger
const logger = createLogger({ serviceName: 'auth-service' });

// Porta do servidor
const PORT = env.port;

/**
 * Iniciar o servidor
 */
const startServer = async () => {
  try {
    // Conectar ao banco de dados
    await connectDB();

    // Iniciar o servidor Express
    const server = app.listen(PORT, () => {
      logger.info(`Auth Service rodando na porta ${PORT} em modo ${env.nodeEnv}`);
      logger.info(`URL da API: http://localhost:${PORT}/api/auth`);
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

    // Tratamento de interrupção do processo
    process.on('SIGINT', () => {
      logger.info('SIGINT recebido. Encerrando graciosamente.');
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

// Iniciar o servidor
startServer();