import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../../../.env') });


export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.BENEFITS_SERVICE_PORT || '4003', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/benefits-service',
  jwtSecret: process.env.JWT_SECRET || 'sua_chave_secreta_muito_longa_e_complexa_aqui',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  apiGatewayUrl: process.env.API_GATEWAY_URL || '',
  serviceRegistrationInterval: parseInt(process.env.SERVICE_REGISTRATION_INTERVAL || '300000', 10), // 5 minutos
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Validar variáveis de ambiente críticas
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}