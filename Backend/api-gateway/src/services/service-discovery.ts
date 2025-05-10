import { env } from '../config/env';
import { logger } from '../config/logger';

// Interface para registro de serviço
interface ServiceInfo {
  name: string;
  url: string;
  healthCheck: string;
  isActive: boolean;
  lastCheck: Date;
}

// Mapa de serviços
const services = new Map<string, ServiceInfo>();

// Inicialização dos serviços conhecidos
export function initializeServiceRegistry() {
  registerService('auth', env.AUTH_SERVICE_URL, '/health');
  registerService('worker', env.WORKER_SERVICE_URL, '/health');  
  
  // Inicia verificação periódica de saúde
  startHealthChecks();
}

// Registra um serviço no registro
export function registerService(name: string, url: string, healthCheck: string) {
  services.set(name, {
    name,
    url,
    healthCheck: `${url}${healthCheck}`,
    isActive: false, // Será atualizado pelo health check
    lastCheck: new Date()
  });
  
  logger.info(`Serviço ${name} registrado em ${url}`);
}

// Obtém a URL de um serviço
export function getServiceUrl(name: string): string {
  const service = services.get(name);
  
  if (!service) {
    throw new Error(`Serviço ${name} não encontrado`);
  }
  
  if (!service.isActive) {
    logger.warn(`Tentativa de acessar serviço inativo: ${name}`);
  }
  
  return service.url;
}

// Verifica a saúde de todos os serviços registrados
async function checkServicesHealth() {
  for (const [name, service] of services.entries()) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(service.healthCheck, { 
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const isHealthy = response.ok;
      
      // Atualiza o status do serviço
      services.set(name, {
        ...service,
        isActive: isHealthy,
        lastCheck: new Date()
      });
      
      if (!isHealthy) {
        logger.warn(`Serviço ${name} não está saudável`);
      }
    } catch (error) {
      logger.error(`Erro ao verificar saúde do serviço ${name}:`, error);
      
      // Marca o serviço como inativo
      services.set(name, {
        ...service,
        isActive: false,
        lastCheck: new Date()
      });
    }
  }
}

// Inicia verificações periódicas de saúde
function startHealthChecks(interval = 30000) { // 30 segundos por padrão
  setInterval(checkServicesHealth, interval);
  
  // Verificação inicial
  checkServicesHealth();
}

// Obtém todos os serviços e seus status
export function getAllServices(): ServiceInfo[] {
  return Array.from(services.values());
}