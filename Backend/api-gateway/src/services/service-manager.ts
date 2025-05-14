import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { env, isDev } from '../config/env';
import logger from '../utils/logger';
import { setServiceStatus } from './service-registry';


 // Interface para configuração de um serviço
interface ServiceConfig {
  name: string;
  command: string;
  args: string[];
  cwd: string;
  env?: Record<string, string>;
  autoStart?: boolean;
}


// Mapa de processos ativos para cada serviço
const serviceProcesses: Record<string, ChildProcess> = {};


// Configurações para iniciar os serviços automaticamente em ambiente de desenvolvimento
const servicesConfig: Record<string, ServiceConfig> = {
  authService: {
    name: 'Auth Service',
    command: 'npm',
    args: ['run', 'start:dev'],
    cwd: join(__dirname, '../../../auth-service'),
    autoStart: true
  },
  // Worker Service
  workerService: {
    name: 'Worker Service',
    command: 'npm',
    args: ['run', 'start:dev'],
    cwd: join(__dirname, '../../../worker-service'),
    autoStart: true
  },
  // Document Service
  documentService: {
    name: 'Document Service',
    command: 'npm',
    args: ['run', 'start:dev'],
    cwd: join(__dirname, '../../../document-service'),
    autoStart: true
  }
};


// Inicia um serviço específico
async function startService(serviceName: keyof typeof servicesConfig): Promise<boolean> {
  if (!isDev) {
    logger.warn(`Não é possível iniciar o serviço ${serviceName} fora do ambiente de desenvolvimento`);
    return false;
  }

  // Verifica se o serviço já está em
  if (serviceProcesses[serviceName]) {
    logger.warn(`Serviço ${serviceName} já está em execução`);
    return true;
  }
  // Verifica se a configuração do serviço existe
  const serviceConfig = servicesConfig[serviceName];
  if (!serviceConfig) {
    logger.error(`Configuração não encontrada para o serviço ${serviceName}`);
    return false;
  }
 // Verifica se o serviço está configurado para iniciar automaticamente
  try {
    logger.info(`Iniciando serviço: ${serviceConfig.name}`);

    const childProc: ChildProcess = spawn(serviceConfig.command, serviceConfig.args, {
      cwd: serviceConfig.cwd,
      env: { ...process.env, ...serviceConfig.env },
      stdio: 'pipe'
    });

    // Verifica se o processo foi iniciado corretamente
    serviceProcesses[serviceName] = childProc;

    // Configurar handlers para saída do processo
    childProc.stdout?.on('data', (data) => {
      logger.debug(`[${serviceConfig.name}] ${data.toString().trim()}`);
    });

    // Configurar handlers para erro do processo
    childProc.stderr?.on('data', (data) => {
      logger.warn(`[${serviceConfig.name}] ${data.toString().trim()}`);
    });

    // Configurar handler para término do processo
    childProc.on('close', (code) => {
      if (code !== 0) {
        logger.error(`Serviço ${serviceConfig.name} encerrou com código ${code}`);
        setServiceStatus(serviceName as any, false, undefined, `Processo encerrado com código ${code}`);
      } else {
        logger.info(`Serviço ${serviceConfig.name} encerrado normalmente`);
      }
      delete serviceProcesses[serviceName];
    });

    // Marcar serviço como ativo após inicialização
    setServiceStatus(serviceName as any, true);
    
    return true;
  } catch (error) {
    logger.error(`Erro ao iniciar serviço ${serviceConfig.name}:`, error);
    return false;
  }
}


// Para um serviço específico
async function stopService(serviceName: keyof typeof servicesConfig): Promise<boolean> {
  const childProc = serviceProcesses[serviceName];
  
  // Verifica se o serviço está em execução
  if (!childProc) {
    logger.warn(`Tentativa de parar serviço que não está em execução: ${serviceName}`);
    return false;
  }

  // Verifica se a configuração do serviço existe
  return new Promise((resolve) => {
    childProc.on('close', () => {
      logger.info(`Serviço ${serviceName} encerrado com sucesso`);
      delete serviceProcesses[serviceName];
      setServiceStatus(serviceName as any, false);
      resolve(true);
    });

    // Envia um sinal para terminar o processo
    childProc.kill('SIGTERM');

    // Timeout para forçar o encerramento se não responder
    setTimeout(() => {
      if (serviceProcesses[serviceName]) {
        logger.warn(`Forçando encerramento do serviço ${serviceName}`);
        childProc.kill('SIGKILL');
      }
    }, 5000);
  });
}


// Inicia todos os serviços configurados para inicialização automática 
async function startAllServices(): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};

  // Filtra os serviços que devem iniciar automaticamente
  const servicesToStart = Object.entries(servicesConfig)
    .filter(([_, config]) => config.autoStart)
    .map(([name, _]) => name);

  // Inicia cada serviço
  for (const serviceName of servicesToStart) {
    results[serviceName] = await startService(serviceName as keyof typeof servicesConfig);
  }

  return results;
}


// Para todos os serviços em execução
async function stopAllServices(): Promise<void> {
  const runningServices = Object.keys(serviceProcesses);
  
  await Promise.all(
    runningServices.map(serviceName => 
      stopService(serviceName as keyof typeof servicesConfig)
    )
  );
}

// Exportar o gerenciador de serviços
export const serviceManager = {
  startService,
  stopService,
  startAllServices,
  stopAllServices,
  getRunningServices: () => Object.keys(serviceProcesses)
};