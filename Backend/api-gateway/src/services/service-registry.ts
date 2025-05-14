import { env } from '../config/env';
import logger from '../utils/logger';


// Interface para representar o estado de um serviço
interface ServiceStatus {
  url: string;
  active: boolean;
  lastCheck: Date;
  lastActive?: Date;
  lastError?: string;
  responseTime?: number;
}


// Registro de status de todos os microserviços
const servicesRegistry: Record<string, ServiceStatus> = {
  authService: {
    url: env.AUTH_SERVICE_URL,
    active: false,
    lastCheck: new Date()
  },
  // Worker Service
  workerService: {
    url: env.WORKER_SERVICE_URL,
    active: false,
    lastCheck: new Date()
  },
  // Document Service
  documentService: {
    url: env.DOCUMENT_SERVICE_URL,
    active: false,
    lastCheck: new Date()
  }
};


// Marca um serviço específico como ativo ou inativo
export function setServiceStatus(
  serviceName: keyof typeof servicesRegistry, 
  active: boolean,
  responseTime?: number,
  errorMessage?: string
): void {
  // Verifica se o serviço existe no registro
  if (!servicesRegistry[serviceName]) {
    logger.warn(`Tentativa de atualizar status de serviço desconhecido: ${serviceName}`);
    return;
  }
  // Atualiza o status do serviço
  servicesRegistry[serviceName].active = active;
  servicesRegistry[serviceName].lastCheck = new Date();
  
  // Se o serviço está ativo, atualiza a data da última atividade
  if (active) {
    servicesRegistry[serviceName].lastActive = new Date();
    if (responseTime !== undefined) {
      servicesRegistry[serviceName].responseTime = responseTime;
    }
    // Limpa a mensagem de erro se o serviço está ativo
    servicesRegistry[serviceName].lastError = undefined;
  } else if (errorMessage) {
    servicesRegistry[serviceName].lastError = errorMessage;
  }
}


// Marca todos os serviços como ativos (usado em desenvolvimento)
export function markAllServicesAsActive(): void {
  Object.keys(servicesRegistry).forEach(serviceName => {
    setServiceStatus(serviceName as keyof typeof servicesRegistry, true);
  });
}


// Retorna o status de todos os serviços 
export function getAllServicesStatus(): Record<string, ServiceStatus> {
  return { ...servicesRegistry };
}


// Verifica se um serviço está ativo
export function isServiceActive(serviceName: keyof typeof servicesRegistry): boolean {
  return servicesRegistry[serviceName]?.active || false;
}