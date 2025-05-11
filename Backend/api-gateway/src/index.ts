import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { markServicesAsActive } from './services/service-registry';

// Validar configurações críticas
function validateConfig() {
  logger.info('Iniciando API Gateway com as seguintes configurações:');
  logger.info(`- AUTH_SERVICE_URL: ${env.AUTH_SERVICE_URL || 'NÃO DEFINIDO'}`);
  logger.info(`- WORKER_SERVICE_URL: ${env.WORKER_SERVICE_URL || 'NÃO DEFINIDO'}`);
  logger.info(`- PORT: ${env.PORT || 4000}`);
  logger.info(`- NODE_ENV: ${env.NODE_ENV}`);
  
  if (!env.AUTH_SERVICE_URL || !env.WORKER_SERVICE_URL) {
    logger.error('AVISO: Serviços não estão configurados corretamente!');
  }
}

validateConfig();

// Criar a aplicação
const app = createApp();

// Marcar serviços como ativos em ambiente de desenvolvimento
if (env.NODE_ENV === 'development') {
  setTimeout(() => {
    try {
      markServicesAsActive();
      logger.info('Todos os serviços foram marcados como ativos para ambiente de desenvolvimento');
    } catch (error) {
      logger.error('Erro ao marcar serviços como ativos:', error);
    }
  }, 3000); // Esperar 3 segundos para garantir que o registro foi inicializado
}

// Definir a porta
const PORT = env.PORT || 3005;

// Iniciar o servidor
app.listen(PORT, () => {
  logger.info(`API Gateway iniciado e escutando na porta ${PORT} em modo ${env.NODE_ENV}`);
});

// Tratamento de erros não tratados
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION:', err);
  process.exit(1);
});

// Tratamento de erros não capturados
process.on('SIGTERM', () => {
  logger.info('SIGTERM recebido. Encerrando graciosamente');
  process.exit(0);
});

// Tratamento de interrupções
process.on('SIGINT', () => {
  logger.info('SIGINT recebido. Encerrando graciosamente');
  process.exit(0);
});