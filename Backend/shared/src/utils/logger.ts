import winston from 'winston';
import { hostname } from 'os';
import * as path from 'path';
import * as fs from 'fs';

// Níveis de log personalizados (mais detalhados que os padrões)
export enum LogLevel {
  ERROR = 'error',     // Erros críticos que exigem atenção imediata
  WARN = 'warn',       // Avisos importantes que não quebram a aplicação
  INFO = 'info',       // Informações gerais sobre o funcionamento
  HTTP = 'http',       // Requisições HTTP específicas
  DEBUG = 'debug',     // Informações detalhadas para desenvolvimento
  TRACE = 'trace'      // Informações minuciosas para depuração
}

// Interface para metadados do logger
export interface LoggerMetadata {
  service: string;
  environment: string;
  host: string;
  [key: string]: any;
}

// Configurações para logs
export interface LoggerOptions {
  serviceName: string;
  environment?: string;
  logLevel?: LogLevel;
  logToConsole?: boolean;
  logToFile?: boolean;
  logPath?: string;
  logFileName?: string;
  maxFiles?: number;
  maxSize?: number;
  customMetadata?: Record<string, any>;
}

// Formatação de cores para diferentes níveis
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'cyan',
  trace: 'gray'
};

// Adicionar cores ao winston
winston.addColors(colors);

/**
 * Cria um logger personalizado para um microsserviço
 */
export function createLogger(options: LoggerOptions): winston.Logger {
  const {
    serviceName,
    environment = process.env.NODE_ENV || 'development',
    logLevel = (environment === 'production' ? LogLevel.INFO : LogLevel.DEBUG),
    logToConsole = true,
    logToFile = environment === 'production',
    logPath = 'logs',
    logFileName = `${serviceName}.log`,
    maxFiles = 10,
    maxSize = 5242880, // 5MB
    customMetadata = {}
  } = options;

  // Garantir que o diretório de logs exista
  if (logToFile) {
    const logDir = path.resolve(process.cwd(), logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  // Metadata comum para todos os logs
  const defaultMetadata: LoggerMetadata = {
    service: serviceName,
    environment,
    host: hostname(),
    ...customMetadata
  };

  // Formato de console para desenvolvimento
  const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(info => {
      const { timestamp, level, message, ...meta } = info;
      // Omitir metadados padrão na saída para console 
      const { service, environment, host, ...restMeta } = meta;
      
      let metaStr = '';
      if (Object.keys(restMeta).length > 0) {
        metaStr = ` ${JSON.stringify(restMeta)}`;
      }
      
      return `${timestamp} [${level}] [${service}] ${message}${metaStr}`;
    })
  );

  // Formato JSON para logs em arquivo (mais fácil de processar)
  const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.json()
  );

  // Criar transports com base nas configurações
  const transports: winston.transport[] = [];

  // Console transport (para desenvolvimento)
  if (logToConsole) {
    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
        handleExceptions: true,
      })
    );
  }

  // File transports (para produção e persistência)
  if (logToFile) {
    const logFilePath = path.join(logPath, logFileName);
    const errorLogFilePath = path.join(logPath, `error-${logFileName}`);
    
    // Arquivo para todos os logs
    transports.push(
      new winston.transports.File({
        filename: logFilePath,
        format: fileFormat,
        maxsize: maxSize,
        maxFiles,
        tailable: true
      })
    );
    
    // Arquivo separado apenas para erros
    transports.push(
      new winston.transports.File({
        filename: errorLogFilePath,
        level: LogLevel.ERROR,
        format: fileFormat,
        maxsize: maxSize,
        maxFiles,
        tailable: true
      })
    );
  }

  // Criar e configurar o logger
  const logger = winston.createLogger({
    level: logLevel,
    levels: {
      error: 0,
      warn: 1,
      info: 2,
      http: 3,
      debug: 4,
      trace: 5,
    },
    defaultMeta: defaultMetadata,
    transports,
    exitOnError: false // Não encerrar em caso de erro não tratado
  });

  // Adicionar métodos para categorias específicas
  const enhancedLogger = logger as winston.Logger & {
    request: (message: string, meta?: any) => void;
    database: (message: string, meta?: any) => void;
    security: (message: string, meta?: any) => void;
    performance: (message: string, meta?: any) => void;
  };

  // Logger específico para requisições HTTP
  enhancedLogger.request = (message: string, meta: any = {}) => {
    logger.log({
      level: LogLevel.HTTP,
      message,
      category: 'request',
      ...meta
    });
  };

  // Logger específico para operações de banco de dados
  enhancedLogger.database = (message: string, meta: any = {}) => {
    logger.log({
      level: LogLevel.DEBUG,
      message,
      category: 'database',
      ...meta
    });
  };

  // Logger específico para eventos de segurança
  enhancedLogger.security = (message: string, meta: any = {}) => {
    logger.log({
      level: LogLevel.WARN,
      message,
      category: 'security',
      ...meta
    });
  };

  // Logger específico para métricas de performance
  enhancedLogger.performance = (message: string, meta: any = {}) => {
    logger.log({
      level: LogLevel.DEBUG,
      message,
      category: 'performance',
      ...meta
    });
  };

  // Criar child logger com metadados adicionais
  enhancedLogger.child = (childMeta) => {
    const childLogger = logger.child(childMeta) as winston.Logger & {
      request: (message: string, meta?: any) => void;
      database: (message: string, meta?: any) => void;
      security: (message: string, meta?: any) => void;
      performance: (message: string, meta?: any) => void;
    };
    
    // Copiar os métodos estendidos para o child logger
    childLogger.request = (message: string, meta: any = {}) => {
      childLogger.log({
        level: LogLevel.HTTP,
        message,
        category: 'request',
        ...meta
      });
    };

    childLogger.database = (message: string, meta: any = {}) => {
      childLogger.log({
        level: LogLevel.DEBUG,
        message,
        category: 'database',
        ...meta
      });
    };

    childLogger.security = (message: string, meta: any = {}) => {
      childLogger.log({
        level: LogLevel.WARN,
        message,
        category: 'security',
        ...meta
      });
    };

    childLogger.performance = (message: string, meta: any = {}) => {
      childLogger.log({
        level: LogLevel.DEBUG,
        message,
        category: 'performance',
        ...meta
      });
    };

    return childLogger;
  };

  return enhancedLogger;
}

/**
 * Middleware para logar requisições HTTP
 */
export function requestLoggerMiddleware(logger: winston.Logger) {
  return (req: any, res: any, next: Function) => {
    // Criar um ID de requisição ou usar um existente
    const requestId = req.headers['x-request-id'] || 
                     `req-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    
    // Definir o ID no header da resposta
    res.setHeader('X-Request-ID', requestId);
    
    // Registrar o início da requisição
    const startTime = Date.now();
    
    // Informações básicas
    const logMeta = {
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent']
    };
    
    // Logar início da requisição
    logger.http(`${req.method} ${req.originalUrl} - Início`, logMeta);
    
    // Interceptar a finalização da resposta
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      // Restaurar o método original
      res.end = originalEnd;
      
      // Calcular a duração
      const duration = Date.now() - startTime;
      
      // Dados da resposta
      const responseData = {
        ...logMeta,
        statusCode: res.statusCode,
        duration: `${duration}ms`
      };
      
      // Escolher o nível de log baseado no status code
      const level = res.statusCode >= 500 ? 'error' : 
                   res.statusCode >= 400 ? 'warn' : 'http';
      
      // Logar a finalização da requisição
      logger.log({
        level,
        message: `${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`,
        ...responseData
      });
      
      // Chamar o método original
      return originalEnd.apply(this, args);
    };
    
    // Anexar logger à requisição para uso nos controllers
    req.logger = logger.child({ requestId });
    req.requestId = requestId;
    
    next();
  };
}

/**
 * Formata um erro para log 
 */
export function formatError(error: any): any {
  const formattedError: any = {
    message: error.message || 'Unknown error',
    name: error.name || 'Error'
  };
  
  // Incluir stack trace se disponível
  if (error.stack) {
    formattedError.stack = error.stack;
  }
  
  // Incluir detalhes específicos de tipos de erro
  if (error.code) {
    formattedError.code = error.code;
  }
  
  if (error.statusCode) {
    formattedError.statusCode = error.statusCode;
  }
  
  // Para erros do Mongoose/MongoDB
  if (error.name === 'ValidationError' && error.errors) {
    formattedError.validationErrors = Object.keys(error.errors).reduce((acc, key) => {
      acc[key] = error.errors[key].message;
      return acc;
    }, {} as Record<string, string>);
  }
  
  if (error.name === 'MongoServerError' && error.code === 11000) {
    formattedError.duplicateKey = error.keyValue;
  }
  
  return formattedError;
}

/**
 * Wrapper para logar e rethrow exceptions
 */
export function withErrorLogging<T>(
  logger: winston.Logger, 
  fn: () => Promise<T>, 
  errorMessage = 'Operação falhou'
): Promise<T> {
  return fn().catch(error => {
    logger.error(`${errorMessage}: ${error.message}`, formatError(error));
    throw error;
  });
}

/**
 * Cria um logger silencioso para testes
 */
export function createSilentLogger(): winston.Logger {
  return winston.createLogger({
    silent: true,
    transports: [new winston.transports.Console()]
  }) as any;
}

/**
 * Cria um logger padrão
 */
export function createDefaultLogger(serviceName: string): winston.Logger {
  return createLogger({
    serviceName,
    environment: process.env.NODE_ENV,
    logLevel: (process.env.LOG_LEVEL as LogLevel) || 
              (process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG),
    logToConsole: true,
    logToFile: process.env.NODE_ENV === 'production'
  });
}

// Export default logger for quick access
export default createDefaultLogger('shared-library');