import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Carregar arquivo .env
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Schema para validação das variáveis de ambiente
const envSchema = z.object({
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.preprocess(val => Number(val), z.number().default(4010)),
  mongoUri: z.string({
    required_error: "MONGODB_URI é obrigatório no arquivo .env"
  }),
  
  // Configuração JWT
  jwtSecret: z.string({
    required_error: "JWT_SECRET é obrigatório no arquivo .env"
  }),
  jwtExpiresIn: z.string().default('1h'),
  jwtRefreshSecret: z.string({
    required_error: "JWT_REFRESH_SECRET é obrigatório no arquivo .env"
  }),
  jwtRefreshExpiresIn: z.string().default('7d'),
  
  // Configuração CORS
  corsOrigin: z.string().default('*'),
  
  // Rate limiting
  rateLimitWindowMs: z.preprocess(val => Number(val), z.number().default(15 * 60 * 1000)), // 15 minutos
  rateLimitMax: z.preprocess(val => Number(val), z.number().default(100)),
  
  // Logging
  logLevel: z.string().default('info'),
});

// Função para carregar e validar variáveis de ambiente
function loadEnvironment() {
  try {
    const _env = {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.AUTH_SERVICE_PORT || process.env.PORT,
      mongoUri: process.env.MONGODB_URI,
      jwtSecret: process.env.JWT_SECRET,
      jwtExpiresIn: process.env.JWT_EXPIRES_IN,
      jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
      jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
      corsOrigin: process.env.CORS_ORIGIN,
      rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS,
      rateLimitMax: process.env.RATE_LIMIT_MAX,
      logLevel: process.env.LOG_LEVEL,
    };

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

// Carregar e exportar variáveis de ambiente
export const env = loadEnvironment();

// Flags auxiliares
export const isProd = env.nodeEnv === 'production';
export const isDev = env.nodeEnv === 'development';
export const isTest = env.nodeEnv === 'test';