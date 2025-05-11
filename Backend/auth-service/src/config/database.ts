import { connectMongo, disconnectMongo, isConnected } from '../../../shared/src/database/mongoose';
import { env } from './env';
import { createLogger } from '../../../shared/src/utils/logger';

const logger = createLogger({ 
  serviceName: 'auth-service', 
  customMetadata: { module: 'database' } 
});

/**
 * Conecta ao banco de dados MongoDB
 */
export async function connectDB(): Promise<void> {
  try {
    // Verificar se já está conectado
    if (isConnected()) {
      logger.info('Já existe uma conexão com o banco de dados.');
      return;
    }

    logger.info(`Conectando ao MongoDB: ${maskUri(env.mongoUri)}`);
    await connectMongo(env.mongoUri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    });

    logger.info('✅ Conexão com o MongoDB estabelecida com sucesso');

    // Configurar handlers para encerramento adequado
    setupShutdownHandlers();
  } catch (error) {
    logger.error('❌ Falha ao conectar ao MongoDB:', error);
    throw error;
  }
}

/**
 * Encerra a conexão com o banco de dados
 */
export async function closeDB(): Promise<void> {
  try {
    logger.info('Encerrando conexão com o MongoDB...');
    await disconnectMongo();
    logger.info('✅ Conexão com o MongoDB encerrada com sucesso');
  } catch (error) {
    logger.error('❌ Erro ao encerrar conexão com o MongoDB:', error);
    throw error;
  }
}

/**
 * Configura handlers para encerramento da conexão com o banco de dados
 */
function setupShutdownHandlers(): void {
  const handleShutdown = async () => {
    try {
      await closeDB();
    } catch (err) {
      process.exit(1);
    }
  };

  // Evita adicionar múltiplos listeners
  if (process.listenerCount('SIGINT') === 0) {
    process.once('SIGINT', handleShutdown);
  }
  
  if (process.listenerCount('SIGTERM') === 0) {
    process.once('SIGTERM', handleShutdown);
  }
}

/**
 * Mascara a URI do MongoDB para log seguro (esconde senha)
 */
function maskUri(uri: string): string {
  if (!uri) return 'undefined';
  try {
    const parsedUri = new URL(uri);
    if (parsedUri.password) {
      return uri.replace(parsedUri.password, '********');
    }
    return uri;
  } catch (error) {
    return '[invalid uri format]';
  }
}

export default {
  connectDB,
  closeDB,
};