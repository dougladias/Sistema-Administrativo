import { createApp } from './config/app';
import { env } from './config/env';
import { logger } from './config/logger';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 ${env.APP_NAME} está rodando na porta ${env.PORT} em modo ${env.NODE_ENV}`);
});

// Tratamento de encerramento gracioso
const shutdownGracefully = async () => {
  logger.info('Recebido sinal de encerramento. Encerrando graciosamente...');
  
  server.close(() => {
    logger.info('Servidor HTTP fechado.');
    process.exit(0);
  });
  
  // Se não fechar em 10 segundos, forçar o encerramento
  setTimeout(() => {
    logger.error('Não foi possível encerrar graciosamente, forçando o encerramento');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdownGracefully);
process.on('SIGINT', shutdownGracefully);