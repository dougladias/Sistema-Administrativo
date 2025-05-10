import dotenv from 'dotenv';
import path from 'path';

// Carregar arquivo .env
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Variáveis de ambiente básicas
export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.WORKER_SERVICE_PORT || '4014', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/worker-service',
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Verificar variáveis obrigatórias
if (!process.env.MONGODB_URI) {
  console.error('Erro: MONGODB_URI é obrigatório no arquivo .env');
  process.exit(1);
}