// api-gateway/src/services/service-registry.ts
import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../config/logger';

/**
 * Interface que define as informações de um serviço registrado
 */
export interface ServiceInfo {
  id: string;
  name: string;
  url: string;
  healthCheck: string;
  isActive: boolean;
  lastCheck: Date;
  version?: string;
  metadata?: Record<string, any>;
}

/**
 * Classe responsável por gerenciar o registro e descoberta de serviços
 */
class ServiceRegistry {
  // Mapa de serviços registrados
  private services: Map<string, ServiceInfo> = new Map();
  
  // Intervalo de verificação de saúde (30 segundos por padrão)
  private readonly healthCheckInterval: number = 30000;
  
  // Timer para verificações periódicas
  private healthCheckTimer: NodeJS.Timeout | null = null;
  
  // Flag para indicar se o registro está inicializado
  private initialized: boolean = false;

  /**
   * Inicializa o registro de serviços com os serviços padrão
   */
  public initialize(): void {
    if (this.initialized) {
      logger.warn('Registro de serviços já inicializado');
      return;
    }
    
    // Registrar serviços padrão baseados nas variáveis de ambiente
    this.registerService({
      id: 'auth',
      name: 'Authentication Service',
      url: env.AUTH_SERVICE_URL,
      healthCheck: '/health',
    });
    
    this.registerService({
      id: 'worker',
      name: 'Worker Service',
      url: env.WORKER_SERVICE_URL,
      healthCheck: '/health',
    });
    
        
    // Iniciar verificações periódicas de saúde
    this.startHealthChecks();
    
    this.initialized = true;
    logger.info('Registro de serviços inicializado com sucesso');
  }

  /**
   * Registra um novo serviço no sistema
   * @param service Informações do serviço a ser registrado
   */
  public registerService(service: Omit<ServiceInfo, 'isActive' | 'lastCheck'>): void {
    // Verificar se o serviço já está registrado
    if (this.services.has(service.id)) {
      logger.warn(`Serviço ${service.id} já registrado, atualizando informações`);
    }
    
    // Normalizar URL (remover barra final se houver)
    const url = service.url.endsWith('/') ? service.url.slice(0, -1) : service.url;
    
    // Normalizar path do health check (adicionar barra inicial se não houver)
    const healthCheck = service.healthCheck.startsWith('/') 
      ? service.healthCheck 
      : `/${service.healthCheck}`;
    
    // Registrar o serviço
    this.services.set(service.id, {
      ...service,
      url,
      healthCheck: `${url}${healthCheck}`,
      isActive: false, // Começa como inativo até verificação de saúde
      lastCheck: new Date(),
    });
    
    logger.info(`Serviço ${service.id} registrado com URL ${url}`);
    
    // Realizar verificação de saúde inicial
    this.checkServiceHealth(service.id);
  }

  /**
   * Remove um serviço do registro
   * @param serviceId ID do serviço a ser removido
   */
  public unregisterService(serviceId: string): boolean {
    if (!this.services.has(serviceId)) {
      logger.warn(`Tentativa de remover serviço não registrado: ${serviceId}`);
      return false;
    }
    
    this.services.delete(serviceId);
    logger.info(`Serviço ${serviceId} removido do registro`);
    return true;
  }

  /**
   * Obtém a URL de um serviço específico
   * @param serviceId ID do serviço
   * @returns URL do serviço
   * @throws Error se o serviço não for encontrado ou estiver inativo
   */
  public getServiceUrl(serviceId: string): string {
    const service = this.services.get(serviceId);
    
    if (!service) {
      logger.error(`Serviço não encontrado: ${serviceId}`);
      throw new Error(`Serviço ${serviceId} não encontrado`);
    }
    
    if (!service.isActive && env.NODE_ENV === 'production') {
      logger.warn(`Tentativa de acessar serviço inativo: ${serviceId}`);
      throw new Error(`Serviço ${serviceId} está indisponível no momento`);
    }
    
    return service.url;
  }

  /**
   * Verifica se um serviço está ativo
   * @param serviceId ID do serviço
   * @returns true se o serviço estiver ativo, false caso contrário
   */
  public isServiceActive(serviceId: string): boolean {
    const service = this.services.get(serviceId);
    return service ? service.isActive : false;
  }

  /**
   * Obtém informações de todos os serviços registrados
   * @returns Lista de informações dos serviços
   */
  public getAllServices(): ServiceInfo[] {
    return Array.from(this.services.values());
  }

  /**
   * Obtém informações detalhadas de um serviço específico
   * @param serviceId ID do serviço
   * @returns Informações do serviço ou undefined se não encontrado
   */
  public getServiceInfo(serviceId: string): ServiceInfo | undefined {
    return this.services.get(serviceId);
  }

  /**
   * Inicia verificações periódicas de saúde
   * @param interval Intervalo em milissegundos (padrão: 30 segundos)
   */
  private startHealthChecks(interval: number = this.healthCheckInterval): void {
    // Limpar timer existente se houver
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    // Iniciar nova verificação periódica
    this.healthCheckTimer = setInterval(() => {
      this.checkAllServicesHealth();
    }, interval);
    
    logger.info(`Verificação de saúde dos serviços iniciada (intervalo: ${interval}ms)`);
    
    // Verificação inicial
    this.checkAllServicesHealth();
  }

  /**
   * Para as verificações periódicas de saúde
   */
  public stopHealthChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
      logger.info('Verificação de saúde dos serviços interrompida');
    }
  }

  /**
   * Verifica a saúde de todos os serviços registrados
   */
  public async checkAllServicesHealth(): Promise<void> {
    logger.debug('Iniciando verificação de saúde de todos os serviços');
    
    const promises = Array.from(this.services.keys()).map(
      serviceId => this.checkServiceHealth(serviceId)
    );
    
    await Promise.allSettled(promises);
    
    const activeCount = Array.from(this.services.values()).filter(s => s.isActive).length;
    const totalCount = this.services.size;
    
    logger.info(`Verificação de saúde concluída: ${activeCount}/${totalCount} serviços ativos`);
  }

  /**
   * Verifica a saúde de um serviço específico
   * @param serviceId ID do serviço
   */
  public async checkServiceHealth(serviceId: string): Promise<boolean> {
    const service = this.services.get(serviceId);
    
    if (!service) {
      logger.warn(`Tentativa de verificar saúde de serviço não registrado: ${serviceId}`);
      return false;
    }
    
    // Atualizar última verificação
    service.lastCheck = new Date();
    
    try {
      // Configurar timeout para verificação de saúde
      const response = await axios.get(service.healthCheck, {
        timeout: 5000, // 5 segundos
        validateStatus: null, // Não lançar exceção para qualquer status HTTP
      });
      
      // Verificar se o serviço está saudável (status 200 OK)
      const isHealthy = response.status === 200;
      
      // Atualizar metadados se disponíveis na resposta
      if (isHealthy && response.data) {
        service.version = response.data.version || service.version;
        service.metadata = response.data;
      }
      
      // Atualizar status do serviço
      const previousStatus = service.isActive;
      service.isActive = isHealthy;
      
      // Logar mudanças de status
      if (previousStatus !== isHealthy) {
        if (isHealthy) {
          logger.info(`Serviço ${serviceId} agora está ATIVO`);
        } else {
          logger.warn(`Serviço ${serviceId} agora está INATIVO (status: ${response.status})`);
        }
      }
      
      return isHealthy;
    } catch (error: any) {
      // Capturar erros de timeout ou conexão
      const previousStatus = service.isActive;
      service.isActive = false;
      
      if (previousStatus) {
        logger.error(`Serviço ${serviceId} agora está INATIVO: ${error.message}`);
      } else {
        logger.debug(`Serviço ${serviceId} continua INATIVO: ${error.message}`);
      }
      
      return false;
    }
  }

  /**
   * Encerra o registro de serviços
   */
  public shutdown(): void {
    this.stopHealthChecks();
    this.services.clear();
    this.initialized = false;
    logger.info('Registro de serviços encerrado');
  }
}

// Instância singleton
const serviceRegistry = new ServiceRegistry();

// Funções de exposição para o resto da aplicação
export function initializeServiceRegistry(): void {
  serviceRegistry.initialize();
}

export function registerService(service: Omit<ServiceInfo, 'isActive' | 'lastCheck'>): void {
  serviceRegistry.registerService(service);
}

export function unregisterService(serviceId: string): boolean {
  return serviceRegistry.unregisterService(serviceId);
}

export function getServiceUrl(serviceId: string): string {
  return serviceRegistry.getServiceUrl(serviceId);
}

export function isServiceActive(serviceId: string): boolean {
  return serviceRegistry.isServiceActive(serviceId);
}

export function getAllServices(): ServiceInfo[] {
  return serviceRegistry.getAllServices();
}

export function getServiceInfo(serviceId: string): ServiceInfo | undefined {
  return serviceRegistry.getServiceInfo(serviceId);
}

export function checkServiceHealth(serviceId: string): Promise<boolean> {
  return serviceRegistry.checkServiceHealth(serviceId);
}

export function checkAllServicesHealth(): Promise<void> {
  return serviceRegistry.checkAllServicesHealth();
}

export function shutdownServiceRegistry(): void {
  serviceRegistry.shutdown();
}

// Exportar a instância do registry para testes
export { serviceRegistry };