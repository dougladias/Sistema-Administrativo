import app from './app';
import { connectToDatabase } from './config/database';
import logger from './config/logger';
import { env } from './config/env';

// Iniciar o servidor
const startServer = async () => {
  try {
    // Conectar ao banco de dados
    await connectToDatabase();

    // Iniciar o servidor Express
    const server = app.listen(env.port, () => {
      logger.info(`Benefits service running on port ${env.port} in ${env.nodeEnv} mode`);
      
      // Se estiver configurado, registrar no API Gateway
      if (env.apiGatewayUrl) {
        logger.info('Attempting to register with API Gateway...');
        registerWithApiGateway();
      }
    });

    // Tratamento de erros não tratados
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Encerrar graciosamente
      server.close(() => {
        process.exit(1);
      });
    });

    // Tratamento de sinais de encerramento
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
    logger.error('Failed to start benefits service:', error);
    process.exit(1);
  }
};

// Função para registrar o serviço no API Gateway
const registerWithApiGateway = () => {
  // Implementação do registro no API Gateway
  // Esta é apenas uma função de exemplo
};

// Tratamento de exceções não capturadas
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Iniciar o servidor
startServer();