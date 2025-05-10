import app from './app';
import connectDB from './config/database';
import logger from './config/logger';
import { env } from './config/env';

// Iniciar o servidor
const startServer = async () => {
  try {
    // Conectar ao banco de dados
    await connectDB();

    // Iniciar o servidor Express
    const server = app.listen(env.port, () => {
      logger.info(`Auth service running on port ${env.port} in ${env.nodeEnv} mode`);
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
      logger.info('SIGTERM received. Shutting down gracefully');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received. Shutting down gracefully');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();