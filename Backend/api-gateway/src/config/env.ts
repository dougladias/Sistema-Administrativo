import dotenv from 'dotenv';
import path from 'path';

// Primeiro tentamos carregar o .env local do API Gateway
dotenv.config();
// Depois tentamos o .env compartilhado, se necessário
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Função auxiliar para pegar valores booleanos de variáveis de ambiente
const getBooleanEnv = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
};

// Exportar constantes para verificação do ambiente
export const isProd = process.env.NODE_ENV === 'production';
export const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
export const isTest = process.env.NODE_ENV === 'test';

// Exportar todas as variáveis de ambiente tipadas
export const env = {
  // Configurações básicas
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 3005,
  
  // URLs dos microserviços
  WORKER_SERVICE_URL: process.env.WORKER_SERVICE_URL || 'http://localhost:4014',
  DOCUMENT_SERVICE_URL: process.env.DOCUMENT_SERVICE_URL || 'http://localhost:4011',
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:4010',
  
  // Configurações de segurança
  JWT_SECRET: process.env.JWT_SECRET || 'desenvolvimento_nao_usar_em_producao',
  ENABLE_RATE_LIMIT: getBooleanEnv('ENABLE_RATE_LIMIT', true),
  API_RATE_LIMIT: Number(process.env.API_RATE_LIMIT) || 100,
  API_RATE_LIMIT_WINDOW_MS: Number(process.env.API_RATE_LIMIT_WINDOW_MS) || 60000, 
  
  // Configurações de logging
  LOG_LEVEL: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  ENABLE_REQUEST_LOGGING: getBooleanEnv('ENABLE_REQUEST_LOGGING', true),
  
  // Configurações de timeout para proxies (em milissegundos)
  WORKER_SERVICE_TIMEOUT: Number(process.env.WORKER_SERVICE_TIMEOUT) || 30000,
  DOCUMENT_SERVICE_TIMEOUT: Number(process.env.DOCUMENT_SERVICE_TIMEOUT) || 45000, 
  AUTH_SERVICE_TIMEOUT: Number(process.env.AUTH_SERVICE_TIMEOUT) || 10000, 
  
  // Configurações de desenvolvimento
  SERVICE_AUTOSTART: getBooleanEnv('SERVICE_AUTOSTART', false),
  
  // Configurações de cors
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  CORS_METHODS: process.env.CORS_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE',
  
  // Configurações de compressão
  ENABLE_COMPRESSION: getBooleanEnv('ENABLE_COMPRESSION', true)
};