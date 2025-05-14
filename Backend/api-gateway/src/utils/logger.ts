import winston from 'winston';
import { format } from 'winston';
import path from 'path';
import { env, isProd } from '../config/env';

// Diretório para os logs
const logDir = path.resolve(process.cwd(), 'logs');

// Configuração de formatos
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

// Formato para console (colorido e mais legível para desenvolvimento)
const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}] ${message} ${metaString}`;
  })
);

// Criação do logger
const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: logFormat,
  defaultMeta: { service: 'api-gateway' },
  transports: [
    // Escrever logs de erro em arquivos
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'),
      level: 'error'
    }),
    
    // Escrever logs combinados em arquivos
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log') 
    }),
    
    // Log específico para api-gateway
    new winston.transports.File({ 
      filename: path.join(logDir, 'api-gateway.log')
    })
  ]
});

// Se não estamos em produção, adiciona o console como transporte
if (!isProd) {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat
    })
  );
}

export default logger;