import { exec } from 'child_process';
import path from 'path';
import axios from 'axios';
import logger from '../utils/logger';
import { env } from '../config/env';
import fs from 'fs';

// Carregar configuração dos serviços
const servicesConfig = require('../config/services-config.json');

// Interface para informações dos serviços
interface ServiceInfo {
  name: string;
  path: string;
  url: string;
  isRunning: boolean;
}

// Gerenciamento de serviços
class ServiceManager {
  private services: Map<string, ServiceInfo>;

  constructor() {
    this.services = new Map();

    // Registrar todos os serviços
    this.registerService('workers', '../../../worker-service', `http://localhost:${process.env.WORKER_SERVICE_PORT || 4014}`);
    this.registerService('document', '../../../document-service', env.services.document);
    this.registerService('auth', '../../../auth-service', env.services.auth);
    this.registerService('benefits', '../../../beneficit-service', env.services.benefits);
    // Registrar outros serviços conforme necessário
  }

  // Registrar um novo serviço
  private registerService(name: string, relativePath: string, url: string) {
    const servicePath = path.resolve(__dirname, relativePath);
    logger.info(`Registrando serviço ${name} no caminho: ${servicePath}`);
    
    // Verificar se o diretório existe
    if (fs.existsSync(servicePath)) {
      logger.info(`Diretório existe: ${servicePath}`);
    } else {
      logger.error(`Diretório não existe: ${servicePath}`);
    }
    
    this.services.set(name, {
      name,
      path: servicePath,
      url,
      isRunning: false
    });
  }

  // Verificar se um serviço está em execução
  public async checkServiceHealth(serviceName: string): Promise<boolean> {
    const service = this.services.get(serviceName);
    
    if (!service) {
      logger.error(`Serviço ${serviceName} não registrado`);
      return false;
    }

    try {
      const response = await axios.get(`${service.url}/health`, { timeout: 2000 });
      const isRunning = response.status === 200;
      
      // Atualizar o status do serviço
      service.isRunning = isRunning;
      this.services.set(serviceName, service);
      
      return isRunning;
    } catch (error) {
      service.isRunning = false;
      this.services.set(serviceName, service);
      return false;
    }
  }

  // Iniciar um serviço específico
  public async startService(serviceName: string): Promise<boolean> {
    const service = this.services.get(serviceName);
    
    if (!service) {
      logger.error(`Serviço ${serviceName} não registrado`);
      return false;
    }

    // Verificar se o serviço já está em execução
    const isRunning = await this.checkServiceHealth(serviceName);
    
    if (isRunning) {
      logger.info(`Serviço ${serviceName} já está em execução`);
      return true;
    }

    logger.info(`Iniciando serviço ${serviceName}...`);
    
    try {
      // Verificar se o package.json existe no diretório do serviço
      const packageJsonPath = path.join(service.path, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        logger.error(`package.json não encontrado em ${packageJsonPath}`);
        return false;
      } else {
        logger.info(`package.json encontrado em ${packageJsonPath}`);
      }

      // Obter configuração do serviço
      const serviceConfig = servicesConfig[service.name + '-service'] || { port: 3000 };
      const port = serviceConfig?.port || 3000;
      
      // Comando para iniciar o serviço
      const command = process.platform === 'win32'
        ? `start cmd /k "cd /d "${service.path}" && npm run dev"`
        : `cd "${service.path}" && PORT=${port} npm run dev &`;
      
      logger.info(`Executando comando: ${command}`);
      
      // Executar o comando em uma nova janela de comando no Windows
      // ou em background no Unix
      exec(command, (error, stdout, stderr) => {
        if (error) {
          logger.error(`Falha ao iniciar serviço ${serviceName}:`, error);
          if (stdout) logger.info(`Comando stdout: ${stdout}`);
          if (stderr) logger.error(`Comando stderr: ${stderr}`);
        } else {
          logger.info(`Comando de início do serviço ${serviceName} executado com sucesso`);
        }
      });
      
      // Aguardar um tempo para o serviço iniciar
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Verificar se o serviço está respondendo
      const serviceRunning = await this.checkServiceHealth(serviceName);
      if (serviceRunning) {
        logger.info(`Serviço ${serviceName} está em execução`);
        return true;
      } else {
        logger.warn(`Serviço ${serviceName} pode não ter iniciado corretamente`);
        return false;
      }
    } catch (error) {
      logger.error(`Erro ao iniciar serviço ${serviceName}:`, error);
      return false;
    }
  }

  // Iniciar todos os serviços registrados
  public async startAllServices(): Promise<void> {
    if (!env.serviceAutostart) {
      logger.info('Início automático de serviços desativado, pulando...');
      return;
    }

    logger.info('Iniciando todos os serviços registrados...');
    
    const startPromises = [];
    
    for (const [serviceName] of this.services) {
      // Iniciar cada serviço e armazenar a promessa
      startPromises.push(this.startService(serviceName));
    }
    
    // Aguardar o início de todos os serviços
    await Promise.all(startPromises);
    
    logger.info('Todos os serviços foram iniciados');
  }

  // Obter status de todos os serviços
  public async getServicesStatus(): Promise<Record<string, boolean>> {
    const status: Record<string, boolean> = {};
    
    for (const [serviceName] of this.services) {
      status[serviceName] = await this.checkServiceHealth(serviceName);
    }
    
    return status;
  }
}

// Exportar uma instância do gerenciador de serviços
export const serviceManager = new ServiceManager();

export default serviceManager;