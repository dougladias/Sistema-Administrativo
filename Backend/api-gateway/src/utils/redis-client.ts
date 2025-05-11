import { createClient } from 'redis';
import { env } from '../config/env';
import { logger } from '../config/logger';

// Função para criar e conectar cliente Redis
export async function createRedisClient() {
  try {
    // Configuração do cliente Redis
    const url = `redis://${env.REDIS_PASSWORD ? `:${env.REDIS_PASSWORD}@` : ''}${env.REDIS_HOST}:${env.REDIS_PORT || 6379}`;
    
    const client = createClient({
      url,
    });

    // Configurar handlers de eventos
    client.on('error', (err) => {
      logger.error('Redis client error:', err);
    });

    // Configurar eventos de conexão
    client.on('connect', () => {
      logger.info('Redis client connected');
    });

    // Configurar eventos de desconexão
    client.on('reconnecting', () => {
      logger.warn('Redis client reconnecting');
    });

    // Configurar eventos de desconexão
    client.on('ready', () => {
      logger.info('Redis client ready');
    });

    // Conectar ao servidor Redis
    await client.connect();
    
    return client;
  } catch (error) {
    logger.error('Failed to create Redis client:', error);
    throw error;
  }
}

// Função para criar um cliente Redis com fallback de memória
// Útil para desenvolvimento ou quando Redis não está disponível
export async function createRedisClientWithFallback() {
  if (env.REDIS_HOST) {
    try {
      return await createRedisClient();
    } catch (error) {
      logger.warn('Using memory fallback for Redis:', error);
      return createMemoryFallback();
    }
  } else {
    logger.info('Redis not configured, using memory fallback');
    return createMemoryFallback();
  }
}

// Implementação de fallback em memória com a mesma API do Redis
function createMemoryFallback() {
  const store = new Map();
  
  return {
    async get(key: string) {
      return store.get(key);
    },
    async set(key: string, value: string) {
      store.set(key, value);
      return 'OK';
    },
    async del(key: string) {
      const result = store.delete(key);
      return result ? 1 : 0;
    },
    async quit() {
      store.clear();
      return 'OK';
    },
    on(event: string, callback: Function) {
      // No-op para eventos
      return this;
    }
  };
}