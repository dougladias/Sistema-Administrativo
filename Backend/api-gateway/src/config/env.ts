import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { z } from 'zod';

// Carrega o arquivo .env
const envPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: envPath });

// Schema para validação
const envSchema = z.object({
  // Ambiente
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(val => parseInt(val, 10)).default('4000'),
  
  // JWT Config
  JWT_SECRET: z.string({
    required_error: "JWT_SECRET é obrigatório no arquivo .env"
  }),
  JWT_EXPIRATION: z.string().default('1d'),
  
  // URLs dos Serviços
  AUTH_SERVICE_URL: z.string().default('http://localhost:4010'),
  DOCUMENT_SERVICE_URL: z.string().default('http://localhost:4011'),
  WORKER_SERVICE_URL: z.string().default('http://localhost:4014'),
  
  
  // Configurações de Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(val => parseInt(val, 10)).default('60000'),
  RATE_LIMIT_MAX: z.string().transform(val => parseInt(val, 10)).default('100'),

  // Aplicação
  APP_NAME: z.string().default('Globoo API Gateway'),
});

// Carrega e valida as variáveis de ambiente
function loadEnvironment() {
  try {
    const _env = {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      JWT_SECRET: process.env.JWT_SECRET,
      JWT_EXPIRATION: process.env.JWT_EXPIRATION,
      AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL,
      DOCUMENT_SERVICE_URL: process.env.DOCUMENT_SERVICE_URL,
      WORKER_SERVICE_URL: process.env.WORKER_SERVICE_URL,      
      RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
      RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
      APP_NAME: process.env.APP_NAME,
    };

    // Verifica se o arquivo .env existe
    return envSchema.parse(_env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Erro na validação das variáveis de ambiente:');
      error.errors.forEach(err => {
        console.error(`- ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error('❌ Erro ao carregar variáveis de ambiente:', error);
    }
    
    process.exit(1);
  }
}

// Carrega as variáveis de ambiente
export const env = {
  NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test',
  PORT: Number(process.env.PORT) || 3000,
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || '1h',
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || '',
  DOCUMENT_SERVICE_URL: process.env.DOCUMENT_SERVICE_URL || '',
  WORKER_SERVICE_URL: process.env.WORKER_SERVICE_URL || '',
  REDIS_HOST: process.env.REDIS_HOST || '',
  REDIS_PORT: process.env.REDIS_PORT || '',
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  REDIS_DB: process.env.REDIS_DB || '',
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS ? Number(process.env.RATE_LIMIT_WINDOW_MS) : undefined,
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX ? Number(process.env.RATE_LIMIT_MAX) : undefined,
  AUTH_RATE_LIMIT_MAX: process.env.AUTH_RATE_LIMIT_MAX ? Number(process.env.AUTH_RATE_LIMIT_MAX) : undefined,
  API_KEY: process.env.API_KEY || '',
  APP_NAME: process.env.APP_NAME || 'api-gateway'
};
export const isProd = env.NODE_ENV === 'production';
export const isDev = env.NODE_ENV === 'development';