import dotenv from 'dotenv';
import path from 'path';

// Carregar arquivo .env
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Variáveis de ambiente
export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.AUTH_SERVICE_PORT || '4002', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/auth-service',
  jwtSecret: process.env.JWT_SECRET || 'sua_chave_secreta_muito_longa_e_complexa_aqui',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'sua_chave_refresh_secreta_muito_longa_e_complexa_aqui',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '15000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Validar variáveis de ambiente obrigatórias
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

// Verifica se as variáveis de ambiente obrigatórias estão definidas
if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}