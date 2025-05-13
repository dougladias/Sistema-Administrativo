import winston, { transport, transports as winstonTransports } from 'winston';
import { env } from './env';

// Níveis de log
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Determinar o nível baseado no ambiente
const level = () => {
  return env.nodeEnv === 'production' ? 'info' : 'debug';
};

// Cores para os diferentes níveis
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Adicionar cores ao winston
winston.addColors(colors);

// Formato para os logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf(
    ({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level}]: ${message} ${
        Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
      }`;
    }
  )
);

// Transportes (destinos) para os logs
const transports: transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.printf(
        ({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
          }`;
        }
      )
    ),
  }),
];

// Adicionar logs em arquivo no ambiente de produção
if (env.nodeEnv === 'production') {
  transports.push(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  );
}

// Criar e exportar o logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  defaultMeta: { service: 'benefits-service' },
  transports,
});

export default logger;