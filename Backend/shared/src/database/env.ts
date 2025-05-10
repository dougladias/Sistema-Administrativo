import * as dotenv from 'dotenv';
import * as path from 'path';
import { z } from 'zod';

// Carrega o arquivo .env da raiz do projeto
const envPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: envPath });

// Schema para validação das variáveis de ambiente
const envSchema = z.object({
  // Variáveis relacionadas ao MongoDB
  mongoUri: z.string({
    required_error: "MongoDB URI é obrigatório no arquivo .env"
  }),
  // Outras variáveis opcionais
  mongoDbName: z.string().optional(),
  mongoUser: z.string().optional(),
  mongoPassword: z.string().optional(),

  // Variáveis gerais do ambiente
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.preprocess(val => Number(val), z.number().default(3000)),
});

function loadEnvironment() {
  try {
    const _env = {
      mongoUri: process.env.MONGO_URI || process.env.MONGODB_URI,
      mongoDbName: process.env.MONGODB_DBNAME,
      mongoUser: process.env.MONGODB_USER,
      mongoPassword: process.env.MONGODB_PASSWORD,
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
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

export const env = loadEnvironment();

export const isProd = env.nodeEnv === 'production';
export const isDev = env.nodeEnv === 'development';
export const isTest = env.nodeEnv === 'test';

export function getEnvVar(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue;
}

console.log(`🔧 Ambiente carregado: ${env.nodeEnv}`);