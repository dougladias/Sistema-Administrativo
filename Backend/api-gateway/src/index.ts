import { createApp } from './app';
import { env, isProd, isDev } from './config/env';
import logger from '../../shared/src/utils/logger';
import { markAllServicesAsActive } from './services/service-registry';
import { serviceManager } from './services/service-manager';

// Validação configurações do ambiente
function validateEnvConfig(): boolean {
  logger.info('🚀 Iniciando API Gateway com as seguintes configurações:');
  logger.info(`- Ambiente: ${env.NODE_ENV}`);
  logger.info(`- Porta: ${env.PORT}`);
  
  // Mapear serviços e validar URLs
  const services = [
    { name: 'Auth Service', url: env.AUTH_SERVICE_URL },
    { name: 'Worker Service', url: env.WORKER_SERVICE_URL },
    { name: 'Document Service', url: env.DOCUMENT_SERVICE_URL }
  ];
  
  let configValid = true;
  
  // Verificar cada serviço
  services.forEach(service => {
    if (!service.url) {
      logger.error(`❌ ${service.name}: URL não configurada!`);
      configValid = false;
    } else {
      try {
        const url = new URL(service.url);
        logger.info(`- ${service.name}: ${url.href}`);
      } catch (error) {
        logger.error(`❌ ${service.name}: URL inválida! (${service.url})`);
        configValid = false;
      }
    }
  });
  
  // Validar configurações adicionais apenas em produção
  if (isProd) {
    if (!env.JWT_SECRET || env.JWT_SECRET.length < 16) {
      logger.error('❌ JWT_SECRET não configurado ou muito curto!');
      configValid = false;
    }
  }
  
  return configValid;
}


// Função principal de inicialização 
async function bootstrap() {
  try {
    console.log('='.repeat(50));
    logger.info('🔧 Validando configurações do ambiente...');
    
    // Carregar e validar variáveis de ambiente
    const configValid = validateEnvConfig();
    if (!configValid && isProd) {
      logger.error('❌ Configuração inválida em ambiente de produção, abortando...');
      process.exit(1);
    } else if (!configValid) {
      logger.warn('⚠️ Configuração com problemas, mas continuando em modo de desenvolvimento');
    }
    
    // Criar e configurar a aplicação
    const app = createApp();
    
    // Em ambiente de desenvolvimento
    if (isDev) {
      // Iniciar serviços em modo de desenvolvimento, se configurado
      if (env.SERVICE_AUTOSTART) {
        logger.info('🔄 Iniciando serviços automáticos...');
        const servicesStartResult = await serviceManager.startAllServices();
        
        // Filtrar serviços que foram iniciados com sucesso
        const servicesStarted = Object.entries(servicesStartResult)
          .filter(([_, success]) => success)
          .map(([name, _]) => name);
          
          // Logar serviços que foram iniciados
        if (servicesStarted.length > 0) {
          logger.info(`✅ Serviços iniciados: ${servicesStarted.join(', ')}`);
        } else {
          logger.warn('⚠️ Nenhum serviço foi iniciado automaticamente');
        }
      }
      
      // Forçar serviços como ativos em desenvolvimento, independente do status real
      setTimeout(() => {
        try {
          markAllServicesAsActive();
          logger.info('✅ Todos os serviços foram marcados como ativos para ambiente de desenvolvimento');
        } catch (error) {
          logger.error('❌ Erro ao marcar serviços como ativos:', error);
        }
      }, 1000);
    }
    
    // Iniciar o servidor HTTP
    app.listen(env.PORT, () => {
      console.log('='.repeat(50));
      logger.info(`✅ API Gateway iniciado e escutando na porta ${env.PORT}`);
      logger.info(`🌐 URL: http://localhost:${env.PORT}/`);
      logger.info(`🔧 Ambiente: ${env.NODE_ENV}`);
      console.log('='.repeat(50));
    });
    
    // Configurar manipuladores de eventos do processo
    configureProcessHandlers();
  } catch (error) {
    logger.error('❌ Erro fatal ao iniciar API Gateway:', error);
    process.exit(1);
  }
}


// Configura manipuladores de eventos do processo
function configureProcessHandlers() {
  // Tratamento de erros não tratados
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('❌ UNHANDLED REJECTION:', reason);
    // Em produção, podemos considerar desligar o servidor graciosamente
    if (isProd) {
      process.exit(1);
    }
  });
  
  // Tratamento de exceções não capturadas
  process.on('uncaughtException', (error) => {
    logger.error('❌ UNCAUGHT EXCEPTION:', error);    
    if (isProd) {
      process.exit(1);
    }
  });
  
  // Tratamento de sinais para encerramento gracioso
  process.on('SIGTERM', () => {
    logger.info('👋 SIGTERM recebido. Encerrando graciosamente');
    process.exit(0);
  });
  
  // Tratamento de interrupções (Ctrl+C)
  process.on('SIGINT', () => {
    logger.info('👋 SIGINT recebido. Encerrando graciosamente');
    process.exit(0);
  });
}

// Iniciar aplicação
bootstrap().catch(error => {
  console.error('Erro crítico:', error);
  process.exit(1);
});