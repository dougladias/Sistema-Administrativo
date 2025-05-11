import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { createRedisClient } from '../utils/redis-client';
import { EventEmitter } from 'events';

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
 * Eventos emitidos pelo registro de serviços
 */
export enum ServiceRegistryEvent {
  SERVICE_REGISTERED = 'service:registered',
  SERVICE_UNREGISTERED = 'service:unregistered',
  SERVICE_UP = 'service:up',
  SERVICE_DOWN = 'service:down',
  HEALTH_CHECK_STARTED = 'health:check:started',
  HEALTH_CHECK_COMPLETED = 'health:check:completed',
}

/**
 * Classe responsável por gerenciar o registro e descoberta de serviços
 */
class ServiceRegistry extends EventEmitter {
  // Mapa de serviços registrados
  private services: Map<string, ServiceInfo> = new Map();
  
  // Cache Redis (opcional - usado apenas se configurado)
  private redisClient: any = null;
  
  // Intervalo de verificação de saúde (30 segundos por padrão)
  private readonly healthCheckInterval: number = 30000;
  
  // Timer para verificações periódicas
  private healthCheckTimer: NodeJS.Timeout | null = null;
  
  // Flag para indicar se o registro está inicializado
  private initialized: boolean = false;

  constructor() {
    super();
    
    // Configurar Redis se disponível
    this.setupRedis();
  }

  /**
   * Configura o cliente Redis se as configurações estiverem disponíveis
   */
  private async setupRedis(): Promise<void> {
    if (env.REDIS_HOST && env.NODE_ENV === 'production') {
      try {
        this.redisClient = await createRedisClient();
        logger.info('Redis configurado para o registro de serviços');
      } catch (error) {
        logger.error('Falha ao configurar Redis para o registro de serviços:', error);
        this.redisClient = null;
      }
    }
  }

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
    
    // Persistir no Redis se disponível
    this.persistToRedis();
  }

  /**
   * Persiste o estado atual dos serviços no Redis
   */
  private async persistToRedis(): Promise<void> {
    if (!this.redisClient) return;
    
    try {
      const servicesData = JSON.stringify(Array.from(this.services.entries()));
      await this.redisClient.set('service_registry:services', servicesData);
      logger.debug('Estado do registro de serviços persistido no Redis');
    } catch (error) {
      logger.error('Erro ao persistir registro de serviços no Redis:', error);
    }
  }

  /**
   * Carrega o estado dos serviços do Redis
   */
  private async loadFromRedis(): Promise<boolean> {
    if (!this.redisClient) return false;
    
    try {
      const servicesData = await this.redisClient.get('service_registry:services');
      
      if (servicesData) {
        const servicesEntries = JSON.parse(servicesData);
        this.services = new Map(servicesEntries);
        logger.info('Estado do registro de serviços carregado do Redis');
        return true;
      }
    } catch (error) {
      logger.error('Erro ao carregar registro de serviços do Redis:', error);
    }
    
    return false;
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
    
    // Registrar o serviço - ARMAZENAR APENAS O CAMINHO, NÃO A URL COMPLETA
    const serviceInfo: ServiceInfo = {
      ...service,
      url,
      healthCheck, // CORREÇÃO: Armazenar apenas o caminho do health check
      isActive: false,
      lastCheck: new Date(),
    };
    
    this.services.set(service.id, serviceInfo);
    
    logger.info(`Serviço ${service.id} registrado com URL ${url}`);
    
    // Emitir evento de registro
    this.emit(ServiceRegistryEvent.SERVICE_REGISTERED, serviceInfo);
    
    // Persistir no Redis se disponível
    this.persistToRedis();
    
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
    
    const serviceInfo = this.services.get(serviceId);
    this.services.delete(serviceId);
    
    logger.info(`Serviço ${serviceId} removido do registro`);
    
    // Emitir evento de remoção
    if (serviceInfo) {
      this.emit(ServiceRegistryEvent.SERVICE_UNREGISTERED, serviceInfo);
    }
    
    // Persistir no Redis se disponível
    this.persistToRedis();
    
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
    
    this.emit(ServiceRegistryEvent.HEALTH_CHECK_STARTED, {
      timestamp: new Date(),
      services: this.getAllServices()
    });
    
    const promises = Array.from(this.services.keys()).map(
      serviceId => this.checkServiceHealth(serviceId)
    );
    
    await Promise.allSettled(promises);
    
    const activeCount = Array.from(this.services.values()).filter(s => s.isActive).length;
    const totalCount = this.services.size;
    
    logger.info(`Verificação de saúde concluída: ${activeCount}/${totalCount} serviços ativos`);
    
    this.emit(ServiceRegistryEvent.HEALTH_CHECK_COMPLETED, {
      timestamp: new Date(),
      totalServices: totalCount,
      activeServices: activeCount,
      services: this.getAllServices()
    });
    
    // Persistir no Redis após atualização
    this.persistToRedis();
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
    
    return await checkServiceHealthStatus(service);
  }

  /**
   * Encerra o registro de serviços
   */
  public shutdown(): void {
    this.stopHealthChecks();
    this.services.clear();
    this.initialized = false;
    
    // Fechar conexão Redis se existir
    if (this.redisClient) {
      this.redisClient.quit();
      this.redisClient = null;
    }
    
    logger.info('Registro de serviços encerrado');
  }
}

// Função auxiliar para verificar a saúde de um serviço
async function checkServiceHealthStatus(service: ServiceInfo): Promise<boolean> {
  try {
    // SOLUÇÃO: Garantir que não haja duplicação da URL base
    let healthUrl;
    if (service.healthCheck.includes('http://') || service.healthCheck.includes('https://')) {
      // Se o healthCheck já contém uma URL completa, use-a diretamente
      healthUrl = service.healthCheck;
    } else {
      // Caso contrário, combine com a URL base
      healthUrl = service.url + (service.healthCheck.startsWith('/') ? service.healthCheck : `/${service.healthCheck}`);
    }
    
    logger.debug(`Verificando saúde do serviço ${service.id} em ${healthUrl}`);
    
    const response = await axios.get(healthUrl, { 
      timeout: 10000,  // 10 segundos
      validateStatus: () => true // Aceitar qualquer status para logging
    });
    
    logger.debug(`Resposta de saúde do ${service.id}: ${response.status}`);
    return response.status === 200;
  } catch (error: any) {
    logger.error(`Erro ao verificar saúde do serviço ${service.id}: ${error.message}`);
    return false;
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

// Para permitir a escuta de eventos
export function onServiceRegistryEvent(
  event: ServiceRegistryEvent, 
  listener: (...args: any[]) => void
): void {
  serviceRegistry.on(event, listener);
}

// Exportar a instância do registry para testes e acesso avançado
export { serviceRegistry };